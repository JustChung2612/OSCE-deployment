import express from "express";
import { createExamRoom, 
         getExamRooms, 
         getExamRoomById, 
         updateExamRoom,
         publishExamRoom,
         deleteExamRoom,
         getRoomStudents,          // 🆕 add this
         saveRoomStudents,          // 🆕 add this
         joinExamRoom,
        checkAllowedStudent, } from "../controllers/examRoom.controller.js";

const router = express.Router();

/**
 * 🧩 Exam Room Routes
 * Base path: /api/exam-rooms
 */

// ➕ Tạo phòng thi mới (RoomPopup → POST)
router.post("/", createExamRoom);

// 📋 Lấy danh sách tất cả phòng thi (ExamRoomList)
router.get("/", getExamRooms);

// 🔍 Lấy chi tiết 1 phòng thi (EditExamRoom)
router.get("/:id", getExamRoomById);

// ✏️ Cập nhật thông tin phòng thi
router.patch("/:id", updateExamRoom);

// 🗑️ Xóa phòng thi
router.delete("/:id", deleteExamRoom);

// 🚀 Phát đề thi
router.post("/:id/publish", publishExamRoom);

// 🎓 Sinh viên tham gia phòng thi
router.post("/join", joinExamRoom);

// 🆕 Get assigned students for a room
router.get("/:id/students", getRoomStudents);

// 🆕 Save assigned students to a room
router.post("/:id/students", saveRoomStudents);

router.get("/:roomId/check-allowed", checkAllowedStudent);

export default router;