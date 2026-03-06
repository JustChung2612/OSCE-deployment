import PatientCase from "../models/patientCase.model.js";

export const createPatientCase = async (req, res) => {
  try {
    const { metadata, ten_benh_an, benh_an_tinh_huong, cau_hoi } = req.body;

    if (!metadata || !benh_an_tinh_huong || !cau_hoi) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc, không thể tạo bệnh án trống." });
    }

    const normalizedQuestions = Array.isArray(cau_hoi)
      ? cau_hoi.map((q) => ({
          ...q,
          diem: Math.max(0, Number(q?.diem) || 0),
          bat_buoc: Boolean(q?.bat_buoc),
        }))
      : [];

    const totalPoints = normalizedQuestions.reduce(
      (sum, q) => sum + (Number(q?.diem) || 0),
      0
    );

    const patientCase = await PatientCase.create(
      {
        metadata,
        ten_benh_an,
        benh_an_tinh_huong,
        cau_hoi: normalizedQuestions,
        totalPoints,
      }
    );
    
    return res.status(201).json({ message: 'Patient Case created', data: patientCase });
  } catch (error) {
    console.log("Error in Create Patient Case controller", error.message);
    res.status(500).json({ message: error.message });
  }
};


export const getPatientCases = async (req, res) => {
  try {
    const {
      chuan_doan,
      co_quan,
      trieu_chung,
      do_kho,
      doi_tuong,
      do_tuoi,
      _id, // ✅ UPDATED
    } = req.query;

    const query = {};

    if (_id) query._id = _id;  // ✅ UPDATED: filter by ID

    if (chuan_doan) query['metadata.chuan_doan'] = { $regex: chuan_doan, $options: 'i' };
    if (co_quan) query['metadata.co_quan'] = { $regex: co_quan, $options: 'i' };
    if (trieu_chung) query['metadata.trieu_chung'] = { $regex: trieu_chung, $options: 'i' };
    if (do_kho) query['metadata.do_kho'] = do_kho;
    if (doi_tuong) query['metadata.doi_tuong'] = doi_tuong;

    if (do_tuoi) {
      const [min, max] = do_tuoi.split(',').map(Number);
      query['benh_an_tinh_huong.thong_tin_benh_nhan.tuoi'] = { $gte: min, $lte: max };
    }

    const patientCases = await PatientCase.find(query);
    res.status(200).json({ message: 'Fetched Patient Cases', count: patientCases.length, data: patientCases });
  } catch (error) {
    console.error('Error in getPatientCases controller', error.message);
    res.status(500).json({ message: error.message });
  }
};


// ==================== 🩺 GET SINGLE PATIENT CASE BY ID ====================
export const getPatientCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientCase = await PatientCase.findById(id);

    if (!patientCase) {
      return res.status(404).json({ message: "Không tìm thấy bệnh án." });
    }

    res.status(200).json({
      message: "Thông tin bệnh án đã được tải thành công.",
      data: patientCase,
    });
  } catch (error) {
    console.error("❌ Lỗi trong getPatientCaseById:", error);
    res.status(500).json({
      message: "Không thể tải dữ liệu bệnh án.",
      error: error.message,
    });
  }
};

// ==================== 🩹 UPDATE PATIENT CASE (PATCH) ====================
export const updatePatientCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { cau_hoi } = req.body;

    // Validate
    if (!Array.isArray(cau_hoi)) {
      return res.status(400).json({ message: "Dữ liệu câu hỏi không hợp lệ." });
    }

    // ✅ Normalize "diem" + "bat_buoc" so backend always stores valid values
    const normalizedQuestions = cau_hoi.map((q) => ({
      ...q,
      diem: Math.max(0, Number(q?.diem) || 0),
      bat_buoc: Boolean(q?.bat_buoc),
    }));

    const totalPoints = normalizedQuestions.reduce(
      (sum, q) => sum + (Number(q?.diem) || 0),
      0
    );

    const updated = await PatientCase.findByIdAndUpdate(
      id,
      { $set: { cau_hoi: normalizedQuestions, totalPoints } },
      { new: true }
    );


    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy bệnh án để cập nhật." });
    }

    res.status(200).json({
      message: "Bệnh án đã được cập nhật thành công.",
      data: updated,
    });

  } catch (error) {
    console.error("❌ Lỗi trong updatePatientCase:", error);
    res.status(500).json({
      message: "Không thể cập nhật bệnh án.",
      error: error.message,
    });
  }
};
