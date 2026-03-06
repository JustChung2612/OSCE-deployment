// controllers/examSubmission.controller.js
import ExamSubmission from "../models/examSubmission.model.js";
import PatientCase from "../models/patientCase.model.js";

// -------- helpers --------
const normalizeCheckbox = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((x) => String(x).trim()))].sort();
};

const isEqualCheckbox = (a, b) => {
  const A = normalizeCheckbox(a);
  const B = normalizeCheckbox(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

const gradeOneQuestion = ({ qDef, studentAnswer }) => {
  const kieu = qDef.kieu;
  const diem = Math.max(0, Number(qDef.diem) || 0);
  const correct = qDef.dap_an_dung;

  // text cannot be auto-graded
  if (kieu === "text") {
    return { isCorrect: null, autoScore: 0, needsManual: true };
  }

  if (kieu === "radio") {
    const ok = String(studentAnswer ?? "").trim() === String(correct ?? "").trim();
    return { isCorrect: ok, autoScore: ok ? diem : 0, needsManual: false };
  }

  if (kieu === "checkbox") {
    const ok = isEqualCheckbox(studentAnswer, correct);
    return { isCorrect: ok, autoScore: ok ? diem : 0, needsManual: false };
  }

  return { isCorrect: null, autoScore: 0, needsManual: false };
};

// ==================== ✅ SUBMIT (create or replace) ====================
// POST /api/exam-submissions/submit
export const submitExamSubmission = async (req, res) => {
  try {
    const { examRoomId, studentEmail, stations } = req.body;

    if (!examRoomId || !studentEmail || !Array.isArray(stations) || stations.length === 0) {
      return res.status(400).json({ message: "Thiếu dữ liệu submit (examRoomId, studentEmail, stations)." });
    }

    // stations[] expected shape:
    // [{ stationId, patientCaseId, answers: [{questionId, kieu, answer}] }]

    let totalAutoScore = 0;
    let totalManualScore = 0;
    let totalScore = 0;

    const gradedStations = [];

    for (const st of stations) {
      const { stationId, patientCaseId } = st || {};
      const submittedAnswers = Array.isArray(st?.answers) ? st.answers : [];

      if (!stationId || !patientCaseId) {
        return res.status(400).json({ message: "Thiếu stationId hoặc patientCaseId trong stations." });
      }

      const caseDoc = await PatientCase.findById(patientCaseId);
      if (!caseDoc) {
        return res.status(404).json({ message: "Không tìm thấy PatientCase để chấm." });
      }

      const questionDefs = Array.isArray(caseDoc.cau_hoi) ? caseDoc.cau_hoi : [];

      let stationAuto = 0;
      let stationManual = 0; // stays 0 until teacher grading
      let stationNeedsManual = false;

      const finalAnswers = submittedAnswers.map((a) => {
        const qid = Number(a.questionId);
        const qDef = questionDefs.find((q) => Number(q.id) === qid);

        // If question not found, keep but score 0
        if (!qDef) {
          return {
            questionId: qid,
            kieu: a.kieu,
            answer: a.answer ?? null,
            isCorrect: null,
            autoScore: 0,
            manualScore: null,
            comment: "",
          };
        }

        const { isCorrect, autoScore, needsManual } = gradeOneQuestion({
          qDef,
          studentAnswer: a.answer,
        });

        stationAuto += autoScore;
        if (needsManual) stationNeedsManual = true;

        return {
          questionId: qid,
          kieu: qDef.kieu,
          answer: a.answer ?? null,
          isCorrect,
          autoScore,
          manualScore: null,
          comment: "",
        };
      });

      const stationTotal = stationAuto + stationManual;

      totalAutoScore += stationAuto;
      totalManualScore += stationManual;
      totalScore += stationTotal;

      gradedStations.push({
        stationId,
        patientCaseId,
        answers: finalAnswers,
        autoScore: stationAuto,
        manualScore: stationManual,
        totalScore: stationTotal,
        needsManualGrading: stationNeedsManual,
        isFullyGraded: !stationNeedsManual,
      });
    }

    const hasManual = gradedStations.some((s) => s.needsManualGrading);
    const status = hasManual ? "needs_manual_grading" : "graded";

    // Upsert by (examRoomId + studentEmail)
    const saved = await ExamSubmission.findOneAndUpdate(
      { examRoomId, studentEmail: studentEmail.toLowerCase() },
      {
        $set: {
          examRoomId,
          studentEmail: studentEmail.toLowerCase(),
          stations: gradedStations,
          totalAutoScore,
          totalManualScore,
          totalScore,
          status,
          submittedAt: new Date(),
          gradedAt: status === "graded" ? new Date() : null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({
      message: "✅ Nộp bài thành công. Điểm trắc nghiệm đã được chấm tự động.",
      data: saved,
    });
  } catch (error) {
    console.error("❌ submitExamSubmission:", error);
    return res.status(500).json({ message: "Lỗi khi nộp bài.", error: error.message });
  }
};

// ==================== ✅ GET MY SUBMISSIONS ====================
// GET /api/exam-submissions/me?email=...
export const getMySubmissions = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Thiếu email." });

    const data = await ExamSubmission.find({ studentEmail: email.toLowerCase() })
      .populate("examRoomId")
      .sort({ submittedAt: -1 });

    return res.status(200).json({ message: "Fetched my submissions", count: data.length, data });
  } catch (error) {
    console.error("❌ getMySubmissions:", error);
    return res.status(500).json({ message: "Lỗi tải submissions.", error: error.message });
  }
};

// ==================== GET SUBMISSIONS BY ROOM (teacher list) ====================
// GET /api/exam-submissions/room/:roomId
export const getSubmissionsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const data = await ExamSubmission.find({ examRoomId: roomId })
      .populate("examRoomId")
      .sort({ submittedAt: -1 });

    return res.status(200).json({ message: "Fetched room submissions", count: data.length, data });
  } catch (error) {
    console.error("❌ getSubmissionsByRoom:", error);
    return res.status(500).json({ message: "Lỗi tải submissions theo phòng.", error: error.message });
  }
};

// ==================== ✅ GET ONE SUBMISSION (ResultPage) ====================
// GET /api/exam-submissions/:id
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await ExamSubmission.findById(id)
      .populate("examRoomId")
      .populate("stations.stationId")
      .populate("stations.patientCaseId");

    if (!data) return res.status(404).json({ message: "Không tìm thấy submission." });

    return res.status(200).json({ message: "Fetched submission", data });
  } catch (error) {
    console.error("❌ getSubmissionById:", error);
    return res.status(500).json({ message: "Lỗi tải submission.", error: error.message });
  }
};

// ==================== ✅ TEACHER GRADES ESSAY ====================
// PATCH /api/exam-submissions/:id/grade-essay
export const gradeEssayAnswers = async (req, res) => {
  try {
    const { id } = req.params;

    // payload example:
    // {
    //   stationId,
    //   grades: [{ questionId, manualScore, comment }]
    // }
    const { stationId, grades } = req.body;

    if (!stationId || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ message: "Thiếu stationId hoặc grades." });
    }

    const sub = await ExamSubmission.findById(id);
    if (!sub) return res.status(404).json({ message: "Không tìm thấy submission." });

    const station = sub.stations.find((s) => String(s.stationId) === String(stationId));
    if (!station) return res.status(404).json({ message: "Không tìm thấy station trong submission." });

    // apply teacher grades only for text questions
    for (const g of grades) {
      const qid = Number(g.questionId);
      const row = station.answers.find((a) => Number(a.questionId) === qid);

      if (!row) continue;
      if (row.kieu !== "text") continue;

      const ms = Number(g.manualScore);
      row.manualScore = Number.isFinite(ms) ? Math.max(0, ms) : 0;

      row.comment = String(g.comment || "");
    }

    // recompute station scores
    const stationAuto = station.answers.reduce((sum, a) => sum + (Number(a.autoScore) || 0), 0);
    const stationManual = station.answers.reduce((sum, a) => sum + (Number(a.manualScore) || 0), 0);
    station.autoScore = stationAuto;
    station.manualScore = stationManual;
    station.totalScore = stationAuto + stationManual;

    // station grading completeness
    const hasText = station.answers.some((a) => a.kieu === "text");
    
    station.isFullyGraded = allTextGraded;
    station.needsManualGrading = hasText && !allTextGraded;
    const allTextGraded =
          !hasText ||
          station.answers
    .filter((a) => a.kieu === "text")
    .every((a) => a.manualScore !== undefined && a.manualScore !== null && String(a.manualScore).trim() !== "");

    // recompute totals across submission
    sub.totalAutoScore = sub.stations.reduce((sum, s) => sum + (Number(s.autoScore) || 0), 0);
    sub.totalManualScore = sub.stations.reduce((sum, s) => sum + (Number(s.manualScore) || 0), 0);
    sub.totalScore = sub.totalAutoScore + sub.totalManualScore;

    const anyNeedsManual = sub.stations.some((s) => s.needsManualGrading);
    sub.status = anyNeedsManual ? "needs_manual_grading" : "graded";
    sub.gradedAt = sub.status === "graded" ? new Date() : null;

    await sub.save();

    const populated = await ExamSubmission.findById(sub._id)
      .populate("examRoomId")
      .populate("stations.stationId")
      .populate("stations.patientCaseId");

    return res.status(200).json({
      message: "✅ Chấm tự luận thành công.",
      data: sub,
    });
  } catch (error) {
    console.error("❌ gradeEssayAnswers:", error);
    return res.status(500).json({ message: "Lỗi chấm tự luận.", error: error.message });
  }
};
