// InstructorAttempts.jsx
import "./InstructorAttempts.scss";
import { useState,useEffect, useMemo  } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Filter } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../../lib/axios";


const InstructorAttempts = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [roomName, setRoomName] = useState("");
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get( `/exam-submissions/room/${roomId}` );
        const list = res.data?.data || [];
        if (mounted) {
          setSubmissions(list);

          // examRoomId is populated in backend
          const firstRoom = list?.[0]?.examRoomId;
          setRoomName(firstRoom?.exam_room_name || "Danh sách bài thi");
        }
      } catch (err) {
        console.error("❌ Load room submissions error:", err);
        toast.error("Không thể tải danh sách bài thi.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (statusFilter === "all") return true;
      return s.status === statusFilter;
    });
  }, [submissions, statusFilter]);

  const renderStatusBadge = (status) => {
    if (status === "graded") {
      return <span className="ui-badge ui-badge--default on">Đã chấm</span>;
    }
    if (status === "in-progress") {
      return <span className="ui-badge ui-badge--secondary">Đang chấm</span>;
    }
    if (status === "ungraded") {
      return <span className="ui-badge ui-badge--outline">Chưa chấm</span>;
    }
    return null;
  };


  const nextUngraded = filtered.find((a) => a.gradingStatus === "ungraded");

  return (
    <div className="instructor-page attempts">
      {/* Header */}
      <header className="header">
        
            <button className="back-btn"
                onClick={() => {navigate(-1) }}
            >
              <ArrowLeft className="ico" /> Quay lại
            </button>

            <div className="title-row">
              <div>
                <h1 className="h1">Bài thi sinh viên</h1>
                <p className="muted">{loading ? "Đang tải..." : roomName}</p>
              </div>
            </div>
   
      </header>

      {/* Content */}
      <main className="container">
        <div className="card">
          <div className="card__content">
              <div className="section-head">
                <h2 className="h2"><Users className="ico" /> Danh sách bài thi ({filtered.length})</h2>

                {/* Filters */}
                <div className="filters">
                  <Filter className="ico muted" />
                  <select className="ui-select"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="needs_manual_grading">Chưa chấm (tự luận)</option>
                    <option value="graded">Đã chấm</option>
                    <option value="submitted">Đã nộp</option>
                    <option value="in_progress">Đang làm</option>

                  </select>

                </div>
              </div>

              <table className="ui-table">
                <thead className="ui-table__head">
                  <tr className="ui-table__row">
                    <th className="ui-table__cell is-head">Sinh viên</th>
                    <th className="ui-table__cell is-head text-center">Mã SV</th>
                    <th className="ui-table__cell is-head text-center">Khóa</th>
                    <th className="ui-table__cell is-head text-center">Lớp</th>
                    <th className="ui-table__cell is-head text-center">Trạng thái</th>
                    <th className="ui-table__cell is-head text-center">Chuyên ngành</th>
                    <th className="ui-table__cell is-head">Thời gian nộp</th>
                    <th className="ui-table__cell is-head text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="ui-table__body">
                  {filtered.map((sub) => (
                    <tr key={sub._id} className="ui-table__row hover">
                      <td className="ui-table__cell fw">{sub.studentEmail || "..."}</td>

                      <td className="ui-table__cell text-center">—</td>

                      <td className="ui-table__cell text-center">
                        <span className="ui-badge ui-badge--outline">—</span>
                      </td>

                      <td className="ui-table__cell text-center">—</td>

                      <td className="ui-table__cell text-center">
                        {sub.status === "graded" ? (
                          <span className="ui-badge ui-badge--default on">Đã chấm</span>
                        ) : sub.status === "needs_manual_grading" ? (
                          <span className="ui-badge ui-badge--outline">Chưa chấm</span>
                        ) : (
                          <span className="ui-badge ui-badge--secondary">{sub.status}</span>
                        )}
                      </td>

                      <td className="ui-table__cell text-center">
                        {sub.examRoomId?.terminology || "—"}
                      </td>

                      <td className="ui-table__cell muted">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}
                      </td>

                      <td className="ui-table__cell text-right">
                        <button
                          className={`btn ${sub.status === "needs_manual_grading" ? "btn--primary" : "btn--ghost"}`}
                          onClick={() => navigate(`/ket_qua/${sub._id}`)}
                        >
                          {sub.status === "graded" ? "Xem lại" : "Chấm điểm"}
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

export default InstructorAttempts;
