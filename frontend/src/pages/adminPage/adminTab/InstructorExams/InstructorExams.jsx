//InstructorExams.jsx
import "./InstructorExams.scss";
import { useNavigate } from "react-router-dom";
import { Clock, FileText } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useState,useEffect } from "react";
import axiosInstance from "../../../../lib/axios";

const InstructorExams = () => {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // 1) load all exam rooms
        const roomRes = await axiosInstance.get("/exam-rooms");
        const list = roomRes.data?.data || [];

        // 2) for each room, load submission count
        const withCounts = await Promise.all(
          list.map(async (r) => {
            try {
              const subRes = await axiosInstance.get(
                `/exam-submissions/room/${r._id}`
              );
              const count = subRes.data?.count ?? (subRes.data?.data?.length || 0);
              return { ...r, submissionsCount: count };
            } catch {
              return { ...r, submissionsCount: 0 };
            }
          })
        );

        if (mounted) setRooms(withCounts);
      } catch (err) {
        console.error("❌ Load rooms error:", err);
        toast.error("Không thể tải danh sách phòng thi.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (

    <div className="instructor-page exams">

      {/* Content */}
      <main className="container">
        <div className="card">
          <div className="card__content">
            <div className="section-head">
              <h2 className="h2"><FileText className="ico" /> Danh sách kỳ thi</h2>
            </div>

            <table className="ui-table">
              <thead className="ui-table__head">
                <tr className="ui-table__row">
                  <th className="ui-table__cell is-head">Tên Phòng thi</th> 
                  <th className="ui-table__cell is-head text-center">Số trạm</th>
                  <th className="ui-table__cell is-head text-center">Trạng thái</th>
                  <th className="ui-table__cell is-head text-center">Bài nộp</th>
                  <th className="ui-table__cell is-head">Thời gian</th>
                  <th className="ui-table__cell is-head text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="ui-table__body">
                {rooms.map((room) => (

                  <tr key={room.id} className="ui-table__row hover">
                    <td className="ui-table__cell fw">{room.exam_room_name}</td>

                    <td className="ui-table__cell text-center">{room.stations?.length || 0}</td>

                    <td className="ui-table__cell text-center">
                      <span
                        className={[ "ui-badge",
                          room.status === "Đã phát hành" ? "ui-badge--default on" : "ui-badge--secondary",
                        ].join(" ")}
                      >
                        {room.status || "Bản nháp"}
                      </span>

                    </td>

                    <td className="ui-table__cell text-center fw">{room.submissionsCount || 0}</td>

                    <td className="ui-table__cell">
                      <div className="time">
                        <Clock className="ico" />
                        <div>
                            <div>Mở: (demo)</div> <div>Đóng: (demo)</div>
                        </div>
                      </div>
                    </td>

                    <td className="ui-table__cell text-right">
                      <button
                        className="btn"
                        onClick={() => navigate(`/dang_thi/${room._id}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorExams;
