import express from "express";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import auth from "../middlewares/auth.js";
import { getReceiverSocketId } from "../socket/socket.js";
import { io } from "../socket/socket.js";

const router = express.Router();

// Send message to a particluar chat
router.post("/send", auth, async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.userId;
        //
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
        });
        await newMessage.save();
        //
        let chat = await Chat.findOne({
            $or: [{ uid1: receiverId }, { uid2: receiverId }],
        });
        if (!chat) {
            chat = new Chat({
                uid1: senderId,
                uid2: receiverId,
                unread1: 0,
                unread2: 0,
            });
        }
        chat.latestMessage = newMessage.timestamp;

        if (chat.uid1 == receiverId) {
            chat.unread1++;
            chat.unread2 = 0;
        } else if (chat.uid2 == receiverId) {
            chat.unread2++;
            chat.unread1 = 0;
        }
        await chat.save();
        //
        // socket.io functionality -- start
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        // -- end

        return res.status(201).json({ newMessage });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get messages of a particular chat
router.get("/get/:id", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const other = req.params.id; // the other person with whom the user is chatting

        const messages = await Message.find({
            $or: [
                {
                    $and: [{ senderId: userId }, { receiverId: other }],
                },
                {
                    $and: [{ senderId: other }, { receiverId: userId }],
                },
            ],
        }); // Sort by timestamp in descending order

        return res.status(200).json({ messages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
