
import "./CompletePage.scss";

const CompletePage = ({ student, stations }) => {
  return (
    <div className="completion-page">
      <div className="completion-card">
        {/* --- Title --- */}
        <h2 className="completion-title">
          🎉 Bạn đã hoàn thành phòng thi
        </h2>

        {/* --- Student Information --- */}
        <div className="student-info">
          <p>
            <strong>Họ và tên:</strong> {student.name}
          </p>
          <p>
            <strong>Mã số sinh viên:</strong> {student.id}
          </p>
        </div>

        {/* --- Action Buttons --- */}
        <div className="action-buttons">
          <button>Quay lại Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default CompletePage;
