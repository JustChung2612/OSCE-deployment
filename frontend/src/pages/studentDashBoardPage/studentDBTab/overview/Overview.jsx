// Overview.jsx
import "./overview.scss";
import "../../../../components/examRoomCard/examRoomCard.scss";
import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../../../stores/useUserStore.js";
import { toast } from "react-hot-toast";
import axiosInstance from '../../../../lib/axios.js';


const Overview = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const studentEmail = user?.email?.toLowerCase();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentEmail) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await axiosInstance.get("/exam-submissions/me", {
          params: { email: studentEmail },
        });

        const data = res.data?.data || [];
        if (mounted) setSubmissions(data);

      } catch (err) {
        console.error("❌ Load submissions error:", err);
        toast.error("Không thể tải lịch sử bài thi.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [studentEmail]);

  // ✅ Count completed exam rooms (submitted submissions)
  const completedCount = useMemo(() => submissions.length, [submissions]);

  return (

    <>
      {/* Section 1 : Brief Information  */}
      <section className="brief_info" >
        <div className='info_card' > {/*Make this dynamic  */}
           <h1>Tổng số phòng thi đã hoàn thành </h1>
           <p>{loading ? "..." : completedCount}</p>
        </div>
        <div className='info_card' > {/*Make this dynamic  */}
           <h1>Số bài tự luận đang chấm </h1>
            <p>
              {loading
                ? "..."
                : submissions.filter((s) => s.status === "needs_manual_grading").length}
            </p>
        </div>

      </section>

      {/* Section 2 : Record of Student's Completed Exam Room  */}
      <section className="main_Exam_Room_info">
        <h1>Kết quả phòng thi đã hoàn thành:</h1>

        {loading && <p className="muted">Đang tải dữ liệu...</p>}

        {!loading && submissions.length === 0 && (
          <p className="muted">Bạn chưa hoàn thành phòng thi nào.</p>
        )}

        <div className="examRoomCard-container-list" >
          {!loading &&
            submissions.map((sub) => {
              const room = sub.examRoomId; // populated from backend
              const totalStations = sub.stations?.length || 0;

              return (
                <div className="examRoomCard-container" key={sub._id}>
                  <div className="card__header">
                    <div className="row">
                      <h2 className="r_tite">{room?.exam_room_name || "Phòng thi"}</h2>
                      <p className="r_code">{room?.exam_room_code || "..."}</p>
                    </div>
                  </div>

                  <div className="card__body">
                    <div className="card_content">
                      <h4 className="key">Tổng Điểm:</h4>
                      <p className="value">{sub.totalScore} </p>
                    </div>

                    <div className="card_content">
                      <h4 className="key">Tổng Trạm:</h4>
                      <p className="value">{totalStations}</p>
                    </div>

                    <div className="card_content">
                      <h4 className="key">Chuyên Ngành:</h4>
                      <p className="value">{room?.terminology || "..."}</p>
                    </div>

                    <div className="card_content">
                      <Clock3 />
                      <span style={{ fontWeight: 500 }}>16:00–17:30 (demo)</span>
                    </div>

                    <button
                      className="btn"
                      onClick={() => {
                        // Helpful for ResultPage to reuse the exact shuffle order per station
                        // (if ResultPage chooses to read it from navigation state/localStorage)
                        try {
                          localStorage.setItem(`osce_submission_cache:${sub._id}`, JSON.stringify(sub));
                        } catch {
                          // ignore
                        }
                        navigate(`/ket_qua/${sub._id}`, { state: { submission: sub } });
                      }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Section 3 : Record of Student's Completed Ai Exam Room  */}
      <section className="Ai_Exam_Room_info" >
        <h1>Kết quả phòng thi Ai đã hoàn thành:</h1>

        <div className="AiResultCard-container-list" >

        </div>
      </section>
    </>
  )
}

export default Overview