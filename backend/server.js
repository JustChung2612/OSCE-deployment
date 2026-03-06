import express from "express";
import cors from 'cors';
import 'dotenv/config';
import cookieParser from "cookie-parser";
import { connectDB_local, connectDB_atlas } from './lib/db.js';

import authRoutes from './routes/auth.route.js';
import patientCaseRoutes from './routes/patientCase.route.js';
import examRoomRoutes from "./routes/examRoom.route.js";
import examStationRoutes from "./routes/examStation.route.js";
import examSubmissionRoutes from "./routes/examSubmission.route.js";
import aiPatientCaseRoutes from "./routes/AiPatientCase.route.js";

const app = express();
const PORT = process.env.PORT || 5000; // Add this process.env.PORT 
                                       // => to use PORT injected by vercel
                                       // if use hardcode 5000 => work locally , but break deployment

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",  // ✅ must match your frontend URL exactly
    credentials: true,                // ✅ allow cookies / session sharing
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ message: "OSCE backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patient-cases", patientCaseRoutes);
app.use("/api/exam-rooms", examRoomRoutes);
app.use("/api/exam-stations", examStationRoutes);
app.use("/api/exam-submissions", examSubmissionRoutes);
app.use("/api/ai-cases", aiPatientCaseRoutes);

// connectDB_local();
connectDB_atlas();

export default app;