import mongoose from "mongoose";
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60,
    },
});

const Otp = mongoose.model("otp", otpSchema);

export default Otp;
