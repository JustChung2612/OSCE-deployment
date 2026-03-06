// /pages/OsceStationPage/OsceStationPage.jsx
import "./osceStationPage.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Clock, FileText, AlertCircle, CheckCircle2, ArrowBigRight } from "lucide-react";
import { useUserStore } from "../../stores/useUserStore.js";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios.js";

/* ========= 🔀 SHUFFLE HELPERS (frontend-only) =========
   Goal: same student + same station + same case => stable order
   - Shuffle question order
   - Shuffle options per radio/checkbox question
   - Persist shuffle plan so Overview/Result can reproduce later
*/

const normalizeId = (v) => {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  // Mongo extended JSON
  if (v?.$oid) return String(v.$oid);
  return String(v);
};

const hashToUint32 = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return h >>> 0;
};

const mulberry32 = (a) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithRng = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildShufflePlan = ({ seedBase, questions }) => {
  const seed = hashToUint32(seedBase);
  const rng = mulberry32(seed);

  const qIds = questions.map((q) => q?.id).filter((x) => x !== undefined && x !== null);
  const questionOrder = shuffleWithRng(qIds, rng);

  const optionOrderByQuestionId = {};
  for (const q of questions) {
    const qid = q?.id;
    const opts = Array.isArray(q?.lua_chon) ? q.lua_chon : [];
    if ((q?.kieu === "radio" || q?.kieu === "checkbox") && opts.length > 1) {
      const optSeed = hashToUint32(`${seedBase}|q:${qid}|opts:${opts.length}`);
      const optRng = mulberry32(optSeed);
      optionOrderByQuestionId[qid] = shuffleWithRng(
        Array.from({ length: opts.length }, (_, i) => i),
        optRng
      );
    }
  }

  return {
    v: 1,
    seedBase,
    questionOrder,
    optionOrderByQuestionId,
    createdAt: Date.now(),
  };
};

const applyShuffleToQuestions = (questions, plan) => {
  if (!plan || !Array.isArray(plan.questionOrder)) return questions;
  const byId = new Map(questions.map((q) => [q?.id, q]));
  const ordered = plan.questionOrder.map((id) => byId.get(id)).filter(Boolean);
  const used = new Set(plan.questionOrder);
  const rest = questions.filter((q) => !used.has(q?.id));
  return [...ordered, ...rest];
};

const getShuffledOptions = (q, plan) => {
  const opts = Array.isArray(q?.lua_chon) ? q.lua_chon : [];
  if (!(q?.kieu === "radio" || q?.kieu === "checkbox")) return opts;
  if (!plan) return opts;
  const order = plan.optionOrderByQuestionId?.[q?.id];
  if (!Array.isArray(order) || order.length !== opts.length) return opts;
  return order.map((i) => opts[i]).filter((x) => x !== undefined);
};

const safeJsonParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const loadOrCreateShufflePlan = ({ storageKey, seedBase, questions }) => {
  const existing = safeJsonParse(localStorage.getItem(storageKey), null);
  if (existing?.v === 1 && existing?.seedBase === seedBase) return existing;

  const created = buildShufflePlan({ seedBase, questions });
  try {
    localStorage.setItem(storageKey, JSON.stringify(created));
  } catch {
    // ignore storage issues
  }
  return created;
};

/* ========= UI PRIMITIVES (same as before) ========= */
const Progress = ({ value = 0, className = "" }) => (
  <div className={["ui-progress", className].join(" ")}>
    <div className="ui-progress__bar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

/* ========= 🧩 UPDATED MAIN COMPONENT ========= */
const OsceStationPage = () => {
  const { tramId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const studentEmail = user?.email?.toLowerCase();

  // draft key to store per-room-progress (multi stations)
  const getDraftKey = (roomId) => `osce_draft_${roomId}_${studentEmail || "guest"}`;

  const loadDraft = (roomId) => {
    try {
      const raw = localStorage.getItem(getDraftKey(roomId));
      return raw ? JSON.parse(raw) : { examRoomId: roomId, studentEmail, stations: [] };
    } catch {
      return { examRoomId: roomId, studentEmail, stations: [] };
    }
  };

  const saveDraft = (roomId, draft) => {
    localStorage.setItem(getDraftKey(roomId), JSON.stringify(draft));
  };

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientCase, setPatientCase] = useState(null);
  const [nextStationId, setNextStationId] = useState(null);

  // ✅ Shuffle plan (stable per student + station + case)
  const [shufflePlan, setShufflePlan] = useState(null);

  // ✅ UPDATED: fetch station + assigned case together & respect OSCE rules
  useEffect(() => {
    if (!tramId) return;

    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Get station & the assigned case simultaneously
        const [stationRes, assignRes] = await Promise.all([
          axiosInstance.get(`/exam-stations/${tramId}`),
          axiosInstance.get(`/exam-stations/${tramId}/assign`),
        ]);

        const station = stationRes.data?.data;
        if (!station) throw new Error("Không tìm thấy trạm thi");

        // 🔁 Compute next station from parentRoom info
        let nextId = null;
        if (station.parentRoom && Array.isArray(station.parentRoom.stations)) {
          const list = station.parentRoom.stations;
          const currentIndex = list.findIndex((s) => s._id === tramId);
          if (currentIndex !== -1 && currentIndex < list.length - 1) {
            nextId = list[currentIndex + 1]._id;
          }
        }

        // Backend already applies the rule:
        // - 1 case  -> returns that case
        // - 2+ cases -> returns a random case
        const assigned = assignRes.data?.data || null;

        if (isMounted) {
          setExamData(station);
          setPatientCase(assigned || station.patientCaseIds?.[0] || null);
          setNextStationId(nextId);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải trạm/case:", err);
        if (isMounted) setError("Không thể tải dữ liệu trạm thi này");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tramId]);

  // ✅ NEW — always render from the assigned patient case
  const caseSource = patientCase || {};
  const caseData = caseSource?.benh_an_tinh_huong || {};
  const questions = caseSource?.cau_hoi || [];
  const examRoomId = examData?.parentRoom?._id; // comes from getExamStationById response

  // ✅ Create/load stable shuffle plan once we have case + question list
  useEffect(() => {
    if (!tramId) return;
    const identity = studentEmail || "guest";
    const caseId = normalizeId(patientCase?._id);
    if (!caseId) return;
    if (!Array.isArray(questions) || questions.length === 0) return;

    const storageKey = `osce_shuffle_v1:${identity}:${tramId}:${caseId}`;
    const seedBase = `${identity}|station:${tramId}|case:${caseId}`;
    const plan = loadOrCreateShufflePlan({ storageKey, seedBase, questions });
    setShufflePlan(plan);
  }, [studentEmail, tramId, patientCase?._id, questions.length]);

  const displayQuestions = useMemo(
    () => applyShuffleToQuestions(questions, shufflePlan),
    [questions, shufflePlan]
  );

  const totalQuestions = displayQuestions.length;

  // Save current station answers into local draft
  const persistCurrentStationToDraft = () => {
    if (!examRoomId) return false;
    if (!studentEmail) {
      toast.error("Bạn cần đăng nhập để nộp bài.");
      return false;
    }
    if (!patientCase?._id) {
      toast.error("Không tìm thấy bệnh án để lưu bài.");
      return false;
    }

    const draft = loadDraft(examRoomId);

    // convert answers state => array payload (use stable questionId, NOT display index)
    const source = displayQuestions.length ? displayQuestions : questions;
    const payloadAnswers = source.map((q, idx) => {
    const qid = q?.id;
    return {
      displayNo: idx + 1,              // ✅ số câu hiển thị (Câu 1/2/3...)
      questionId: qid,                 // ✅ id cố định để tìm câu trong data
      kieu: q?.kieu,
      answer: qid != null ? (answers[qid] ?? null) : null,
    };
  });

    const stationPayload = {
      stationId: tramId,
      patientCaseId: patientCase._id,
      answers: payloadAnswers,
      shufflePlan: shufflePlan || null,
    };

    // replace existing station entry if student revisits station
    const existingIndex = (draft.stations || []).findIndex(
      (s) => String(s.stationId) === String(tramId)
    );

    if (existingIndex !== -1) {
      draft.stations[existingIndex] = stationPayload;
    } else {
      draft.stations.push(stationPayload);
    }

    draft.examRoomId = examRoomId;
    draft.studentEmail = studentEmail;

    saveDraft(examRoomId, draft);
    return true;
  };

  // Handle NEXT / FINISH
  const handleNextOrFinish = async () => {
    const ok = persistCurrentStationToDraft();
    if (!ok) return;

    // if there is next station => move on
    if (nextStationId) {
      navigate(`/osce/tram/${nextStationId}`);
      return;
    }

    // last station => submit the whole room
    try {
      const draft = loadDraft(examRoomId);

      const res = await axiosInstance.post("/exam-submissions/submit", {
        examRoomId: draft.examRoomId,
        studentEmail: draft.studentEmail,
        stations: draft.stations,
      });

      const submissionId = res.data?.data?._id;

      // clear draft after submit
      localStorage.removeItem(getDraftKey(examRoomId));

      toast.success("✅ Nộp bài thành công! Trắc nghiệm đã được chấm tự động.");
      navigate("/hoan_thanh");
    } catch (err) {
      console.error("❌ Submit error:", err);
      toast.error(err.response?.data?.message || "Nộp bài thất bại.");
    }
  };

  // ✅ Safe hook order — all hooks before any return

  // 1️⃣ Timer hooks
  const totalDurationSec = useMemo(() => 15 * 60, []);
  const [timeRemaining, setTimeRemaining] = useState(totalDurationSec);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const t = setInterval(() => setTimeRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeRemaining]);

  const progress = (timeRemaining / totalDurationSec) * 100;
  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  // 2️⃣ Refs & UI state
  const thongTinRef = useRef(null);
  const benhSuRef = useRef(null);
  const tienCanRef = useRef(null);
  const luocQuaRef = useRef(null);
  const khamLSRef = useRef(null);
  const qScrollRef = useRef(null);
  const questionRefs = useRef({});

  const [activeSection, setActiveSection] = useState("thong_tin");
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [answers, setAnswers] = useState({});

  // ✅ Restore saved answers if student revisits this station (progressive save)
  useEffect(() => {
    if (!examRoomId) return;
    if (!studentEmail) return;
    if (!patientCase?._id) return;

    const draft = loadDraft(examRoomId);
    const station = (draft.stations || []).find(
      (s) => String(s.stationId) === String(tramId) && String(s.patientCaseId) === String(patientCase._id)
    );
    if (!station?.answers) return;

    const restored = {};
    for (const a of station.answers) {
      if (a?.questionId != null) restored[a.questionId] = a.answer;
    }
    setAnswers(restored);
  }, [examRoomId, studentEmail, tramId, patientCase?._id]);

  const scrollToSection = (ref, key) => {
    setActiveSection(key);
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToQuestion = (n) => {
    setActiveQuestion(n);
    questionRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 3️⃣ Scroll handler for active question
  useEffect(() => {
    const el = qScrollRef.current;
    if (!el) return;
    const handler = () => {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      for (let i = totalQuestions; i >= 1; i--) {
        const r = questionRefs.current[i]?.getBoundingClientRect();
        if (r && r.top <= mid) {
          setActiveQuestion(i);
          break;
        }
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [totalQuestions]);

  const isAnswered = (questionId) => {
    const v = answers[questionId];
    if (v === undefined || v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim().length > 0;
  };

  // ✅ Now safe conditional rendering
  if (loading) return <div className="loading">Đang tải dữ liệu trạm thi...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!examData || !patientCase) {
    return <div className="loading">Đang tải bệnh án...</div>;
  }

  return (
    <div className="stations-page">
      <div className="page-hero">
        <div className="hero-inner">
          <div className="timer">
            <Clock className={["ico", timeRemaining < 60 ? "danger" : ""].join(" ")} />
            <span className="label">Thời gian còn lại:</span>
            <span
              className={
                "ui-badge " +
                (timeRemaining < 60 ? "ui-badge--danger" : "ui-badge--muted") +
                " mono"
              }
            >
              {formatTime(timeRemaining)}
            </span>

            <button className="btn btn--ghost btn--md exit">
              <Link to="/">Thoát</Link>
            </button>
          </div>
          <Progress value={progress} className={timeRemaining < 60 ? "pulse" : ""} />
        </div>
      </div>

      <div className="split">
        <aside className="left">
          <nav className="toc">
            <div className="toc__title">Bệnh Án</div>
            <button
              className={["toc__item", activeSection === "thong_tin" ? "is-active" : ""].join(" ")}
              onClick={() => scrollToSection(thongTinRef, "thong_tin")}
            >
              Thông tin bệnh nhân
            </button>
            <button
              className={["toc__item", activeSection === "benh_su" ? "is-active" : ""].join(" ")}
              onClick={() => scrollToSection(benhSuRef, "benh_su")}
            >
              Bệnh sử
            </button>
            <button
              className={["toc__item", activeSection === "tien_can" ? "is-active" : ""].join(" ")}
              onClick={() => scrollToSection(tienCanRef, "tien_can")}
            >
              Tiền căn
            </button>
            <button
              className={["toc__item", activeSection === "luoc_qua" ? "is-active" : ""].join(" ")}
              onClick={() => scrollToSection(luocQuaRef, "luoc_qua")}
            >
              Lược qua các cơ quan
            </button>
            <button
              className={["toc__item", activeSection === "kham" ? "is-active" : ""].join(" ")}
              onClick={() => scrollToSection(khamLSRef, "kham")}
            >
              Khám lâm sàng
            </button>
          </nav>

          <div className="case">
            <div className="card mb">
              <div className="card__content">
                <section ref={thongTinRef} className="section">
                  <h2 className="section__title">Thông tin bệnh nhân</h2>
                  <ul className="list">
                    <li>
                      <b>Họ tên:</b> {caseData?.thong_tin_benh_nhan?.ho_ten}
                    </li>
                    <li>
                      <b>Tuổi:</b> {caseData?.thong_tin_benh_nhan?.tuoi}
                    </li>
                    <li>
                      <b>Giới tính:</b> {caseData?.thong_tin_benh_nhan?.gioi_tinh}
                    </li>
                    <li>
                      <b>Nghề nghiệp:</b> {caseData?.thong_tin_benh_nhan?.nghe_nghiep}
                    </li>
                    <li>
                      <b>Lý do nhập viện:</b> {caseData?.thong_tin_benh_nhan?.ly_do_nhap_vien}
                    </li>
                  </ul>
                </section>

                <section ref={benhSuRef} className="section">
                  <h3 className="section__title">Bệnh sử</h3>
                  <div className="paras">
                    <p>{caseData?.benh_su?.mo_ta1}</p>
                    <p>{caseData?.benh_su?.mo_ta2}</p>
                    <p>{caseData?.benh_su?.mo_ta3}</p>
                  </div>
                </section>

                <section ref={tienCanRef} className="section">
                  <h3 className="section__title">Tiền căn</h3>
                  <ul className="list">
                    {(caseData?.tien_can || []).map((t, i) => (
                      <li key={i}> {t}</li>
                    ))}
                  </ul>
                </section>

                <section ref={luocQuaRef} className="section">
                  <h3 className="section__title">Lược qua các cơ quan</h3>
                  <ul className="list">
                    {(caseData?.luoc_qua_cac_co_quan || []).map((t, i) => (
                      <li key={i}> {t}</li>
                    ))}
                  </ul>
                </section>

                <section ref={khamLSRef} className="section">
                  <h3 className="section__title">Khám lâm sàng</h3>
                  <ul className="list">
                    {(caseData?.kham_lam_sang || []).map((t, i) => (
                      <li key={i}> {t}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className="note">
              <div className="note__head">
                <AlertCircle className="ico primary" />
                <span>Ghi chú</span>
              </div>
              <p>Đọc kỹ bệnh án trước khi trả lời câu hỏi. Trả lời ngắn gọn, chính xác.</p>
            </div>
          </div>
        </aside>

        <section className="right">
          <div className="ui-scroll q-scroll" ref={qScrollRef}>
            <div className="q-wrap">
              {displayQuestions.map((q, idx) => {
                const n = idx + 1;
                const qid = q?.id;
                const answered = qid != null ? isAnswered(qid) : false;
                const options = getShuffledOptions(q, shufflePlan);

                return (
                  <div
                    key={n}
                    ref={(el) => (questionRefs.current[n] = el)}
                    className={["q-card", activeQuestion === n ? "is-current" : ""].join(" ")}
                  >
                    <div className="card">
                      <div className="card__content">
                        <div className="q-head">
                          <h3 className="q-title">Câu hỏi {n}</h3>
                          <span className={"ui-badge " + (answered ? "ui-badge--default" : "ui-badge--outline")}>
                            {answered ? "Đã trả lời" : "Chưa trả lời"}
                          </span>
                        </div>

                        <p className="q-text">{q.noi_dung}</p>

                        {q.kieu === "radio" && (
                          <div className="ui-radio-group">
                            {(options || []).map((opt, i) => (
                              <label key={i} className="ui-radio">
                                <input
                                  type="radio"
                                  id={`q${n}-r${i}`}
                                  name={`q_${qid}`}
                                  value={opt}
                                  checked={qid != null && answers[qid] === opt}
                                  onChange={() => setAnswers((p) => ({ ...p, [qid]: opt }))}
                                />
                                <span className="ui-radio__control" />
                                <span className="ui-radio__label">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.kieu === "checkbox" && (
                          <div className="ui-checkbox-group">
                            {(options || []).map((opt, i) => {
                              const cur = qid != null && Array.isArray(answers[qid]) ? answers[qid] : [];
                              const on = cur.includes(opt);

                              return (
                                <label key={i} className="ui-checkbox">
                                  <input
                                    type="checkbox"
                                    id={`q${n}-c${i}`}
                                    checked={on}
                                    onChange={(e) => {
                                      const flag = e.target.checked;
                                      setAnswers((p) => {
                                        const arr = qid != null && Array.isArray(p[qid]) ? p[qid] : [];
                                        return {
                                          ...p,
                                          [qid]: flag ? [...arr, opt] : arr.filter((x) => x !== opt),
                                        };
                                      });
                                    }}
                                  />
                                  <span className="ui-checkbox__control" />
                                  <span className="ui-checkbox__label">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {q.kieu === "text" && (
                          <>
                            <textarea
                              className="ui-textarea q-textarea"
                              placeholder={q.goi_y || "Nhập câu trả lời…"}
                              value={(qid != null ? answers[qid] : "") || ""}
                              onChange={(e) =>
                                setAnswers((p) => ({
                                  ...p,
                                  [qid]: e.target.value,
                                }))
                              }
                            />

                            <div className="q-meta">
                              <span className="q-count">
                                {String((qid != null ? answers[qid] : "") || "").length} ký tự
                              </span>
                              {q.goi_y && <span className="q-hint">{q.goi_y}</span>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="q-submit">
                <button className="btn btn--primary btn--lg w-100" onClick={handleNextOrFinish}>
                  {nextStationId ? (
                    <span className="next-Btn">
                      Trạm Kế Tiếp <ArrowBigRight />
                    </span>
                  ) : (
                    <span className="finish-Btn">Kết thúc</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="q-rail">
            <div className="q-rail__title">Câu Hỏi</div>
            <div className="q-rail__list">
              {displayQuestions.map((q, i) => {
                const n = i + 1;
                const qid = q?.id;
                const answered = qid != null ? isAnswered(qid) : false;
                const current = activeQuestion === n;

                return (
                  <button
                    key={n}
                    onClick={() => scrollToQuestion(n)}
                    className={[
                      "q-rail__btn",
                      current ? "is-current" : "",
                      !current && answered ? "is-answered" : "",
                    ].join(" ")}
                    title={`Câu ${n}`}
                  >
                    {answered && !current && <CheckCircle2 className="tick" />} {n}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OsceStationPage;