import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    fullName: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
});

const User = mongoose.model("User", userSchema);

export default User;