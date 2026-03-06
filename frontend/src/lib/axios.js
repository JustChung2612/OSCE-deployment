import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,   // For deployment runninng    
    withCredentials: true, // send cookies to the server
});

export default axiosInstance;

// NOTE: 
/*
  If Wanna use Local running:
   + Copy and paste this :   VITE_API_URL=http://localhost:5000/api
   + Delete the old one

  If Wanna use for deployment:
   + Copy and paste this :   VITE_API_URL=https://osce-backend.vercel.app/api 
   + Delete the old one
 */