import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AiPatientInteractionTab.scss";
import { useNavigate } from "react-router-dom";

const pad2 = (n) => String(n).padStart(2, "0");

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function IconButton({ title, onClick, children, disabled }) {
  return (
    <button
      type="button"
      className="vp-iconBtn"
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`vp-collapsible ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="vp-collapsible__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="vp-collapsible__title">{title}</span>
        <span className="vp-collapsible__chev" aria-hidden="true">
          ▾
        </span>
      </button>
      <div className="vp-collapsible__body">{children}</div>
    </section>
  );
}

function MessageBubble({ role, text, time }) {
  const mine = role === "user";
  return (
    <div className={`vp-msg ${mine ? "is-user" : "is-ai"}`}>
      <div className="vp-msg__bubble">
        <div className="vp-msg__text">{text}</div>
        <div className="vp-msg__meta">{time}</div>
      </div>
    </div>
  );
}

export default function AiPatientInteractionTab({ stationId, onBack }) {
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [caseLoading, setCaseLoading] = useState(true);
    const [caseError, setCaseError] = useState("");

    const stationTitle = "Virtual patient";
    const stationSubtitle = caseData?.title || "Loading case...";

    const [messages, setMessages] = useState(() => [
    {
      id: "m1",
      role: "ai",
      text: "Hi there—I'm not feeling well and my stomach hurts since last night. Can you help?",
      time: "08:00",
    },
  ]);

  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(8 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!stationId) {
      setCaseError("Missing stationId. Please go back and choose a case again.");
      setCaseLoading(false);
      return;
    }

    const fetchCase = async () => {
      try {
        setCaseLoading(true);
        setCaseError("");

        const res = await fetch(`/api/ai-cases/${stationId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setCaseData(json.data);

      } catch (err) {
        console.error("Failed to fetch AI case:", err);
        setCaseError("Failed to load case data. Please try again.");
      } finally {
        setCaseLoading(false);
      }
    };

    fetchCase();
  }, [stationId]);
  const candidateInstruction = caseData?.candidate_instruction || "";
  const patientScript = caseData?.ai_patient_script_model || "";

  const timeLabel = useMemo(() => formatMMSS(secondsLeft), [secondsLeft]);
  const [diagnosisRevealed, setDiagnosisRevealed] = useState(false);
  const diagnosisText = "Suspected: Acute appendicitis (demo)";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function nowHHMM() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      time: nowHHMM(),
    };

    const aiMsg = {
      id: `a-${Date.now() + 1}`,
      role: "ai",
      text:
        "Thanks. Can you describe where the pain is, how severe it feels, and whether anything makes it better or worse? (demo)",
      time: nowHHMM(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    if (!running) setRunning(true);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function resetTimer() {
    setSecondsLeft(8 * 60);
    setRunning(false);
  }

  return (
    <div className="vp-page">
      <div className="vp-shell">
        {/* LEFT */}
        <main className="vp-main">
            {onBack && (
              <button type="button" className="pillBtn" onClick={onBack}>
                ← Back
              </button>
            )}
          <header className="vp-topbar">
            <div className="vp-title">
              <span className="vp-title__main">{stationTitle}</span>
              <span className="vp-title__sep">|</span>
              <span className="vp-title__sub">{stationSubtitle}</span>
            </div>

            <div className="vp-topbar__icons" aria-label="Chat tools">
              <IconButton title="Language">
                <span aria-hidden="true">🌐</span>
              </IconButton>
              <IconButton title="Audio">
                <span aria-hidden="true">🔈</span>
              </IconButton>
            </div>
          </header>

          <section className="vp-chatCard" aria-label="Chat panel">
            <div className="vp-chatCard__messages" ref={scrollRef}>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  text={m.text}
                  time={m.time}
                />
              ))}
            </div>

            <div className="vp-composer">
              <div className="vp-composer__inputWrap">
                <textarea
                  className="vp-composer__input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message or use the microphone. You can also use Alt/Option + T for voice input."
                  rows={1}
                />
                <button
                  type="button"
                  className="vp-composer__mic"
                  title="Voice input (demo)"
                  onClick={() => alert("Voice input (demo)")}
                >
                  🎤
                </button>
              </div>

              <button
                type="button"
                className="vp-composer__send"
                onClick={handleSend}
                disabled={!input.trim()}
                title="Send"
              >
                ➤
              </button>
            </div>
          </section>

          <section className="vp-below">
            <Collapsible title="Instructions" defaultOpen={false}>
              {caseLoading ? (
                <p className="vp-muted">Loading instructions...</p>
              ) : caseError ? (
                <p className="vp-muted">{caseError}</p>
              ) : (
                <p className="vp-muted" style={{ whiteSpace: "pre-line" }}>
                  {candidateInstruction || "No candidate instruction provided."}
                </p>
              )}
            </Collapsible>

            <Collapsible title="Scenario script" defaultOpen={false}>
              {caseLoading ? (
                <p className="vp-muted">Loading patient script...</p>
              ) : caseError ? (
                <p className="vp-muted">{caseError}</p>
              ) : typeof patientScript === "string" ? (
                <p className="vp-muted" style={{ whiteSpace: "pre-line" }}>
                  {patientScript || "No patient script provided."}
                </p>
              ) : (
                <pre className="vp-muted" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(patientScript, null, 2)}
                </pre>
              )}
            </Collapsible>  
          </section>
        </main>

        <aside className="vp-side" aria-label="Sidebar">
          <section className="vp-panel vp-timer">
            <div className="vp-timer__time">{timeLabel}</div>
            <div className="vp-timer__controls">
              <IconButton
                title={running ? "Pause" : "Start"}
                onClick={() => setRunning((v) => !v)}
                disabled={secondsLeft === 0}
              >
                {running ? "⏸" : "▶"}
              </IconButton>
              <IconButton title="Reset" onClick={resetTimer}>
                ↻
              </IconButton>
              <IconButton
                title="Add 1 min"
                onClick={() => setSecondsLeft((s) => s + 60)}
              >
                ＋
              </IconButton>
            </div>
          </section>
          <section className="vp-panel">
            <div className="vp-panel__title">Chuẩn Đoán</div>
            <div className="vp-panel__body">
              {!diagnosisRevealed ? (
                <button
                  type="button"
                  className="vp-btn vp-btn--dark"
                  onClick={() => setDiagnosisRevealed(true)}
                >
                  Hiện Chuẩn Đoán
                </button>
              ) : (
                <div className="vp-revealBox">{diagnosisText}</div>
              )}
            </div>
          </section>

          <section>
            <button
              type="button"
              className="Ai_submit_btn"
              onClick={() => navigate(`/Ai_ket_qua/${stationId}`)}
              disabled={!stationId}
            >
              Kết Thúc &#38; Đánh Giá
            </button>
          </section>

        </aside>
      </div>
    </div>
  );
}
