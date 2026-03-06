// routes/examSubmission.route.js
import express from "express";
import {
  submitExamSubmission,
  getMySubmissions,
  getSubmissionsByRoom,
  getSubmissionById,
  gradeEssayAnswers,
} from "../controllers/examSubmission.controller.js";

const router = express.Router();

// Submit (auto-grade MCQ)
router.post("/submit", submitExamSubmission);

// Student overview
router.get("/me", getMySubmissions);

// Teacher view (submissions by room)
router.get("/room/:roomId", getSubmissionsByRoom);

// ResultPage data
router.get("/:id", getSubmissionById);

// Teacher grades essay
router.patch("/:id/grade-essay", gradeEssayAnswers);

export default router;
