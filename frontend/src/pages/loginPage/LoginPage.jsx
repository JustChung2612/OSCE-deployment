//LoginPage.jsx
import "./loginPage.scss"; 
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion"; 
import { useUserStore } from "../../stores/useUserStore";
import GoogleLoginButton from "../../components/GoogleAuth/GoogleLoginButton";

// Validation rules 
// kiểm tra định dạng email chuẩn
const emailRegex =
  /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;


export default function LoginPage() {

  const [showPassword, setShowPassword] = useState(false); // Bật/tắt hiển thị mật khẩu
  const [touched, setTouched] = useState({ 
    email: false, password: false
  }); 
  

  // ✅ Unified sign-up data object
  const [logInData, setLogInData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = logInData;

  // Kiểm tra lỗi email
  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!email) return "Please enter email.";
    if (!emailRegex.test(email)) return "Invalid email.";
    return "";
  }, [email, touched.email]);

  // Kiểm tra lỗi mật khẩu
  const passErrors = useMemo(() => {
  if (!touched.password) return [];
  if (!password) return ["Password required"];
  return [];
  }, [password, touched.password]);

  const allValid =
    emailRegex.test(email) && 
    passErrors.length === 0 && 
    password.length > 0 ;

  // ✅ UPDATED add handleChange
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setLogInData(prev => ({...prev, [name]: value }))
  }

  // ✅ Call the Zustand hook
  const { login, loading, loginWithGoogle } = useUserStore();

  //  Gửi form đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault(); // Chặn reload trang
    setTouched({ email: true, password: true }); 
    if (!allValid) return; 
   
    try {
      await login(logInData);   

    } catch(error){
      console.error("Error in Handle Submit:",error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="background-glow" />
      <AnimatedOrbs />
      <div className="login-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="login-card-wrapper"
        >
          <motion.div
            className="login-card"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <GlowBorder />
            <div className="login-header">
              <h1>LOGIN</h1>
            </div>
            <form onSubmit={handleSubmit} className="login-form">

              <div className="form-group">
                {/* 📧 Email */}
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    name="email"                // ✅ add this
                    type="email"
                    value={email}
                    onChange={handleChange}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, email: true }))
                    }
                    placeholder="abcxyz@example.com"
                    className={emailError ? "error" : ""}
                  />
                  <StatusDot
                    ok={!emailError && email.length > 0}
                    bad={!!emailError}
                  />
                </div>
                {emailError && <p className="error-text">{emailError}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật Khẩu</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"             // ✅ add this
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handleChange}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, password: true }))
                    }
                    placeholder="••••••••"
                    className={
                      passErrors.length && touched.password ? "error" : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="show-password-btn"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <StatusDot
                    ok={
                      touched.password &&
                      passErrors.length === 0 &&
                      password.length > 0
                    }
                    bad={touched.password && passErrors.length > 0}
                  />
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={loading} className="login-btn" whileTap={{ scale: 0.98 }}
              >
                {loading ? <Spinner /> : "LOGIN"}
              </motion.button>

              <div className="divider">
                <span>OR</span>
              </div>

              <GoogleLoginButton />

            </form>
          
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}


// Hiển thị chấm tròn xanh or đỏ
function StatusDot({ ok, bad }) {
  return (
    <span className={`status-dot ${ok ? "ok" : bad ? "bad" : ""}`}></span>
  );
}

// Hiển thị vòng quay load
function Spinner() {
  return <div className="spinner"></div>;
}

// Viền quanh card
function GlowBorder() {
  return <div className="glow-border"></div>;
}

// animation di chuyển nền
function AnimatedOrbs() {
  return (
    <div className="animated-orbs">
      {[...Array(8)].map((_, i) => (
        <motion.span
          key={i}
          className="orb"
          animate={{ x: [0, 100, -100, 0], y: [0, 80, -80, 0] }}
          transition={{
            duration: 15 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
