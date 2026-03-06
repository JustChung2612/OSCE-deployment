import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Name is required!"],
        },
        email: {
            type: String,
            required: [true, "Email is required!"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: { 
            type: String,
            enum: ["user" , "admin"],
            default: "user",
        },
        maSinhVien: { 
            type: String,   
        },
        googleId: {
            type: String,
            unique: false, // user may switch between email + google
        }

    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User" , userSchema);
export default User;