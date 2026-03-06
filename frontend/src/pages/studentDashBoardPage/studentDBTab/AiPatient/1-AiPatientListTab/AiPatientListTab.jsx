import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AiPatientListTab.scss";
import axiosInstance from "../../../../../lib/axios";

const filterCategories = ["Bệnh sử", "Counselling"];

function compareBySort(a, b, sortOrder) {
  const aTitle = String(a.title || "");
  const bTitle = String(b.title || "");

  if (sortOrder === "A–Z") return aTitle.localeCompare(bTitle);
  if (sortOrder === "Z–A") return bTitle.localeCompare(aTitle);

  // Newest (fallback if createdAt missing)
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return bTime - aTime;
}

function pickRandomFrom(list) {
  if (!list.length) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// Make thumbnail style stable based on id
function stableThumb(id) {
  const s = String(id || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return hash % 2 === 0 ? "pink" : "dark";
}

// Convert backend topic -> your category UI
function normalizeCategory(apiCase) {
  const raw =
    apiCase?.ai_patient_script_model?.brief_info?.topic ||
    apiCase?.ai_patient_script_model?.brief_info?.Topic ||
    "";

  const t = String(raw).toLowerCase();
  if (t.includes("counsel")) return "Counselling";
  return "Bệnh sử";
}

export default function AiPatientListTab({ onOpenStation }) {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Bệnh sử");
  const [diagnosisEnabled, setDiagnosisEnabled] = useState(false);
  const [sortOrder, setSortOrder] = useState("A–Z");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Fetch from DB
  useEffect(() => {
    let alive = true;

    const fetchAiCases = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/ai-cases`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.message || "Không thể tải danh sách AI Patient Cases.");
        }

        const data = Array.isArray(json?.data) ? json.data : [];

        // map backend -> UI station object
        const mapped = data.map((c) => ({
          id: c._id,
          title:
            c.title ||
            c?.ai_patient_script_model?.brief_info?.name_symptom ||
            "Untitled",
          category: normalizeCategory(c),
          thumbnail: stableThumb(c._id),
          diagnosis: c?.ai_patient_script_model?.diagnosis || "—",
          createdAt: c.createdAt || null,
        }));

        if (alive) setStations(mapped);
      } catch (err) {
        if (alive) setErrorMsg(err?.message || "Lỗi khi tải dữ liệu.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchAiCases();

    return () => {
      alive = false;
    };
  }, []);

  const filteredStations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const base = stations.filter((s) => {
      const matchesCategory = s.category === selectedCategory;
      const matchesSearch = !q || String(s.title || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return [...base].sort((a, b) => compareBySort(a, b, sortOrder));
  }, [stations, searchTerm, selectedCategory, sortOrder]);

  const stationsInSelectedCategory = useMemo(
    () => stations.filter((s) => s.category === selectedCategory),
    [stations, selectedCategory]
  );

  const handleRandom = (scope) => {
    const list = scope === "all" ? stations : stationsInSelectedCategory;
    const chosen = pickRandomFrom(list);
    if (!chosen) return;

    if (onOpenStation) return onOpenStation(chosen.id);
    navigate(`/Ai-patient-detail/${chosen.id}`);
  };

  const handleOpenStation = (station) => {
    if (onOpenStation) return onOpenStation(station.id);
    navigate(`/Ai-patient-detail/${station.id}`);
  };

  return (
    <div className="aiPatient">
      <div className="aiPatient__container">
        <h1 className="aiPatient__title">OSCE station and virtual patient bank</h1>

        {/* Filters + actions */}
        <div className="toolbar">
          <div className="toolbar__left">
            {filterCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${active ? "chip--active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="chip__text">{cat}</span>
                  {active && (
                    <span className="chip__chev" aria-hidden="true">
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Options row */}
        <div className="optionsRow">
          <details className="dropdown">
            <summary className="dropdown__trigger">
              <span className="dropdown__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    d="M16 3h5v5h-2V6.4l-3 3A8 8 0 0 1 4 12H2a10 10 0 0 0 15-4.2l2-2V8h2V3h-5v2Zm-8 18H3v-5h2v1.6l3-3A8 8 0 0 1 20 12h2a10 10 0 0 0-15 4.2l-2 2V16H3v5h5v-2Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span>Random station</span>
              <span className="dropdown__chev" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="14" height="14">
                  <path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
            </summary>

            <div className="dropdown__menu" role="menu">
              <button type="button" className="dropdown__item" onClick={() => handleRandom("all")}>
                Random from all
              </button>
              <button
                type="button"
                className="dropdown__item"
                onClick={() => handleRandom("category")}
              >
                Random from {selectedCategory}
              </button>
            </div>
          </details>

          <details className="dropdown">
            <summary className="dropdown__trigger">
              <span>{sortOrder}</span>
              <span className="dropdown__chev" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="14" height="14">
                  <path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
            </summary>

            <div className="dropdown__menu" role="menu">
              <button type="button" className="dropdown__item" onClick={() => setSortOrder("A–Z")}>
                A–Z
              </button>
              <button type="button" className="dropdown__item" onClick={() => setSortOrder("Z–A")}>
                Z–A
              </button>
              <button
                type="button"
                className="dropdown__item"
                onClick={() => setSortOrder("Newest")}
              >
                Newest
              </button>
            </div>
          </details>

          <div className="search">
            <input
              className="search__input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stations..."
            />
          </div>

          <label className="toggle">
            <input
              className="toggle__input"
              type="checkbox"
              checked={diagnosisEnabled}
              onChange={(e) => setDiagnosisEnabled(e.target.checked)}
            />
            <span className="toggle__track" aria-hidden="true">
              <span className="toggle__thumb" />
            </span>
            <span className="toggle__label">Diagnosis</span>
          </label>
        </div>

        <div className="divider" />

        <h2 className="sectionTitle">{selectedCategory}</h2>

        {/* ✅ Loading / Error */}
        {loading && <div className="empty">Loading AI cases...</div>}
        {!loading && errorMsg && <div className="empty">{errorMsg}</div>}

        {!loading && !errorMsg && (
          <>
            <div className="cardGrid">
              {filteredStations.map((station) => {
                return (
                  <div
                    key={station.id}
                    className="card"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenStation(station)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleOpenStation(station);
                    }}
                  >
                    <div
                      className={`card__thumb ${
                        station.thumbnail === "pink" ? "card__thumb--pink" : "card__thumb--dark"
                      }`}
                    >
                      <span className="card__tag">{station.category}</span>
                    </div>

                    <div className="card__body">
                      <div className="card__title">{station.title}</div>
                      {diagnosisEnabled && (
                        <div className="card__meta">
                          <span className="card__metaLabel">Diagnosis:</span> {station.diagnosis}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredStations.length === 0 && (
              <div className="empty">No stations found matching your criteria</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}