// ===========================
// 🩺 MẪU BỆNH ÁN TÌNH HUỐNG (CHUẨN HÓA)
// ===========================

const Mau_Tram_Thi = {
  // ======= METADATA (Dành cho bộ lọc tìm kiếm trong Admin) =======
  "metadata": {
    "chuan_doan": "",           // Ví dụ: "Nội tim mạch – Suy tim"
    "co_quan": "",           // Ví dụ: "Tim mạch", "Hô hấp", "Thận – tiết niệu"
    "trieu_chung": "",       // Ví dụ: "Khó thở", "Ho ra máu", "Lơ mơ", ...
    "do_kho": "",            // Ví dụ: "Cơ bản", "Trung bình", "Nâng cao"
    "doi_tuong": "",         // Ví dụ: "Người lớn", "Người già", "Trẻ em", "Thai phụ"
  },

  "ten_benh_an" : "", // Ví dụ: Hô Hấp , Tim Mạch (Giống Cơ Quan)

  // Tổng điểm tối đa của bệnh án
  "totalPoints": 0, // min: 0, max: 10

  // ======= BỆNH ÁN TÌNH HUỐNG =======
  "benh_an_tinh_huong": {
    // ------------------------------
    // Thông Tin Bệnh Nhân
    // ------------------------------
    "thong_tin_benh_nhan": {
      "ho_ten": "",
      "tuoi": null,
      "gioi_tinh": "",
      "nghe_nghiep": "",
      "ly_do_nhap_vien": ""
    },

    // ------------------------------
    // Bệnh Sử (3 đoạn mô tả tối đa)
    // ------------------------------
    "benh_su": {
      "mo_ta1": "", // đoạn 1 - thường là diễn tiến chính
      "mo_ta2": "", // đoạn 2 - chi tiết bổ sung hoặc tiền triệu
      "mo_ta3": ""  // đoạn 3 - các biến cố hoặc xử trí trước nhập viện
    },

    // ------------------------------
    // Tiền Căn (hiển thị dạng bullet points)
    // ------------------------------
    "tien_can": [
      // ví dụ:
      // "Tăng huyết áp 10 năm, điều trị không đều",
      // "Đái tháo đường type 2 kiểm soát kém"
    ],

    // ------------------------------
    // Lược Qua Các Cơ Quan (hiển thị dạng bullet points)
    // ------------------------------
    "luoc_qua_cac_co_quan": [
      // ví dụ:
      // "Hô hấp: ho khan, không khó thở",
      // "Tim mạch: không đau ngực, không hồi hộp"
    ],

    // ------------------------------
    // Khám Lâm Sàng (hiển thị dạng bullet points)
    // ------------------------------
    "kham_lam_sang": [
      // ví dụ:
      // "Mạch 110 lần/phút, không đều",
      // "Phổi có ran ẩm hai đáy",
      // "Gan sờ dưới bờ sườn phải 2 cm"
    ]
  },

  // ======= CÂU HỎI =======
  "cau_hoi": [
    {
      "id": 1,
      "noi_dung": "Câu hỏi 1",
      "kieu": "radio",
      "lua_chon": ["Đáp án 1", "Đáp án 2", "Đáp án 3"],
      "dap_an_dung": "",
      "diem": 0, // Điểm cho câu hỏi min: 0, max: 10
      "bat_buoc": true, // true or false

    },
    {
      "id": 2,
      "noi_dung": "Câu hỏi 2",
      "kieu": "checkbox",
      "lua_chon": ["Đáp án 1", "Đáp án 2", "Đáp án 3"],
      "dap_an_dung": [""],
      "diem": 0, // Điểm cho câu hỏi min: 0, max: 10
      "bat_buoc": true, // true or false
    },
    {
      "id": 3,
      "noi_dung": "Câu hỏi 3",
      "kieu": "text",
      "goi_y": "",
      "dap_an_dung": "",
      "diem": 0, // Điểm cho câu hỏi min: 0, max: 10
      "bat_buoc": true, // true or false
    }
  ]
};

export default Mau_Tram_Thi;
