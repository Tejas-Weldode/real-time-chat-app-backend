import mongoose from "mongoose";

const Schema = mongoose.Schema;

const chatSchema = new mongoose.Schema({
    uid1: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    uid2: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    saved1: {
        type: Boolean,
        default: false,
        required: true,
    },
    saved2: {
        type: Boolean,
        default: false,
        required: true,
    },
    unread1: {
        type: Number,
        default: 0,
        required: true,
    },
    unread2: {
        type: Number,
        default: 0,
        required: true,
    },
    latestMessage: {
        type: Date,
    },
});

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
