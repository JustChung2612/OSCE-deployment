// controllers/AiPatientCase.controller.js
import AiPatientCase from "../models/AiPatientCase.model.js";

/**
 * 📋 GET ALL AI PATIENT CASES (GET /api/ai-cases)
 * Optional: ?q=keyword (search by title)
 */
export const getAiPatientCases = async (req, res) => {
  try {
    const { q } = req.query;

    const filter = {};
    if (q && String(q).trim()) {
      filter.title = { $regex: String(q).trim(), $options: "i" };
    }

    const cases = await AiPatientCase.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "✅ Danh sách AI Patient Cases đã được tải thành công.",
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    console.error("❌ Lỗi trong getAiPatientCases:", error);
    return res.status(500).json({
      message: "Không thể tải danh sách AI Patient Cases.",
      error: error.message,
    });
  }
};

/**
 * 🔍 GET AI PATIENT CASE BY ID (GET /api/ai-cases/:id)
 */
export const getAiPatientCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const foundCase = await AiPatientCase.findById(id);
    if (!foundCase) {
      return res.status(404).json({
        message: "Không tìm thấy AI Patient Case.",
      });
    }

    return res.status(200).json({
      message: "✅ Chi tiết AI Patient Case.",
      data: foundCase,
    });
  } catch (error) {
    console.error("❌ Lỗi trong getAiPatientCaseById:", error);
    return res.status(500).json({
      message: "Không thể tải AI Patient Case.",
      error: error.message,
    });
  }
};
