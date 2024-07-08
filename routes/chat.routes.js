import express from "express";
import Chat from "../models/chat.model.js";
import auth from "../middlewares/auth.js";
import User from "../models/user.model.js";

const router = express.Router();

// get recent chats
router.get("/recent", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const chats = await Chat.find({
            $or: [{ uid1: userId }, { uid2: userId }],
        })
            .populate("uid1", "fullName username profilePic")
            .populate("uid2", "fullName username profilePic")
            .sort({ latestMessage: -1 });
        // extract required data
        const recentChats = chats.map((chat) => {
            let name, unread, id, saved, username, profilePic;
            if (chat.uid1._id == userId) {
                name = chat.uid2.fullName;
                username = chat.uid2.username;
                profilePic = chat.uid2.profilePic;
                id = chat.uid2._id;
                unread = chat.unread1;
                saved = chat.saved1;
            } else if (chat.uid2._id == userId) {
                name = chat.uid1.fullName;
                username = chat.uid1.username;
                profilePic = chat.uid1.profilePic;
                id = chat.uid1._id;
                unread = chat.unread2;
                saved = chat.saved2;
            }
            return { name, unread, id, saved, username, profilePic };
        });
        return res
            .status(200)
            .json({ message: "Chats loaded successfully", recentChats });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// get saved chats
router.get("/saved", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const chats = await Chat.find({
            $or: [
                {
                    $and: [{ uid1: userId }, { saved1: true }],
                },
                {
                    $and: [{ uid2: userId }, { saved2: true }],
                },
            ],
        })
            .populate("uid1", "fullName username profilePic")
            .populate("uid2", "fullName username profilePic")
            .sort({ latestMessage: -1 });
        // extract required data
        const savedChats = chats.map((chat) => {
            let name, unread, id, saved, username, profilePic;
            if (chat.uid1._id == userId) {
                name = chat.uid2.fullName;
                username = chat.uid2.username;
                profilePic = chat.uid2.profilePic;
                id = chat.uid2._id;
                unread = chat.unread1;
                saved = chat.saved1;
            } else if (chat.uid2._id == userId) {
                name = chat.uid1.fullName;
                username = chat.uid1.username;
                profilePic = chat.uid1.profilePic;
                id = chat.uid1._id;
                unread = chat.unread2;
                saved = chat.saved2;
            }
            return { name, unread, id, saved, username, profilePic };
        });
        return res
            .status(200)
            .json({ message: "Chats loaded successfully.", savedChats });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// edit saved chats
router.put("/save", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { id, save } = req.body;
        // save -> true or false
        // id -> _id of the user
        const chat = await Chat.findOne({
            $or: [
                {
                    $and: [{ uid1: userId }, { uid2: id }],
                },
                {
                    $and: [{ uid2: userId }, { uid1: id }],
                },
            ],
        });
        if (!chat) return res.status(404).json({ error: "Record not found" });
        console.log(chat);
        if (chat.uid1 == userId) {
            chat.saved1 = save;
        } else if (chat.uid2 == userId) {
            chat.saved2 = save;
        }
        await chat.save();
        let message = save ? "Contact saved." : "Contact removed.";
        return res.status(201).json({ message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// mark as read - all messages
router.put("/mark-as-read", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.body; // id -> _id of the chat
        const chat = await Chat.findById(id);
        if (chat.uid1 == userId) {
            chat.unread1 = 0;
        } else if (chat.uid2 == userId) {
            chat.unread2 = 0;
        }
        await chat.save();
        return res
            .status(201)
            .json({ message: "All messages marked as read." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// send the list of people
router.get("/discover-people", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const people = await User.find({ _id: { $ne: userId } }).select(
            "fullName username profilePic _id"
        );
        return res.status(200).json({ people });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// return existing or new chat
router.get("/open-chat/:_id", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { _id } = req.params;

        // find chat
        let chat = await Chat.findOne({
            $or: [
                { $and: [{ uid1: userId }, { uid2: _id }] },
                { $and: [{ uid2: userId }, { uid1: _id }] },
            ],
        });
        if (!chat) {
            // not found chat. create and return a new chat
            chat = new Chat({
                uid1: userId,
                uid2: _id,
            });
            await chat.save();
            return res.status(201).json({ chat });
        }
        // found a chat. return it
        return res.status(200).json({ chat });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
