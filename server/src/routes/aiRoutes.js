const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {chat} = require("../services/aiService");

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: {success: false, message: "Too many requests. Please try again later."},
});

router.use(auth);

router.post("/chat", aiLimiter, async (req, res, next) => {
    try {
        const {message, history = []} = req.body;
        if (!message?.trim()) {
            return res.status(400).json({success: false, message: "Message is required"});
        }
        const {reply, actions} = await chat(req.user.id, req.user.name, message, history);
        res.json({success: true, reply, actions});
    } catch (err) {
        if (err.status === 429) {
            return res.status(429).json({
                success: false,
                message: "AI service is currently busy. Please wait a moment and try again.",
            });
        }
        next(err);
    }
});

module.exports = router;