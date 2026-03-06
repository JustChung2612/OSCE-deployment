import "./patientCaseCard.scss";
import { Eye, Edit, Trash2 } from "lucide-react"; 
import { Link } from "react-router-dom"

// import destructuring data from PatientCaseList.jsx
const PatientCaseCard = ({ data }) => {

  const { metadata, benh_an_tinh_huong, ten_benh_an } = data;
  const patient = benh_an_tinh_huong.thong_tin_benh_nhan;
  const diffClass =
    metadata.do_kho === "Cơ bản"
      ? "basic"
      : metadata.do_kho === "Trung bình"
      ? "medium"
      : "advanced";

  return (
    <div  className="patientCaseCard" draggable
      onDragStart={ (e) => {
          const { _id, ...rest } = data;
          e.dataTransfer.setData("application/json", JSON.stringify({ _id, ...rest }));
        }
      }
    >

      {/* Card Header */}
        <div className="cardHeader" >
          <div className="cardHeader_Title">
            
            <h2 className="subject" title={ten_benh_an}> 
                  {ten_benh_an.length > 20 ? ten_benh_an.slice(0, 70) + '...' : ten_benh_an  }
            </h2>
          </div>
        </div>

      {/* Card Body */}
      <div className="cardBody">
        <div className="cardInfo" >
          <p>
            <strong> Bệnh nhân:</strong> {patient.ho_ten} – {patient.tuoi} tuổi
          </p>
          <p>
            <strong> Lý do:</strong>
              { 
                patient.ly_do_nhap_vien.length > 10 
                  ? patient.ly_do_nhap_vien.slice(0, 30) + "…" 
                  : patient.ly_do_nhap_vien 
              }
          </p>
          <p>
            <strong> Cơ quan:</strong> {metadata.co_quan} 
          </p>
          <p>
            <strong> Đối tượng:</strong> {metadata.doi_tuong}
          </p>
        </div>
      
      </div>

      <div className="cardEnd">
                {/* Card Button */}
              <div className="cardBtn">
                <Link to={`/benh-an/${data._id}`} className='examLink'>
                  <button className="btn view">
                    <Edit size={16} /> Sửa
                  </button>
                </Link>

                <Link className='examLink' >
                  <button className="btn delete" >
                    <Trash2 size={16} /> Xóa
                  </button>
                </Link>
              </div>
                <span className={`difficultyBadge ${diffClass}`}>
                  {metadata.do_kho}
                </span>
      </div>


    </div>
  );


  // PatientCaseCard
};

export default PatientCaseCard ;
