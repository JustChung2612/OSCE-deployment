import express from "express";
import {
  getExamStationById,
  assignRandomPatientCase,
  updateExamStation,
  deleteExamStation,
} from "../controllers/examStation.controller.js";

const router = express.Router();

// 🎯 Lấy bệnh án ngẫu nhiên (put this FIRST)
router.get("/:id/assign", assignRandomPatientCase);

// 📋 Lấy chi tiết trạm thi
router.get("/:id", getExamStationById);

// ✏️ Cập nhật trạm thi
router.patch("/:id", updateExamStation);

router.delete("/:id", deleteExamStation);

export default router;
