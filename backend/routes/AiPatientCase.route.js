import express from "express";
import {
  getAiPatientCases,
  getAiPatientCaseById,
} from "../controllers/AiPatientCase.controller.js";

const router = express.Router();


// 📋 Get all
router.get("/", getAiPatientCases);

// 🔍 Get detail
router.get("/:id", getAiPatientCaseById);


export default router;