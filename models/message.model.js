import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
