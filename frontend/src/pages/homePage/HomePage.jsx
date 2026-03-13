import "./homePage.scss";
import { useEffect, useState } from "react";
import axios from "axios";     
import { Link } from "react-router-dom";
import { Search, Stethoscope, CheckCircle2, Bot , LibraryBig  } from "lucide-react";
import ExamRoomCard from "../../components/examRoomCard/ExamRoomCard";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const HomePage = () => {

  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {

    if (!code.trim()) {
      toast.error("Vui lòng nhập mã phòng thi!");
      return;
    }
    try {
      setIsJoining(true); 
      const res = await axiosInstance.post("/exam-rooms/join", {
        code,
      });
      if (res.status === 200) {
        toast.success("🎓 Tham gia phòng thi thành công!");
        const room = res.data.data;
        const firstStationId = room?.stations?.[0]?._id;

        if (!firstStationId) {
          return toast.error("Phòng thi chưa có trạm. Vui lòng liên hệ giảng viên.");
        }

        // 👉 go directly to station page
        navigate(`/osce/tram/${firstStationId}`);
      }
    } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tham gia phòng thi.");

    } finally {

        setIsJoining(false); // 🛑 stop loading no matter what
    }
  };

  const [rooms, setRooms] = useState([]);             // 🆕
  const [loadingRooms, setLoadingRooms] = useState(true); // 🆕

  useEffect(() => {                                   // 🆕
    const fetchRooms = async () => {
      try {
        const res = await axiosInstance.get("/exam-rooms");
        // Prefer published rooms if status exists; fall back to all
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const published = list.filter((r) => r.status === "Đã phát hành");
        setRooms(published.length ? published : list);
      } catch (err) {
        console.error("❌ Lỗi tải phòng thi:", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);


  return (
    <div className="home">
      <section className="account-demo">
        <h3>Tài Khoản Demo</h3>
        <div className="account-container" >
          <div className="acc-box">
            <h4>ADMIN:</h4>
            <p> <b>Email:</b> &nbsp; <span>  admin1@gmail.com </span> </p>
            <p> <b>Password:</b> &nbsp; <span> abc123456 </span> </p>
          </div>
          <div className="acc-box">
            <h4>STUDENT:</h4>
            <p> <b>Email:</b> &nbsp; <span> user1@gmail.com </span> </p>
            <p> <b>Password:</b> &nbsp; <span> abc123456 </span> </p>
          </div>
        </div>
      </section>
      {/* Section 1 - Giới thiệu nền tảng (nền trắng) */}
      <section className="section section--intro">
          <div className="intro__flex">
            <div className="intro__copy">
              <h1 className="intro__title">
                Nền tảng thi 
                <br/> 
                <span className="loader" > 
                  <span className="loader-text">Trạm OSCE</span> 
                </span> 
                <br/> 
                toàn diện dành cho sinh viên y khoa.
              </h1>
              <p className="intro__subtitle">
                Nền tảng giúp sinh viên Y thuận tiện trong việc thi Trạm OSCE dưới dạng Trắc Nghiệm và tự Luận
              </p>

              <div className="intro__visual__inner">
                
                  <div className='intro-search-con' >
                    <div className="intro-search">
                      <Search className='icon' />
                      <input 
                          type="text" 
                          id="intro-search-input" 
                          placeholder="Nhập mã phòng trạm tại đây..." 
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn-section btn-vaoTram"
                      onClick={handleJoin}
                      disabled={isJoining} // 🛑 disable when loading
                    >
                      {isJoining ? (
                        <>
                          ⏳ Đang vào trạm...
                        </>
                      ) : (
                        "Vào Trạm"
                      )}
                    </button>

                  </div>

                  <div className="visual-card">
                    <div className="visual-row">
                      <Stethoscope className="icon icon--lg text-primary" />
                      <span className="visual-row__title">Giao diện Bệnh nhân Ảo</span>
                    </div>
                    <div className="visual-list">
                      <div className="visual-list__item">
                        <CheckCircle2 className="icon icon--sm text-success" />
                        <span>Tình huống OSCE thực tế</span>
                      </div>
                      <div className="visual-list__item">
                        <CheckCircle2 className="icon icon--sm text-success" />
                        <span>Phiên luyện tập có giới hạn thời gian</span>
                      </div>
                    </div>
                  </div>
                  

              </div> 

            </div>

            <div className='intro__images' >    
                
                  <div className="box box1" > 
                      <img src='./homepage/rotate1.png' alt="img1" /> 
                  </div>
                  <div className="box box2" > 
                      <img src="./homepage/rotate2.png" alt="img2" />
                  </div>
                  <div className="box box3" > 
                      <img src='./homepage/rotate1.png' alt="img3" />
                  </div>
            
            </div>

          </div>
      </section>

      {/* Section 2 - Hiện các phòng đang thi */}
      <section className="section--examRoom">
        <h2>Danh Sách Các Phòng Đang Thi</h2>

        {loadingRooms ? (
          <p>Đang tải phòng thi...</p>
        ) : rooms.length === 0 ? (
          <p>Hiện chưa có phòng nào.</p>
        ) : (
          <div className="examRoom-container">
            {rooms.map((room) => (
              <ExamRoomCard key={room._id} data={room} />
            ))}
          </div>
        )}

        <button className="btn-section btn-findRoom">
          Tìm Phòng Thi
        </button>
      </section>

      {/* Section 3 - Hiện mục Luyện Tập - Thư Viện */}
      <section className="section section--cta">
        <div className=" cta">
          <h2 className="cta__title">
            Sẵn sàng luyện tập và theo dõi tiến trình học tập
          </h2>
          <p className="cta__subtitle">
            Truy cập các trạm luyện tập OSCE mọi lúc, mọi nơi — và theo dõi sự tiến bộ của bạn theo thời gian.
          </p>

        
          <div className="cta_cards_area">
            <Link to="/sinh-vien" className='link' >
              <div className='cta_card' >
                <img src="https://www.healthskillstraining.com/wp-content/uploads/2020/05/Classroom-pix-1.jpg" 
                     alt="CTA Card Image 1" 
                />
                <div className='overlay'>
                  <h3> Luyện Tập Với AI </h3>
                  <Bot className="icon" />
                </div>
              </div>

            </Link>

            <Link to="/history" >

              <div className='cta_card' >
                <img src="https://library.mednet.iu.edu/_images/banners/hom-tablet.webp" 
                     alt="CTA Card Image 1" 
                />
                <div className='overlay'>
                  <h3> Thư Viện  </h3>
                  <LibraryBig className="icon" />
                </div>
              </div>

            </Link>
          </div>
        </div>
      </section>

  
    </div>
  );
};

export default HomePage;
