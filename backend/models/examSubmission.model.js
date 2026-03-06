// models/examSubmission.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId: { type: Number, required: true }, // matches cau_hoi.id in PatientCase
    kieu: { type: String, enum: ["radio", "checkbox", "text"], required: true },

    // Student answer (string | array | text)
    answer: { type: Schema.Types.Mixed, default: null },

    // Auto grading (radio/checkbox)
    isCorrect: { type: Boolean, default: null }, // null for text until graded logic decides
    autoScore: { type: Number, default: 0, min: 0 },

    // Teacher grading (text)
    manualScore: { type: Number, default: null, min: 0 }, // null until teacher grades
    comment: { type: String, default: "" },
  },
  { _id: false }
);

const StationSubmissionSchema = new Schema(
  {
    stationId: { type: Schema.Types.ObjectId, ref: "ExamStation", required: true },
    patientCaseId: { type: Schema.Types.ObjectId, ref: "PatientCase", required: true },

    answers: { type: [AnswerSchema], default: [] },

    autoScore: { type: Number, default: 0, min: 0 },
    manualScore: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, default: 0, min: 0 },

    // If station has essay questions, it may need manual grading
    needsManualGrading: { type: Boolean, default: false },
    isFullyGraded: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExamSubmissionSchema = new Schema(
  {
    examRoomId: { type: Schema.Types.ObjectId, ref: "ExamRoom", required: true },

    // Student identity
    studentId: { type: Schema.Types.ObjectId, ref: "User" }, // optional (if you want)
    studentEmail: { type: String, required: true, trim: true, lowercase: true },

    // One submission contains ALL stations in that room for this student
    stations: { type: [StationSubmissionSchema], default: [] },

    totalAutoScore: { type: Number, default: 0, min: 0 },
    totalManualScore: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "needs_manual_grading", "graded"],
      default: "submitted",
    },

    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate final submissions per room per student email
ExamSubmissionSchema.index({ examRoomId: 1, studentEmail: 1 }, { unique: true });

const ExamSubmission = mongoose.model("ExamSubmission", ExamSubmissionSchema);
export default ExamSubmission;
