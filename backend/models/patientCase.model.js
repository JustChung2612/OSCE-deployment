import mongoose from 'mongoose';

const { Schema } = mongoose;

// 🩺 PatientCase Schema 
const PatientCaseSchema = new Schema(
  {

    metadata: {
      chuan_doan: { type: String },   // Diagnosis
      co_quan: { type: String },      // Organ system
      trieu_chung: { type: String },  // Symptom
      do_kho: { type: String },       // Difficulty level
      doi_tuong: { type: String }     // Target group
    },

    ten_benh_an: { type: String }, // PatientCase name

    // Tổng điểm tối đa của bệnh án
    totalPoints: { type: Number, default: 0, min: 0, max: 10 },

    benh_an_tinh_huong: {
      thong_tin_benh_nhan: {
        ho_ten: { type: String },
        tuoi: { type: Number },
        gioi_tinh: { type: String },
        nghe_nghiep: { type: String },
        ly_do_nhap_vien: { type: String }
      },
      benh_su: {
        mo_ta1: { type: String },
        mo_ta2: { type: String },
        mo_ta3: { type: String }
      },
      tien_can: [{ type: String }],
      luoc_qua_cac_co_quan: [{ type: String }],
      kham_lam_sang: [{ type: String }]
    },


    cau_hoi: [
      {
        id: { type: Number, required: true },
        noi_dung: { type: String, required: true },
        kieu: {
          type: String,
          enum: ['radio', 'checkbox', 'text'],
          required: true
        },
        lua_chon: [{ type: String }],     // Options for radio/checkbox
        goi_y: { type: String },          // Hint for text type
        dap_an_dung: { type: Schema.Types.Mixed }, // String or Array
        diem: { type: Number, default: 1, min: 0, max: 10 }, // Điểm cho câu hỏi

      }
    ]
  },
  { timestamps: true }
);


const PatientCase  = mongoose.model('PatientCase', PatientCaseSchema);
export default PatientCase ;
