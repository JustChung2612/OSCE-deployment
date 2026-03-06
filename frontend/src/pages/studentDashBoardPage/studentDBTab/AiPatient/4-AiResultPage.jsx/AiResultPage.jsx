// AiResultPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AiResultPage.scss";

const AiResultPage = () => {
  const { id } = useParams(); // caseId
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [aiAssess, setAiAssess] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Missing case id.");
      setLoading(false);
      return;
    }

    const fetchCase = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/ai-cases/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const foundCase = json?.data;

        setCaseTitle(foundCase?.title || "");
        setAiAssess(foundCase?.ai_assess_schema || null);
      } catch (err) {
        console.error("Failed to load AI result:", err);
        setError("Failed to load AI evaluation. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  const quantitative = aiAssess?.quantitative || {};
  const evaluationResults = aiAssess?.evaluation_results || {};
  const qualitativeFeedback = aiAssess?.qualitative_feedback || {};

  const conclusion = quantitative?.conclusion || "Fail";

  const safeArray = (v) => (Array.isArray(v) ? v : []);
  const renderList = (items) => {
    const arr = safeArray(items);
    if (arr.length === 0) return <p>None</p>;
    return (
      <ul>
        {arr.map((it, idx) => (
          <li key={idx}>
            {typeof it === "string" ? it : JSON.stringify(it)}
          </li>
        ))}
      </ul>
    );
  };

  const needsImprovement = safeArray(qualitativeFeedback?.needs_improvement);
  const good = safeArray(qualitativeFeedback?.good);

  // For "needs_improvement": allow either strings OR objects like { title, detail }
  const needsImprovementBlocks = useMemo(() => {
    if (needsImprovement.length === 0) return null;

    return needsImprovement.map((item, idx) => {
      if (typeof item === "string") {
        return (
          <div className="feedback_item" key={idx}>
            <p>{item}</p>
          </div>
        );
      }
      // try common shapes
      const title = item?.title || item?.name || item?.category || `Item ${idx + 1}`;
      const detail = item?.detail || item?.text || item?.message || JSON.stringify(item);

      return (
        <div className="feedback_item" key={idx}>
          <h4>{title}</h4>
          <p>{detail}</p>
        </div>
      );
    });
  }, [needsImprovement]);

  if (loading) {
    return <h2 className="Ai_result_title">Loading AI Result...</h2>;
  }

  if (error) {
    return <h2 className="Ai_result_title">{error}</h2>;
  }

  if (!aiAssess) {
    return <h2 className="Ai_result_title">No AI evaluation found for this case.</h2>;
  }

  return (
    <>
      <h1 className="Ai_result_title">Kết quả đánh giá với Bệnh Nhân AI</h1>
      <div className="result_back_btn">
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
      </div>

      <section className="Ai_assess_container">
        {/* ================= TABLE SCORE ================= */}
        <div className="table_score">
          <h2>Quantitative Feedback</h2>

          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Data Gathering</th>
                <th>Management</th>
                <th>Interpersonal</th>
                <th>Total</th>
                <th>Score Needed</th>
                <th>Pass/Fail</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{caseTitle || "Untitled case"}</td>
                <td>{Number(quantitative?.data_gathering ?? 0).toFixed(2)}</td>
                <td>{Number(quantitative?.management ?? 0).toFixed(2)}</td>
                <td>{Number(quantitative?.interpersonal ?? 0).toFixed(2)}</td>
                <td>{Number(quantitative?.total ?? 0).toFixed(2)}</td>
                <td>{quantitative?.score_needed ?? 0}</td>
                <td className={conclusion === "Pass" ? "pass" : "fail"}>{conclusion}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ================= EVALUATION RESULT ================= */}
        <div className="evaluation_result">
          <h2>Evaluation Results</h2>

          {/* ================= DATA GATHERING ================= */}
          <div className="criteria data_gathering">
            <h3>📊 Data Gathering</h3>

            <div className="criteria_boxes">
              <div className="box covered">
                <h4>Covered</h4>
                {renderList(evaluationResults?.data_gathering?.covered)}
              </div>

              <div className="box partial">
                <h4>Partially Covered</h4>
                {renderList(evaluationResults?.data_gathering?.partially_covered)}
              </div>

              <div className="box missed">
                <h4>Missed</h4>
                {renderList(evaluationResults?.data_gathering?.missed)}
              </div>
            </div>
          </div>

          {/* ================= MANAGEMENT ================= */}
          <div className="criteria management">
            <h3>🩺 Management</h3>

            <div className="criteria_boxes">
              <div className="box covered">
                <h4>Covered</h4>
                {renderList(evaluationResults?.management?.covered)}
              </div>

              <div className="box partial">
                <h4>Partially Covered</h4>
                {renderList(evaluationResults?.management?.partially_covered)}
              </div>

              <div className="box missed">
                <h4>Missed</h4>
                {renderList(evaluationResults?.management?.missed)}
              </div>
            </div>
          </div>

          {/* ================= INTERPERSONAL ================= */}
          <div className="criteria interpersonal">
            <h3>🤝 Interpersonal Skills</h3>

            <div className="criteria_boxes">
              <div className="box covered">
                <h4>Covered</h4>
                {renderList(evaluationResults?.interpersonal?.covered)}
              </div>

              <div className="box partial">
                <h4>Partially Covered</h4>
                {renderList(evaluationResults?.interpersonal?.partially_covered)}
              </div>

              <div className="box missed">
                <h4>Missed</h4>
                {renderList(evaluationResults?.interpersonal?.missed)}
              </div>
            </div>
          </div>
        </div>

        {/* ================= QUALITATIVE FEEDBACK ================= */}
        <div className="qualitative_feedback">
          <h2>🎯 Qualitative Feedback</h2>

          <div className="qualitative_container">
            <div className="qual_box needs_improvement">
              <h3>Needs Improvement</h3>
              {needsImprovementBlocks || <p>None</p>}
            </div>

            <div className="qual_box good">
              <h3>Good</h3>
              {good.length === 0 ? (
                <p>None</p>
              ) : (
                good.map((item, idx) => (
                  <div className="feedback_item" key={idx}>
                    {typeof item === "string" ? item : JSON.stringify(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AiResultPage;