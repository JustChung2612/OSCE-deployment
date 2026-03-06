import "./signUpPage.scss";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "../../stores/useUserStore";
import GoogleLoginButton from "../../components/GoogleAuth/GoogleLoginButton";

const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const passwordRules = [
  { id: "len",   test: (v) => v.length >= 8,        label: "Minimum 8 characters" },
  { id: "num",   test: (v) => /\d/.test(v),         label: "There is at least 1 number" },
  { id: "alpha", test: (v) => /[A-Za-z]/.test(v),   label: "Has at least 1 letter" },
];

export default function SignupPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState({ 
    username:false, email:false, password:false, 
    confirm:false, maSinhVien: false,
  }); 

  // ✅ Unified sign-up data object
  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    maSinhVien: "",
  });

  const { username, email, password, confirm, maSinhVien } = signUpData;
  
  const usernameError = useMemo(() => {
    if (!touched.username) return "";
    if (!username.trim()) return "Please enter username.";
    if (username.trim().length < 3) return "Username must be at least 3 characters.";
    return "";
  }, [username, touched.username]);

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!email) return "Please enter email.";
    if (!emailRegex.test(email)) return "Invalid email.";
    return "";
  }, [email, touched.email]);

  const passErrors = useMemo(() => {
    if (!touched.password) return [];
    return passwordRules.filter((r) => !r.test(password));
  }, [password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirm) return "";
    if (!confirm) return "Please confirm password.";
    if (confirm !== password) return "Confirmation password does not match.";
    return "";
  }, [confirm, password, touched.confirm]);

  // ✅ NEW — validate Mã Sinh Viên (6 digits)
  const maSinhVienError = useMemo(() => {
    if (!touched.maSinhVien) return "";
    if (!maSinhVien.trim()) return "Vui lòng nhập mã sinh viên.";
    if (!/^\d{6}$/.test(maSinhVien)) return "Mã sinh viên phải gồm đúng 6 chữ số.";
    return "";
  }, [maSinhVien, touched.maSinhVien]);


  const allValid =
    !usernameError &&
    !emailError &&
    passErrors.length === 0 &&
    confirm === password &&
    password.length > 0 &&
    !maSinhVienError;

  // ✅ UPDATED add handleChange
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSignUpData(prev => ({...prev, [name]: value }))
  }

  // ✅ Call the Zustand hook
  const { signup, loading } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ 
      username:true, email:true, password:true, 
      confirm:true, maSinhVien: true,
    });
    if (!allValid) return;

    try {
      await signup(signUpData);                        
     
    } catch (error) {
      console.error("Error in Handle Submit:",error.message);
    }
    
  };

  return (
    <div className="signup-container">
      <div className="background-glow" />
      <AnimatedOrbs />

      <div className="signup-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="signup-card-wrapper"
        >
          <motion.div
            className="signup-card"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <GlowBorder />

            <div className="signup-header">
              <h1>SIGN UP</h1>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">

                <label htmlFor="username">Tên Người Dùng</label>
                <div className="input-wrapper">
                  <input
                    id="username"
                    name="username"        // ✅ add
                    type="text"
                    value={username}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                    placeholder="Your user name?"
                    className={usernameError ? "error" : ""}
                  />
                  <StatusDot ok={!usernameError && username.length > 0} bad={!!usernameError} />
                </div>
                {usernameError && <p className="error-text">{usernameError}</p>}
              </div>

              {/* 📧 Email */}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    name="email"           // ✅ add
                    type="email"
                    value={email}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="abcxyz@example.com"
                    className={emailError ? "error" : ""}
                  />
                  <StatusDot ok={!emailError && email.length > 0} bad={!!emailError} />
                </div>
                {emailError && <p className="error-text">{emailError}</p>}
              </div>

              {/* 🎓 Mã Sinh Viên */}
              <div className="form-group">
                <label htmlFor="maSinhVien">Mã Sinh Viên / Giáo Viên</label>
                <div className="input-wrapper">
                  <input
                    id="maSinhVien"
                    name="maSinhVien"
                    type="text"
                    value={maSinhVien}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, maSinhVien: true }))}
                    placeholder="Nhập mã sinh viên (6 chữ số)"
                    className={maSinhVienError ? "error" : ""}
                  />
                  <StatusDot ok={!maSinhVienError && maSinhVien.length === 6} bad={!!maSinhVienError} />
                </div>
                {maSinhVienError && <p className="error-text">{maSinhVienError}</p>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">Mật Khẩu</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"        // ✅ add
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    className={passErrors.length && touched.password ? "error" : ""}
                  />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="show-password-btn">
                    {showPwd ? "Hide" : "Show"}
                  </button>
                  <StatusDot ok={touched.password && passErrors.length === 0 && password.length > 0} bad={touched.password && passErrors.length > 0} />
                </div>

                <div className="password-rules">
                  {passwordRules.map((r) => {
                    const ok = r.test(password);
                    return (
                      <div key={r.id} className={`rule ${ok ? "ok" : ""}`}>
                        <span className="rule-dot" />
                        {r.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirm */}
              <div className="form-group">
                <label htmlFor="confirm">Xác Nhận Mật Khẩu</label>
                <div className="input-wrapper">
                  <input
                    id="confirm"
                    name="confirm"         // ✅ add
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    placeholder="Re-enter password"
                    className={confirmError ? "error" : ""}
                  />
                  <StatusDot ok={!confirmError && confirm.length > 0} bad={!!confirmError} />
                </div>
                {confirmError && <p className="error-text">{confirmError}</p>}
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={loading} className="signup-btn" whileTap={{ scale: 0.98 }}>
                {loading ? <Spinner /> : "SIGN UP"}
              </motion.button>

              {/* Divider */}
              <div className="divider"><span>OR</span></div>

              {/* Google signup */}
              <GoogleLoginButton/>
            </form>

          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function StatusDot({ ok, bad }) {
  return <span className={`status-dot ${ok ? "ok" : bad ? "bad" : ""}`} />;
}
function Spinner() { return <div className="spinner" />; }
function GlowBorder() { return <div className="glow-border" />; }
function AnimatedOrbs() {
  return (
    <div className="animated-orbs">
      {[...Array(8)].map((_, i) => (
        <motion.span
          key={i}
          className="orb"
          animate={{ x: [0, 100, -100, 0], y: [0, 80, -80, 0] }}
          transition={{ duration: 15 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
