import { Link } from "react-router-dom";
import './header.scss';
import { School, LibraryBig , LogIn, LogOut , UserPlus  } from 'lucide-react';
import { useUserStore } from "../../stores/useUserStore";

const Header = () => {

  
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  // console.log(user);


  return (
    <div className='header'>
      <div className='wrapper' >
          <div className='logo'> 
            <Link to="/" style={{ textDecoration: "none" }}>
              <img src="./homepage/logo.png" alt="" />
            </Link>
          </div>

          <div className='items' >
            
            
            <div className='item'>
              {user ? (
                <div className="user">
                  <Link to={isAdmin ? "/quan-tri" : "/sinh-vien"} className='avatarLink' >
                    <div className='avatar' >             
                      <img
                        src={ './noAvatar.jpg' }
                        alt=""
                      />
                      {/* <span>{currentUser.username}</span> */}
                      <span>{user.username}</span>
                    </div>
                  </Link>

                  
                  <button className="navButton" onClick={logout} >
                      <LogOut className="icon" /> 
                      <span>Đăng Xuất</span>
                  </button>
                </div>
              ) : (
                <>
                <Link to='/dang-nhap' className="navButton" >
                  
                    <LogIn className="icon"  /> 
                    <span> Đăng Nhập </span>
                  
                </Link>
                <Link to='/dang-ky' className="navButton" >
                  
                    <UserPlus className="icon" /> 
                    <span> Đăng Ký </span>
                  
                </Link>

                </>
              )}
            </div>



          </div>
      </div>      
    </div>
  )
}

export default Header