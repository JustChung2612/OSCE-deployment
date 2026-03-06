import "./editExamRoom.scss";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Trash } from 'lucide-react';
import axiosInstance from "../../../../lib/axios";

const EditExamRoom = () => {
  
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStationCases, setCurrentStationCases] = useState([]);
  // NEW: Track which station is selected
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);

  // NEW: Helper to switch displayed station
  const handleSelectStation = (index) => {
    setSelectedStationIndex(index);
    setCurrentStationCases(room.stations[index]?.patientCaseIds || []);
  };

  const [form, setForm] = useState({
    exam_room_name: "",
    exam_room_code: "",
    terminology: "",
    startAt: "",
    endAt: "",
  });

  // ✅ Fetch room detail
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axiosInstance.get(`/exam-rooms/${id}`);

        const data = res.data?.data;
        setRoom(res.data?.data);

        setForm({
          exam_room_name: data.exam_room_name || "",
          exam_room_code: data.exam_room_code || "",
          terminology: data.terminology || "",
          startAt: data.timeWindow?.startAt?.slice(0, 16) || "",
          endAt: data.timeWindow?.endAt?.slice(0, 16) || "",
        });
      } catch (err) {
          console.error("❌ Lỗi khi tải chi tiết phòng:", err);
          toast.error("Không thể tải chi tiết phòng thi.");
      } finally {
          setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  // ✏️ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 💾 Save changes
  const handleSave = async () => {
    try {
      const payload = {
        exam_room_name: form.exam_room_name,
        exam_room_code: form.exam_room_code,
        terminology: form.terminology,
        timeWindow: {
          startAt: form.startAt ? new Date(form.startAt) : null,
          endAt: form.endAt ? new Date(form.endAt) : null,
        },
      };

      const res = await axiosInstance.patch(
        `/exam-rooms/${id}`,
        payload
      );

      if (res.status === 200) {
        toast.success("✅ Phòng thi đã được cập nhật!");
        
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu phòng:", err);
      toast.error("Không thể lưu thay đổi.");
    }
  };

  // 🗑️ Delete a station
  const handleDeleteStation = async (stationId, index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trạm này không?")) return;

    try {
      const res = await axiosInstance.delete(`/exam-stations/${stationId}`);
      if (res.status === 200) {
        toast.success(`🗑️ Đã xóa Trạm ${index + 1}`);
        // Remove from local state
        setRoom((prev) => ({
          ...prev,
          stations: prev.stations.filter((st) => st._id !== stationId),
        }));
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa trạm:", err);
      toast.error("Không thể xóa trạm thi này.");
    }
  };

    // 🗑️ Delete the whole exam room
  const handleDeleteRoom = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa PHÒNG THI này không? Hành động này không thể hoàn tác.")) return;

    try {
      const res = await axiosInstance.delete(`/exam-rooms/${id}`);
      if (res.status === 200) {
        toast.success("🗑️ Đã xóa phòng thi!");
        navigate("/quan-tri");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa phòng thi:", err);
      toast.error(err.response?.data?.message || "Không thể xóa phòng thi.");
    }
  };



  // ✅ Return section
  if (loading) return <div>Đang tải...</div>;
  if (!room) return <div>Không tìm thấy phòng thi.</div>;

  return (
    <div className="editRoomContainer">
      <button className="back-btn" onClick={() => navigate("/quan-tri")} >
         <ArrowLeft /> Quay lại
      </button>

      <h2>
        ✏️ Chỉnh sửa phòng: {room.exam_room_name}{" "}
        {room.status && (
          <span
            style={{
              backgroundColor:
                room.status === "Đã phát hành" ? "#22c55e" : "#e2e8f0",
              color: room.status === "Đã phát hành" ? "white" : "#111",
              padding: "4px 8px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginLeft: "0.5rem",
            }}
          >
            {room.status}
          </span>
        )}
      </h2>

    <div className="editRoomInfo">
      <h2>Thông tin phòng thi</h2>

      <div className="editRoomForm">
        <label>Tên phòng</label>
        <input
          name="exam_room_name"
          value={form.exam_room_name}
          onChange={handleChange}
        />

        <label>Mã phòng</label>
        <input
          name="exam_room_code"
          value={form.exam_room_code}
          onChange={handleChange}
        />

        <label>Chuyên ngành</label>
        <input
          name="terminology"
          value={form.terminology}
          onChange={handleChange}
        />

        <label>Thời gian bắt đầu</label>
        <input
          type="datetime-local"
          name="startAt"
          value={form.startAt}
          onChange={handleChange}
        />

        <label>Thời gian kết thúc</label>
        <input
          type="datetime-local"
          name="endAt"
          value={form.endAt}
          onChange={handleChange}
        />

        <button className="save-btn" onClick={handleSave}>
          💾 Lưu thay đổi
        </button>
      </div>
    </div>

    {/* NEW: Compact list of station names */}
    <div className="stationNameList">
      <h3>Danh sách trạm thi</h3>

    <div className="stationNameContainer" >
          {(room?.stations || []).map((st, index) => (
            <div
              key={st._id}
              className={`stationNameItem ${
                selectedStationIndex === index ? "active" : ""
              }`}
              onClick={() => handleSelectStation(index)}
            >
              {st.stationName || `Trạm ${index + 1}`}
            </div>

          ))}
    </div>
    </div>

      {/* ==================== STATION LIST ==================== */}
      <div className="stationListSection">
        <h3>⚙️ Cấu hình trạm thi</h3>

        <div className="stationWorkflowContainer">
          {/* LEFT BOX — STATION SETTINGS */}
          <div className="stationLeftBox">
            {room?.stations?.length === 0 ? (
              <p>Chưa có trạm nào trong phòng này.</p>
            ) : (
              (() => {
                const st = room.stations[selectedStationIndex];

                return (
                  <div key={st._id} className="stationCard">
                    <h4>
                      {st.stationName || `Trạm ${selectedStationIndex + 1}`}{" "}
                      <span style={{ color: "#888" }}>
                        (ID: {st._id.substring(0, 6)}…)
                      </span>
                    </h4>

                    <p>Bệnh án trong trạm: {st.patientCaseIds?.length || 0}</p>

                    <label>Tên trạm</label>
                    <input
                      type="text"
                      value={st.stationName}
                      onChange={(e) => {
                        const updated = [...room.stations];
                        updated[selectedStationIndex].stationName = e.target.value;
                        setRoom({ ...room, stations: updated });
                      }}
                    />

                    <label>Thời lượng (phút)</label>
                    <input
                      type="number"
                      value={st.durationMinutes}
                      onChange={(e) => {
                        const updated = [...room.stations];
                        updated[selectedStationIndex].durationMinutes = Number(e.target.value);
                        setRoom({ ...room, stations: updated });
                      }}
                    />

                    <div className="station-button-section">
                      <button className="stationSaveBtn"
                        onClick={async () => {
                          try {
                            await axiosInstance.patch(
                              `/api/exam-stations/${st._id}`,
                              {
                                stationName: st.stationName,
                                durationMinutes: st.durationMinutes,
                              }
                            );
                            toast.success("Đã lưu thông tin trạm.");
                          } catch (err) {
                            toast.error("Không thể lưu thông tin trạm.");
                          }
                        }}
                      > 💾 Lưu trạm
                      </button>

                      <button className="viewCasesBtn"
                        onClick={() =>
                          setCurrentStationCases(st.patientCaseIds || [])
                        }
                      >  📋 Xem Chi Tiết Bệnh Án Trong Trạm
                      </button>

                      <button className="deleteBtn"
                        onClick={() =>
                          handleDeleteStation(st._id, selectedStationIndex)
                        }
                      >  🗑️ Xóa Trạm
                      </button>
                    </div>
                  </div>
                );
              })()
            )}

          </div>

          {/* RIGHT BOX — PATIENT CASE LIST */}
          <div className="stationRightBox">
            <h4>🧾 Danh sách Bệnh Án</h4>
            {currentStationCases?.length === 0 ? (
              <p className="no-case">Chưa có bệnh án nào được chọn.</p>
            ) : (
              currentStationCases.map((pc, idx) => (
                <div key={pc._id || pc} className="patientCaseItem">
                  <p>
                    <strong>🩺 {pc.metadata?.chuan_doan || "Không rõ"}</strong>{" "}
                    — {pc.metadata?.co_quan || "Không rõ cơ quan"}
                  </p>
                  <button 
                    className="viewBtn" 
                    onClick={() => navigate(`/benh-an/${pc._id}`)} >
                    🔍 Xem chi tiết
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* 🚀 Publish Button */}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>      
        <button
          
          className="publish-btn"
          onClick={async () => {
            try {
              const res = await axiosInstance.post(
                `/api/exam-rooms/${id}/publish`
              );
              if (res.status === 200) {
                toast.success("✅ Phòng thi đã được phát hành!");
                setRoom((prev) => ({ ...prev, status: "Đã phát hành" }));
              }
            } catch (err) {
              console.error("❌ Lỗi khi phát đề:", err);
              toast.error(err.response?.data?.message || "Không thể phát đề thi.");
            }
          }}
        >
          Phát Đề Thi
        </button>
        <button
          
          className="delete-room-btn"
          onClick={handleDeleteRoom}
        >
          🗑️ Xóa Phòng Thi
        </button>
      </div>

      

    </div>
  );
};

export default EditExamRoom;
