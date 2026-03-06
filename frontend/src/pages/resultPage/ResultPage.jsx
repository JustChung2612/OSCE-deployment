// ResultPage.jsx
import "../OsceStationPage/osceStationPage.scss";
import "./resultPage.scss";
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { useUserStore } from "../../stores/useUserStore.js";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios.js";

/* ========= 🔀 SHUFFLE HELPERS (must match OsceStationPage) ========= */
const normalizeId = (v) => {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
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
    // ignore
  }
  return created;
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
/* ================================================================ */

const ResultPage = () => {
  const { submissionId } = useParams();
  const { user } = useUserStore();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const [essayDraft, setEssayDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState("");

  useEffect(() => {
    if (!submissionId) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/exam-submissions/${submissionId}`);
        if (mounted) setSubmission(res.data?.data || null);
      } catch (err) {
        console.error("❌ Load submission error:", err);
        toast.error("Không thể tải kết quả bài thi.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [submissionId]);

  const stations = submission?.stations || [];

  // auto select first station when submission loads
  useEffect(() => {
    if (!stations.length) return;
    if (!selectedStationId) {
      const firstId = stations[0]?.stationId?._id || stations[0]?.stationId || "";
      setSelectedStationId(String(firstId));
    }
  }, [stations, selectedStationId]);

  const stationSub = useMemo(() => {
    if (!stations.length) return null;
    const found = stations.find(
      (s) => String(s.stationId?._id || s.stationId) === String(selectedStationId)
    );
    return found || stations[0];
  }, [stations, selectedStationId]);

  const stationKey = String(stationSub?.stationId?._id || stationSub?.stationId || "");
  const essayKey = (qid) => `${stationKey}_${Number(qid)}`;

  // derived content based on selected station
  const caseSource = stationSub?.patientCaseId || {};
  const caseData = caseSource?.benh_an_tinh_huong || {};
  const questions = caseSource?.cau_hoi || [];

  // ✅ choose identity to reproduce exact same shuffle as student did
  const shuffleIdentity = useMemo(() => {
    const fromSubmission = submission?.studentEmail || submission?.student?.email;
    const fromUser = user?.email;
    return String(fromSubmission || fromUser || "guest").toLowerCase();
  }, [submission?.studentEmail, submission?.student?.email, user?.email]);

  const caseId = useMemo(() => normalizeId(caseSource?._id), [caseSource?._id]);

  // ✅ build / load the SAME shuffle plan that was used in OsceStationPage
  const shufflePlan = useMemo(() => {
    if (!stationKey || !caseId || !questions.length) return null;

    // Prefer plan saved by backend (best)
    if (stationSub?.shufflePlan?.v === 1) return stationSub.shufflePlan;

    // Otherwise rebuild deterministically + cache in localStorage (frontend-only)
    const storageKey = `osce_shuffle_v1:${shuffleIdentity}:${stationKey}:${caseId}`;
    const seedBase = `${shuffleIdentity}|station:${stationKey}|case:${caseId}`;
    return loadOrCreateShufflePlan({ storageKey, seedBase, questions });
  }, [stationSub?.shufflePlan, shuffleIdentity, stationKey, caseId, questions.length]);

  // ✅ questions in display order (random order)
  const displayQuestions = useMemo(
    () => applyShuffleToQuestions(questions, shufflePlan),
    [questions, shufflePlan]
  );

  const totalQuestions = displayQuestions.length;

  // total score of whole exam (all stations)
  const examTotalScore = useMemo(() => {
    return (stations || []).reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0);
  }, [stations]);

  // Refs & UI state
  const thongTinRef = useRef(null);
  const benhSuRef = useRef(null);
  const tienCanRef = useRef(null);
  const luocQuaRef = useRef(null);
  const khamLSRef = useRef(null);

  const qScrollRef = useRef(null);
  const questionRefs = useRef({});

  const [activeSection, setActiveSection] = useState("thong_tin");
  const [activeQuestion, setActiveQuestion] = useState(1);

  // Reset activeQuestion when changing station (avoid weird scroll state)
  useEffect(() => {
    setActiveQuestion(1);
    if (qScrollRef.current) qScrollRef.current.scrollTop = 0;
  }, [stationKey]);

  // ✅ answers now come from backend submission (no editing in ResultPage)
  const answersById = useMemo(() => {
    const map = {};
    const rows = stationSub?.answers || [];
    for (const a of rows) {
      map[Number(a.questionId)] = a; // store full answer object
    }
    return map;
  }, [stationSub]);

  useEffect(() => {
    if (!stationSub?.answers) return;

    setEssayDraft((prev) => {
      const next = { ...prev };
      for (const a of stationSub.answers) {
        if (a.kieu === "text") {
          next[essayKey(a.questionId)] = {
            manualScore: a.manualScore ?? "",
            comment: a.comment ?? "",
          };
        }
      }
      return next;
    });
  }, [stationSub]);

  const handleSaveEssay = async () => {
    if (!submissionId || !stationSub?._id) return;

    try {
      setSaving(true);

      const grades = Object.entries(essayDraft)
        .filter(([k]) => k.startsWith(`${stationKey}_`))
        .map(([k, v]) => {
          const qid = Number(k.split("_")[1]);
          return {
            questionId: qid,
            manualScore: v.manualScore,
            comment: v.comment,
          };
        });

      const res = await axiosInstance.patch(
        `/exam-submissions/${submissionId}/grade-essay`,
        {
          stationId: stationSub.stationId?._id || stationSub.stationId,
          grades,
        }
      );

      setSubmission(res.data?.data || null);
      toast.success("✅ Đã lưu điểm và nhận xét!");
    } catch (err) {
      console.error("❌ Save essay error:", err);
      toast.error(err.response?.data?.message || "Không thể lưu điểm tự luận.");
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (ref, key) => {
    setActiveSection(key);
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToQuestion = (n) => {
    setActiveQuestion(n);
    questionRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Scroll handler for active question (based on display order)
  useEffect(() => {
    const el = qScrollRef.current;
    if (!el || totalQuestions <= 0) return;

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

  // ✅ IMPORTANT: isAnswered must check by real questionId, NOT by display number
  const isAnswered = (questionId) => {
    const row = answersById[Number(questionId)];
    if (!row) return false;
    if (Array.isArray(row.answer)) return row.answer.length > 0;
    return String(row.answer || "").trim().length > 0;
  };

  if (loading) return <div className="loading">Đang tải kết quả...</div>;
  if (!submission || !stationSub) return <div className="error">Không tìm thấy dữ liệu bài thi.</div>;

  return (
    <div className="stations-page">
      <div className="result-top">
        <div className="result-meta">
          <h5>
            Tổng điểm toàn bài: <span>{examTotalScore}</span>
          </h5>
          <h5>
            Tổng điểm trạm: <span>{stationSub?.totalScore ?? 0}</span>
          </h5>

          <div className="station-picker">
            <label className="muted">Chọn trạm:</label>
            <select
              className="ui-select"
              value={String(stationSub?.stationId?._id || stationSub?.stationId || "")}
              onChange={(e) => setSelectedStationId(e.target.value)}
            >
              {stations.map((s, idx) => {
                const sid = String(s.stationId?._id || s.stationId || idx);
                const label = s.stationId?.station_name || `Trạm ${idx + 1}`;
                return (
                  <option key={sid} value={sid}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {user?.role === "admin" && (
          <button className="btn btn--primary" onClick={handleSaveEssay} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu điểm & nhận xét"}
          </button>
        )}
      </div>

      {/* Split layout */}
      <div className="split">
        {/* LEFT: Case + TOC */}
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
                <div className="section">
                  <h2 className="section__title">{caseSource?.ten_benh_an || "Bệnh án"}</h2>
                  {caseSource?.metadata && (
                    <ul className="list">
                      <li>
                        <b>Chẩn đoán:</b> {caseSource.metadata.chuan_doan}
                      </li>
                      <li>
                        <b>Cơ quan:</b> {caseSource.metadata.co_quan}
                      </li>
                      <li>
                        <b>Triệu chứng:</b> {caseSource.metadata.trieu_chung}
                      </li>
                      <li>
                        <b>Độ khó:</b> {caseSource.metadata.do_kho}
                      </li>
                    </ul>
                  )}
                </div>

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
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>

                <section ref={luocQuaRef} className="section">
                  <h3 className="section__title">Lược qua các cơ quan</h3>
                  <ul className="list">
                    {(caseData?.luoc_qua_cac_co_quan || []).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>

                <section ref={khamLSRef} className="section">
                  <h3 className="section__title">Khám lâm sàng</h3>
                  <ul className="list">
                    {(caseData?.kham_lam_sang || []).map((t, i) => (
                      <li key={i}>{t}</li>
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

            <div className="mt">
              <Link className="btn btn--ghost" to="/sinh-vien">
                ← Quay lại
              </Link>
            </div>
          </div>
        </aside>

        {/* RIGHT: Questions + rail */}
        <section className="right">
          <div className="ui-scroll q-scroll" ref={qScrollRef}>
            <div className="q-wrap">
              {displayQuestions.map((q, idx) => {
                const n = idx + 1; // ✅ display number
                const qid = Number(q.id);
                const options = getShuffledOptions(q, shufflePlan);

                return (
                  <div
                    key={q.id ?? n}
                    ref={(el) => (questionRefs.current[n] = el)}
                    className={["q-card", activeQuestion === n ? "is-current" : ""].join(" ")}
                  >
                    <div className="card">
                      <div className="card__content">
                        <div className="q-head">
                          <h3 className="q-title">Câu hỏi {n}</h3>
                          <span className="grade-badge ui-badge ui-badge--default">
                            {(() => {
                              const row = answersById[qid];
                              const earned = (Number(row?.autoScore) || 0) + (Number(row?.manualScore) || 0);
                              return `${earned}/${Number(q.diem) || 0}`;
                            })()}
                          </span>
                        </div>

                        <p className="q-text">{q.noi_dung}</p>

                        {q.kieu === "radio" && (
                          <div className="ui-radio-group">
                            {(options || []).map((opt, i) => {
                              const row = answersById[qid];
                              const picked = row?.answer;
                              const correct = q.dap_an_dung;

                              const isPicked = picked === opt;
                              const isCorrectOpt =
                                String(correct ?? "").trim() === String(opt ?? "").trim();

                              const cls =
                                "ui-radio " +
                                (isPicked ? (isCorrectOpt ? "true_ans" : "false_ans") : "");

                              return (
                                <label key={i} className={cls}>
                                  <input
                                    disabled
                                    type="radio"
                                    id={`q${n}-r${i}`}
                                    name={`q${n}`}
                                    value={opt}
                                    checked={picked === opt}
                                    readOnly
                                  />
                                  <span className="ui-radio__control" />
                                  <span className="ui-radio__label">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {q.kieu === "checkbox" && (
                          <div className="ui-checkbox-group">
                            {(options || []).map((opt, i) => {
                              const row = answersById[qid];
                              const pickedArr = Array.isArray(row?.answer) ? row.answer : [];
                              const correctArr = Array.isArray(q.dap_an_dung)
                                ? q.dap_an_dung.map(String)
                                : [];

                              const picked = pickedArr.includes(opt);
                              const isCorrectPicked = picked && correctArr.includes(String(opt));

                              const cls =
                                "ui-checkbox " +
                                (picked ? (isCorrectPicked ? "true_ans" : "false_ans") : "");

                              return (
                                <label key={i} className={cls}>
                                  <input
                                    disabled
                                    type="checkbox"
                                    id={`q${n}-c${i}`}
                                    checked={picked}
                                    readOnly
                                  />
                                  <span className="ui-checkbox__control" />
                                  <span className="ui-checkbox__label">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {q.kieu === "text" &&
                          (() => {
                            const row = answersById[qid];
                            const studentText = row?.answer || "";

                            return (
                              <>
                                <textarea readOnly className="ui-textarea q-textarea" value={studentText} />

                                <div className="comment">
                                  <h4>Nhận xét:</h4>
                                  {user?.role === "admin" ? (
                                    <div className="teacher-grade">
                                      <div className="teacher-row">
                                        <label className="muted">Điểm tự luận</label>
                                        <input
                                          type="number"
                                          className="input base"
                                          placeholder={`0 - ${Number(q.diem) || 0}`}
                                          value={essayDraft[essayKey(q.id)]?.manualScore ?? ""}
                                          onChange={(e) =>
                                            setEssayDraft((p) => ({
                                              ...p,
                                              [essayKey(q.id)]: {
                                                manualScore: e.target.value,
                                                comment: p[essayKey(q.id)]?.comment ?? "",
                                              },
                                            }))
                                          }
                                        />
                                      </div>

                                      <div className="teacher-row">
                                        <label className="muted">Nhận xét</label>
                                        <input
                                          type="text"
                                          className="input base"
                                          placeholder="Nhập nhận xét..."
                                          value={essayDraft[essayKey(q.id)]?.comment ?? ""}
                                          onChange={(e) =>
                                            setEssayDraft((p) => ({
                                              ...p,
                                              [essayKey(q.id)]: {
                                                manualScore: p[essayKey(q.id)]?.manualScore ?? "",
                                                comment: e.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <p>{row?.comment || "Chưa có nhận xét."}</p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="q-submit">{/* UI only */}</div>
            </div>
          </div>

          <div className="q-rail">
            <div className="q-rail__title">Câu Hỏi</div>
            <div className="q-rail__list">
              {displayQuestions.map((q, idx) => {
                const n = idx + 1;
                const qid = Number(q.id);
                const answered = isAnswered(qid);
                const current = activeQuestion === n;

                return (
                  <button
                    key={qid || n}
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

export default ResultPage;