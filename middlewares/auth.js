import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        const test = await User.findById(req.userId);
        if (!test) {
            return res.status(404).json({ error: "Unauthorized" });
        }
        next();
    } catch (error) {
        // console.error(error)
        return res.status(401).json({ error: "Invalid token" });
    }
};

export default authMiddleware;
