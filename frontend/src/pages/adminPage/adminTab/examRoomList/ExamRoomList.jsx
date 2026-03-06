import "./examRoomList.scss";
import { useEffect, useState } from "react";
import axios from "axios";
import ExamRoomCard from "../../../../components/examRoomCard/ExamRoomCard.jsx";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../../lib/axios.js";

const ExamRoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔁 Fetch all exam rooms when page loads
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/exam-rooms");
        setRooms(res.data?.data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách phòng thi:", err);
        setError("Không thể tải danh sách phòng thi.");
        toast.error("Không thể tải danh sách phòng thi.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <div>Đang tải danh sách phòng thi...</div>;
  if (error)
    return <div style={{ color: "red", textAlign: "center" }}>{error}</div>;

  return (
    <div className="examRoomListContainer">
      <h2>📋 Danh sách phòng thi</h2>

      {rooms.length === 0 ? (
        <p>Chưa có phòng thi nào — hãy tạo phòng mới!</p>
      ) : (
        <div className="examRoomGrid">
          {rooms.map((room) => (
            <ExamRoomCard key={room._id} data={room} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamRoomList;
