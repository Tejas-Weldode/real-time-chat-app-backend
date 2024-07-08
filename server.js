import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import messageRoutes from "./routes/message.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { app, server } from "./socket/socket.js";
const port = 3000;

// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '16mb' }));
app.use(cors());

// db connection
try {
    mongoose.connect("mongodb://127.0.0.1:27017/test");
} catch (error) {
    console.error(error);
}

// routes
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/user", userRoutes);
app.use("/message", messageRoutes);
app.use("/chat", chatRoutes);

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
