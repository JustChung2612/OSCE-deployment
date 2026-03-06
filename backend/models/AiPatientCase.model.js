import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * 📌 AI Patient Case Schema
 * Used for AI Patient Practice system
 * Contains:
 * - candidate_instruction (Hướng dẫn thí sinh)
 * - ai_patient_script_model (Hồ sơ bệnh nhân)
 * - ai_assess_schema (AI evaluation rubric – used later)
 */

const AiPatientCaseSchema = new Schema(
  {
    // 🏷️ Topic name displayed in AiPatientListTab
    // similar to name_symptom but avoid accessing nested field from frontend
    title: {
      type: String, // This and name_symptom are the same
      required: true,
      trim: true,
    },

    // ================= Candidate Instruction =================
    // Hướng dẫn thí sinh
    candidate_instruction: [
      {
        type: String,
        trim: true,
      },
    ],

    // ================= AI Patient Script =================
    ai_patient_script_model: {
      brief_info: {
        name_symptom: {
          type: String, // This and title are the same
          default: "",
          trim: true,
        },

        desc: {
          type: String,
          default: "",
          trim: true,
        },

        topic: {
          type: String,
          default: "",
          trim: true,
        },
      },

      key_details: [{ type: String, trim: true }],

      presenting_complaint: [{ type: String, trim: true }],
      history_of_presenting_complaint: [{ type: String, trim: true }],
      ice: [{ type: String, trim: true }],

      past_medical_and_surgical_history: [{ type: String, trim: true }],
      drug_history: [{ type: String, trim: true }],
      family_history: [{ type: String, trim: true }],

      diagnosis: {
        type: String,
        default: "",
        trim: true,
      },

      score: {
        type: Number,
        default: 10,
      },
    },

    // ================= AI Assess Schema =================
    // Rubric for AI evaluation (used later when AI grading is integrated)
    ai_assess_schema: {
      case: {
        type: String,
        default: "",
        trim: true,
      },

      data_gathering: {
        score: { type: Number, default: 0 },
        covered: [{ type: String, trim: true }],
        partially_covered: [{ type: String, trim: true }],
        missed: [{ type: String, trim: true }],
      },

      management: {
        score: { type: Number, default: 0 },
        covered: [{ type: String, trim: true }],
        partially_covered: [{ type: String, trim: true }],
        missed: [{ type: String, trim: true }],
      },

      interpersonal_skills: {
        score: { type: Number, default: 0 },
        covered: [{ type: String, trim: true }],
        partially_covered: [{ type: String, trim: true }],
        missed: [{ type: String, trim: true }],
      },

      feedback: {
        need_improvement: [{ type: String, trim: true }],
        good: [{ type: String, trim: true }],
      },
    },
  },
  {
    timestamps: true,
  }
);

const AiPatientCase = mongoose.model("AiPatientCase", AiPatientCaseSchema);
export default AiPatientCase;