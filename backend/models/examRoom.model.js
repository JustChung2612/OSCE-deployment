import mongoose from "mongoose";
const { Schema } = mongoose;

const ExamRoomSchema = new Schema(
    {
        // 📌 Mã phòng 
        exam_room_code: { 
            type: String, required: true, unique: true, trim: true 
        },

        // 📘 Tên phòng thi
        exam_room_name: {
            type: String, required: true, trim: true,
        },

        // 🩺 Chuyên ngành / Chủ đề
        terminology: {
            type: String, required: true, trim: true,
        },

        // ⚙️ Trạng thái phòng thi
        status: {
            type: String,
            enum: ["Bản nháp", "Đã phát hành", "Đã đóng", "Đã lưu trữ"],
            default: "Bản nháp",
        },


        // 🧩 Danh sách trạm thuộc phòng (ref tới ExamStation)
        stations: [
            {
                type: Schema.Types.ObjectId,
                ref: "ExamStation",
            },
        ],

        // ⏰ Khung thời gian hoạt động của phòng
        timeWindow: {
            startAt: { type: Date },
            endAt: { type: Date },
        },

        // 👨‍🏫 Giáo viên / người tạo phòng
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // 🗓️ Thời gian phát đề / phát hành
        publishedAt: { type: Date },

        // 🔧 Cấu hình chung cho phòng thi
        exam_room_settings: {
            defaultStationDuration: { type: Number, default: 15 }, // phút / trạm
            randomizationStrategy: {
                type: String,
                enum: ["onJoin", "preAssign", "seeded"],
                default: "onJoin",
            },
        },

        // 🎓 Danh sách sinh viên được phép vào trực tiếp (theo email)
        //    Sẽ được dùng khi giáo viên thêm danh sách trong StudentLists.jsx
        allowedStudents: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

    },
    {
        timestamps: true,
    }
);

const ExamRoom = mongoose.model("ExamRoom", ExamRoomSchema );
export default ExamRoom; 