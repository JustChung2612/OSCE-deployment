import { useState, useEffect } from "react";
import PatientCaseCard from "../../../../components/patientCaseCard/PatientCaseCard.jsx";
import axios from "axios";
import './patientCaseList.scss';
import axiosInstance from "../../../../lib/axios.js";

const PatientCaseList = () => {
  const [examCases, setExamCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    chuan_doan: "",
    co_quan: "",
    trieu_chung: "",
    do_kho: "",
    doi_tuong: "",
    do_tuoi: [0, 100],
  });

  const diagnosisOptions = ["Lao Phổi ", "Suy Tim", "Viêm Phổi", "Tràn Khí Màng", "Tăng Huyết Áp", "Lao"];
  const organOptions = ["Tim mạch", "Phổi", "Thận", "Tiêu hóa", "Thần kinh", "Gan", "Dạ dày"];
  const symptomOptions = ["Khó thở", "Ho ra máu", "Lơ mơ", "Đau ngực", "Sốt"];
  const difficultyOptions = ["Cơ bản", "Trung bình", "Nâng cao"];
  const targetGroupOptions = ["Người lớn", "Người già", "Trẻ em", "Thai phụ"];

  // -------------------- Fetch Patient Cases --------------------
  useEffect(() => {
    const fetchPatientCases = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/patient-cases");
        setExamCases(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch Patient Cases:", err);
        setError("Không thể tải danh sách Bệnh Án");
      } finally {
        setLoading(false);
      }
    };
    fetchPatientCases();
  }, []);

  // -------------------- Filter Logic --------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleRangeChange = (e, index) => {
    const newRange = [...filters.do_tuoi];
    newRange[index] = Number(e.target.value);
    setFilters({ ...filters, do_tuoi: newRange });
  };

  const handleApplyFilter = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(","));
        } else if (value) {
          queryParams.append(key, value);
        }
      });

      const res = await axiosInstance.get(
        `/patient-cases?${queryParams.toString()}`
      );
      setExamCases(res.data?.data || []);
    } catch (err) {
      console.error("Error applying filter:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- UI --------------------
  if (loading) return <div>Đang tải danh sách Bệnh Án...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="examContainer">
      {/* ---------- FILTER SECTION ---------- */}
      <div className="filterExam">
        <h3>Bộ lọc bệnh án</h3>

        <div className="filterGroup">
          {/* Chuẩn đoán */}
          <div className="filterItem">
            <label>Chuẩn Đoán - Chủ Đề</label>
            <select name="chuan_doan" value={filters.chuan_doan} onChange={handleChange}>
              <option value="">Tất cả</option>
              {diagnosisOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Cơ quan */}
          <div className="filterItem">
            <label>Cơ quan</label>
            <select name="co_quan" value={filters.co_quan} onChange={handleChange}>
              <option value="">Tất cả</option>
              {organOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Triệu chứng */}
          <div className="filterItem">
            <label>Triệu chứng</label>
            <select name="trieu_chung" value={filters.trieu_chung} onChange={handleChange}>
              <option value="">Tất cả</option>
              {symptomOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Độ khó */}
          <div className="filterItem">
            <label>Độ khó</label>
            <select name="do_kho" value={filters.do_kho} onChange={handleChange}>
              <option value="">Tất cả</option>
              {difficultyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Đối tượng */}
          <div className="filterItem">
            <label>Đối tượng</label>
            <select name="doi_tuong" value={filters.doi_tuong} onChange={handleChange}>
              <option value="">Tất cả</option>
              {targetGroupOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Độ tuổi */}
          <div className="filterItem rangeItem">
            <label>
              Độ tuổi: {filters.do_tuoi[0]} - {filters.do_tuoi[1]}
            </label>
            <div className="rangeSlider">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.do_tuoi[0]}
                onChange={(e) => handleRangeChange(e, 0)}
                className="thumb thumb--left"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.do_tuoi[1]}
                onChange={(e) => handleRangeChange(e, 1)}
                className="thumb thumb--right"
              />
            </div>
          </div>

          <button className="applyButton" onClick={handleApplyFilter}>
            Áp dụng bộ lọc
          </button>
        </div>
      </div>

      {/* ---------- EXAM LIST SECTION ---------- */}
      <div className="examListContainer">
        <h3 className="listTitle">Danh sách Bệnh Án</h3>
        <div className="examListMain">
          { examCases.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                marginTop: "3rem",
                fontSize: "1.2rem",
                color: "#555",
                fontWeight: "500",
              }}
            >
              Không có bệnh án nào, hãy <strong>tải bệnh án ngay!</strong>
            </div>
          ) : (
            <div className="examList">
              {examCases.map((caseData, i) => (
                <PatientCaseCard
                  key={caseData._id || i}
                  data={caseData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCaseList;
