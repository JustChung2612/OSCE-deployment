// src/components/auth/GoogleLoginButton.jsx
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { useUserStore } from "../../stores/useUserStore";
import { toast } from "react-hot-toast";

// Reuse Google icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 533.5 544.3">
      <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.7-36.3-5-53.6H272.1v101.5h147c-6.3 34-25.1 62.7-53.6 81.9v68.1h86.6c50.7-46.7 81.4-115.5 81.4-198z"/>
      <path fill="#34A853" d="M272.1 544.3c73.6 0 135.3-24.4 180.4-66.2l-86.6-68.1c-24.1 16.2-54.9 25.9-93.8 25.9-71.9 0-132.8-48.5-154.5-113.6H28.4v71.2c45 89.2 137.5 150.8 243.7 150.8z"/>
      <path fill="#FBBC05" d="M117.6 322.3c-10.5-31.4-10.5-65.5 0-96.9V154.2H28.4c-39.3 78.6-39.3 171.4 0 250l89.2-81.9z"/>
      <path fill="#EA4335" d="M272.1 106.1c39.9-0.6 77.2 14.8 105.9 42.9l78.9-78.9C407.3 24.5 345.8-0.1 272.1 0 165.9 0 73.4 61.6 28.4 150.8l89.2 71.2c21.7-65.1 82.6-115.9 154.5-115.9z"/>
    </svg>
  );
}

export default function GoogleLoginButton() {
  const { loginWithGoogle, loading } = useUserStore();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await loginWithGoogle(tokenResponse.access_token);
    },
    onError: () => {
      toast.error("Google login failed");
    }, 
  },);

  return (
    <motion.button
      type="button"
      className="google-btn"
      onClick={() => googleLogin()}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      
    >
      <GoogleIcon />
      <span> Đăng nhập bằng Google </span>
    </motion.button>
  );
}
