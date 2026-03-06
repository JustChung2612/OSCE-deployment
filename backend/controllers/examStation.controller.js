import ExamStation from "../models/examStation.model.js";
import ExamRoom from "../models/examRoom.model.js";

/**
 * 📋 LẤY CHI TIẾT TRẠM THI (GET /api/exam-stations/:id)
 */
export const getExamStationById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🩺 1️⃣ Find the station and its patient cases
    const station = await ExamStation.findById(id).populate("patientCaseIds");
    if (!station)
      return res.status(404).json({ message: "Không tìm thấy trạm thi." });

    // 🧩 2️⃣ Find parent room and its stations (ordered)
    const parentRoom = await ExamRoom.findById(station.exam_room_Id)
      .populate({
        path: "stations",
        select: "_id stationIndex",
        options: { sort: { stationIndex: 1 } },
      })
      .select("_id exam_room_name stations");

    // 🧠 3️⃣ Combine station + parentRoom info
    const result = {
      ...station.toObject(),
      parentRoom: parentRoom
        ? {
            _id: parentRoom._id,
            exam_room_name: parentRoom.exam_room_name,
            stations: parentRoom.stations,
          }
        : null,
    };

    // ✅ 4️⃣ Send combined response
    res.status(200).json({
      message: "Thông tin trạm thi đã được tải thành công.",
      data: result,
    });
  } catch (error) {
    console.error("❌ Lỗi trong getExamStationById:", error);
    res.status(500).json({
      message: "Không thể tải dữ liệu trạm thi.",
      error: error.message,
    });
  }
};



/**
 * ✏️ CẬP NHẬT TRẠM THI (PATCH /api/exam-stations/:id)
 */
export const updateExamStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { stationName, durationMinutes } = req.body;

    const updatedStation = await ExamStation.findByIdAndUpdate(
      id,
      { stationName, durationMinutes },
      { new: true, runValidators: true }
    );

    if (!updatedStation)
      return res.status(404).json({ message: "Không tìm thấy trạm thi." });

    res.status(200).json({
      message: "Trạm thi đã được cập nhật thành công.",
      data: updatedStation,
    });
  } catch (error) {
    console.error("❌ Lỗi trong updateExamStation:", error);
    res.status(500).json({ message: "Không thể cập nhật trạm thi." });
  }
};


/**
 * 🎯 LẤY BỆNH ÁN NGẪU NHIÊN CHO SINH VIÊN (GET /api/exam-stations/:id/assign)
 * - Nếu chỉ có 1 bệnh án → tất cả sinh viên làm cùng bệnh án đó.
 * - Nếu có nhiều bệnh án → mỗi sinh viên nhận ngẫu nhiên 1 bệnh án khác nhau (tạm thời không lưu).
 */
export const assignRandomPatientCase = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await ExamStation.findById(id).populate("patientCaseIds");

    if (!station)
      return res.status(404).json({ message: "Không tìm thấy trạm thi." });

    const cases = station.patientCaseIds || [];

    // ❌ No cases
    if (cases.length === 0) {
      return res
        .status(400)
        .json({ message: "Trạm này chưa có bệnh án nào." });
    }

    // ✅ CASE 1 — Only one patient case
    if (cases.length === 1) {
      return res.status(200).json({
        message: "Tất cả sinh viên sẽ làm cùng một bệnh án.",
        data: cases[0],
      });
    }

    // ✅ CASE 2 — Multiple cases → random assignment
    const randomIndex = Math.floor(Math.random() * cases.length);
    const selectedCase = cases[randomIndex];

    return res.status(200).json({
      message: "Bệnh án được chọn ngẫu nhiên cho sinh viên.",
      data: selectedCase,
    });
  } catch (error) {
    console.error("❌ Lỗi trong assignRandomPatientCase:", error);
    res.status(500).json({ message: "Không thể chỉ định bệnh án." });
  }
};


// ✅ DELETE — remove exam station and unlink it from its exam room
export const deleteExamStation = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧱 Find the station
    const station = await ExamStation.findById(id);
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    // 🧩 Remove this station from its parent room (if exists)
    if (station.examRoomId) {
      await ExamRoom.findByIdAndUpdate(station.examRoomId, {
        $pull: { stations: id },
      });
    }

    // 🗑️ Delete the station
    await ExamStation.findByIdAndDelete(id);

    return res.status(200).json({ message: "Station deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting station:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete station", error: error.message });
  }
};
