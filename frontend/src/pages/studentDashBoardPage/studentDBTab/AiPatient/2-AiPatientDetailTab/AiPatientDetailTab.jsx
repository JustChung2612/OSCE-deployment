import "./AiPatientDetailTab.scss";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../../lib/axios";

function stableThumb(id) {
    const s = String(id || "");
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return hash % 2 === 0 ? "pink" : "dark";
}

function normalizeCategoryFromTopic(topicRaw) {
    const t = String(topicRaw || "").toLowerCase();
    if (t.includes("counsel")) return "Counselling";
    return "Bệnh sử";
}

function toLines(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.flatMap((v) => String(v).split(/\r?\n/));
    }

    return String(value).split(/\r?\n/);
}

function buildBulletModel(value) {
    const raw = toLines(value)
        .map((s) => s.trim())
        .filter(Boolean);

    const items = [];
    let last = null;
    let forceChild = false;

    for (const lineRaw of raw) {
        // Handle standalone markers lines
        if (lineRaw === "•") {
            forceChild = false;
            continue;
        }
        if (lineRaw === "○") {
            forceChild = true;
            continue;
        }

        // Normalize inline markers
        let line = lineRaw;

        // Child line
        if (line.startsWith("○") || forceChild) {
            const childText = line.replace(/^○\s*/, "").trim();
            forceChild = false;

            if (!childText) continue;

            if (last) {
                if (!last.children) last.children = [];
                last.children.push(childText);
            } else {
                items.push({ text: childText });
            }
            continue;
        }

        // Optional inline "• ..."
        if (line.startsWith("•")) {
            line = line.replace(/^•\s*/, "").trim();
            if (!line) continue;
        }

        // Auto-nest for "Associated symptoms:" style lines (split by ';')
        const isAssociated =
            /^associated symptoms\b/i.test(line) ||
            /^triệu chứng kèm theo\b/i.test(line);

        if (isAssociated && line.includes(":")) {
            const idx = line.indexOf(":");
            const head = line.slice(0, idx + 1).trim();
            const rest = line.slice(idx + 1).trim();
            const children = rest
                ? rest.split(";").map((s) => s.trim()).filter(Boolean)
                : [];

            const item = { text: head, children };
            items.push(item);
            last = item;
            continue;
        }

        const item = { text: line };
        items.push(item);
        last = item;
    }

    return items;
}

function renderBulletList(value, marker = "•", subMarker = "○") {
    const items = buildBulletModel(value);
    if (!items.length) return null;

    return (
        <ul className="bulletList">
            {items.map((it, idx) => {
                return (
                    <li key={idx} className="bulletList__item">
                        <span className="bulletList__marker">{marker}</span>
                        <div className="bulletList__content">
                            <span className="bulletList__text">{it.text}</span>

                            {it.children && it.children.length > 0 && (
                                <ul className="bulletList bulletList--sub">
                                    {it.children.map((c, j) => {
                                        return (
                                            <li key={j} className="bulletList__item">
                                                <span className="bulletList__marker">{subMarker}</span>
                                                <div className="bulletList__content">
                                                    <span className="bulletList__text">{c}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

export default function AiPatientDetailTab({ stationId: stationIdProp, onBack, onStartPractice  }) {
     const { stationId: stationIdFromParams } = useParams();
     const stationId = stationIdProp || stationIdFromParams;
     
     const [caseData, setCaseData] = useState(null);
     const [loading, setLoading] = useState(true);
     const [errorMsg, setErrorMsg] = useState("");

     useEffect(() => {
        let alive = true;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                setErrorMsg("");

                if (!stationId) {
                    throw new Error("Missing station id.");
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/ai-cases/${stationId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                const json = await res.json();
                if (!res.ok) throw new Error(json?.message || "Không thể tải AI Patient Case.");

                if (alive) setCaseData(json?.data || null);
            } catch (err) {
                if (alive) setErrorMsg(err?.message || "Lỗi khi tải dữ liệu.");
            } finally {
                if (alive) setLoading(false);
            }
        };

        fetchDetail();
        return () => {
            alive = false;
        };
    }, [stationId]);

    const script = caseData?.ai_patient_script_model || {};
    const candidateInstruction = caseData?.candidate_instruction || [];

    const pageTitle =  caseData?.title ||  script?.brief_info?.name_symptom || "Station";

    const pageDesc = script?.brief_info?.desc || "";

    const meta = useMemo(() => {
        const topic = script?.brief_info?.topic || "";
        return {
            category: normalizeCategoryFromTopic(topic),
            thumbnail: stableThumb(stationId),
        };
    }, [script?.brief_info?.topic, stationId]);

    return (
        <div className="AiPatientDetail">
            <div className="AiPatientDetail__container">
                {loading && <div className="empty">Loading case detail...</div>}
                {!loading && errorMsg && <div className="empty">{errorMsg}</div>}
                {/* Header */}
                <div className="AiPatientDetail__header">
                    <div className="AiPatientDetail__headerLeft">
                        {onBack && (
                        <button type="button" className="pillBtn" onClick={onBack}>
                            ← Back
                        </button>
                        )}
                        <h1 className="AiPatientDetail__title">{pageTitle}</h1>
                        <p className="AiPatientDetail__desc">{pageDesc}</p>
                    </div>

                    <div className="AiPatientDetail__headerRight">
                        <button type="button" className="iconBtn" aria-label="Bookmark">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M7 4.5A2.5 2.5 0 0 1 9.5 2h5A2.5 2.5 0 0 1 17 4.5V22l-5-3-5 3V4.5Z" fill="currentColor" />
                            </svg>
                        </button>

                        <button type="button" className="iconBtn" aria-label="Share">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path
                                    d="M18 8a3 3 0 1 0-2.82-4H15a3 3 0 0 0 .18 1l-7.2 4.2a3 3 0 1 0 0 5.6l7.2 4.2A3 3 0 1 0 16 18a3 3 0 0 0-.18-1l-7.2-4.2a3 3 0 0 0 0-1.2l7.2-4.2A3 3 0 0 0 18 8Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>

                        <button type="button" className="pillBtn">Circuit</button>
                    </div>
                </div>

                {/* Two-column layout */}
                {!loading && !errorMsg && (
                    <div className="AiPatientDetail__layout">
                        {/* Left: long scroll content */}
                        <div className="AiPatientDetail__main">
                            <section className="AiPatientDetail__section">
                                <h2 className="AiPatientDetail__sectionTitle">
                                    Hướng dẫn thí sinh
                                    <span className="AiPatientDetail__sectionSubtitle"> | {pageTitle}</span>
                                </h2>

                                {renderBulletList(candidateInstruction)}
                            </section>

                            <section className="AiPatientDetail__section">
                                <h2 className="AiPatientDetail__sectionTitle">
                                    Hồ sơ bệnh nhân
                                    <span className="AiPatientDetail__sectionSubtitle"> | {pageTitle}</span>
                                </h2>

                                <div className="stationBlock">
                                    <div className="stationBlock__label">Thông tin cá nhân</div>
                                    <div className="stationBlock__body">{renderBulletList(script?.key_details)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label">Lý do vào viện</div>
                                    <div className="stationBlock__body">{renderBulletList(script?.presenting_complaint)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label">Bệnh sử của triệu chứng</div>
                                    <div className="stationBlock__body">{renderBulletList(script?.history_of_presenting_complaint)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label">ICE (Quan điểm – Lo lắng – Mong đợi của bệnh nhân) </div>
                                    <div className="stationBlock__body">{renderBulletList(script?.ice)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label">Tiền sử bệnh lý &amp; phẫu thuật</div>
                                    <div className="stationBlock__body">{renderBulletList(script?.past_medical_and_surgical_history)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label"> Tiền sử dùng thuốc </div>
                                    <div className="stationBlock__body">{renderBulletList(script?.drug_history)}</div>
                                </div>

                                <div className="stationBlock">
                                    <div className="stationBlock__label"> Tiền sử gia đình </div>
                                    <div className="stationBlock__body">{renderBulletList(script?.family_history)}</div>
                                </div>

                            </section>
                        </div>

                        {/* Right: sticky sidebar */}
                        <aside className="AiPatientDetail__sidebar">
                            <div className="AiPatientDetail__sticky">
                                <div className="previewCard">
                                    <div className={`previewCard__thumb ${meta.thumbnail === "pink" ? "previewCard__thumb--pink" : "previewCard__thumb--dark"}`}>
                                        <span className="previewCard__tag">
                                            {meta.category}
                                            <span className="previewCard__dot" />
                                        </span>

                                        <div className="previewCard__icon" aria-hidden="true">
                                            <svg viewBox="0 0 64 64" width="56" height="56">
                                                <path
                                                    d="M22 10h16v6H28v6h10v10c0 6-4 12-12 12-7 0-12-5-12-12V22c0-7 4-12 8-12Z"
                                                    fill="currentColor"
                                                    opacity="0.65"
                                                />
                                                <rect x="28" y="16" width="10" height="6" fill="currentColor" opacity="0.45" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="previewCard__body">
                                        <h3 className="previewCard__title">{pageTitle}</h3>
                                        <p className="previewCard__text">
                                            {script?.brief_info?.topic || "Practice OSCE with structured guidance."}
                                        </p>
                                    </div>
                                </div>

                                <div className="ctaCard">
                                    <h3 className="ctaCard__title">Virtual patient</h3>
                                    <p className="ctaCard__text">Interact with an AI-based patient &amp; examiner</p>

                                    <button
                                        type="button"
                                        className="ctaCard__btn"
                                        onClick={() => {
                                            if (onStartPractice) return onStartPractice(stationId);
                                        }}
                                    >
                                        Bắt đầu luyện tập
                                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                            <path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5Z" fill="currentColor" />
                                        </svg>
                                    </button>

                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
