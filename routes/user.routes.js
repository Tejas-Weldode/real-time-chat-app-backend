import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import User from "../models/user.model.js";
import Token from "../models/token.model.js";
import Otp from "../models/otp.model.js";
import { v4 as uuidv4 } from "uuid";
import sendEmail from "../utils/sendEmail.js";
import auth from "../middlewares/auth.js";

const sendVerificationLink = async (userId, email) => {
    // --- handling verification link gerneration
    await Token.findOneAndDelete({ userId }); // delete is any token exists
    const token = new Token({ userId, token: uuidv4() });
    await token.save();
    const url = `${process.env.BASE_URL}/user/${userId}/verify/${token.token}`;
    await sendEmail(email, "Verify Your Email", url);
    // ---
};

const getUserData = async (id) => {
    const user = await User.findById(id);
    // generate token
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET);
    // return
    return {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        profilePic: user.profilePic,
        bio: user.bio,
        token,
    };
};

const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
    try {
        const { email, username, password, profilePic, fullName, bio } =
            req.body;
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            username,
            password: hashedPassword,
            profilePic,
            fullName,
            bio,
        });
        await newUser.save();

        // --- handling verification link gerneration
        await sendVerificationLink(newUser._id, newUser.email);
        // ---

        res.status(201).json({ message: "Verify Email address" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Internal Server Error" });
    }
});

// route to handle verification link
router.get("/:id/verify/:token", async (req, res) => {
    try {
        // --- validate
        const { id, token } = req.params;
        const testUser = await User.findById(id);
        const testToken = await Token.findOne({ token: token });
        if (!testUser || !testToken)
            return res.status(404).json({ error: "Page not found" });
        // ---

        // --- set isEmailVerified to true
        await User.findByIdAndUpdate(testUser._id, { isEmailVerified: true });
        // --- delete token from Token
        await Token.findByIdAndDelete(testToken._id);
        // ---

        return res.status(200).json({ message: "Email successfully verified" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    try {
        // check username
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }
        // send response
        const userData = await getUserData(user._id);
        res.status(200).json({
            message: "Logged in successfully",
            userData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update route
router.put("/update", auth, async (req, res) => {
    try {
        const {
            email,
            username,
            oldPassword,
            newPassword,
            profilePic,
            fullName,
            bio,
        } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        // if user exists, update
        if (username) user.username = username;
        if (newPassword && oldPassword) {
            const isPasswordValid = await bcrypt.compare(
                oldPassword,
                user.password
            );
            if (!isPasswordValid)
                return res
                    .status(400)
                    .json({ error: "Your current password is incorrect" });
            user.password = await bcrypt.hash(newPassword, 10);
        }
        if (profilePic) user.profilePic = profilePic;
        if (fullName) user.fullName = fullName;
        if (bio) user.bio = bio;
        if (email) {
            user.email = email;
            user.isEmailVerified = false;
            await sendVerificationLink(user._id, user.email);
        }
        await user.save();

        // send response
        const userData = await getUserData(user._id);
        res.status(200).json({ userData, message: "Updated Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Erorr" });
    }
});

// Check username availablity
router.post("/check-username-availability", async (req, res) => {
    try {
        const { username } = req.body;
        const test = await User.findOne({ username });
        if (test) {
            return res.status(200).json({
                available: false,
                message: "This username is already taken",
            });
        }
        return res
            .status(200)
            .json({ available: true, message: "This username is available" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const testUser = await User.findOne({ email });
        if (!testUser) {
            // if test is null
            return res.status(404).json({ error: "Record not found" });
        }
        // check whether the otp exist in the otp table.
        let testOtp = await Otp.findOne({ userId: testUser._id });
        if (testOtp) {
            return res.status(400).json({
                error: "The OTP has already been sent to you email address.",
            });
        }
        // generate otp.
        let unique = false;
        let otp = otpGenerator.generate(6);
        while (!unique) {
            testOtp = await Otp.findOne({ otp });
            if (testOtp) {
                // if otp already exists in the table
                otp = otpGenerator.generate(6);
            } else {
                // if otp is not present in the table
                unique = true;
            }
        }
        // save the otp with corresponding email in te otp table.
        const newRecord = new Otp( {
            otp,
            userId: testUser._id,
        });
        await newRecord.save();
        // send the otp to the user via email.
        const emailBody = `Your OTP for setting a new password is: ${newRecord.otp}. This OTP is valid only for 1 hour.`;
        const emailSubject = "OTP for setting a new password.";
        await sendEmail(testUser.email, emailSubject, emailBody);
        // send res
        return res
            .status(201)
            .json({ message: "OTP has been sent to your email." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create new password
router.put("/set-new-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email) {
            return res.status(404).json({ error: "Looks like you refreshed the page. Try again after an hour." });
        }
        const user = await User.findOne({ email });
        const otpRecord = await Otp.findOne({ otp, userId: user._id });
        if (!otpRecord) {
            return res.status(404).json({ error: "Invalid OTP" });
        }
        // set new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.save();
        // send res
        return res
            .status(201)
            .json({ message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server Erorr" });
    }
});

export default router;
