const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { chat } = require("../services/aiService");

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, message: "Too many requests. Please try again later." },
});

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI chatbot endpoints (powered by Google Gemini)
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to TaskFlow AI assistant
 *     tags: [AI]
 *     description: |
 *       Natural language interface for task management. The AI can:
 *       - List tasks (`tunjuk semua task aku`)
 *       - Create tasks (`tambah task meeting esok priority high`)
 *       - Update tasks (`tandakan task X sebagai selesai`)
 *       - Delete tasks (`padam task beli barang`)
 *       - List projects (`tunjuk semua project`)
 *
 *       Rate limited to **15 requests per minute** per user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: tambah task hantar laporan esok priority high
 *               history:
 *                 type: array
 *                 description: Previous conversation turns for context
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     parts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text: { type: string }
 *                 example: []
 *     responses:
 *       200:
 *         description: AI response with optional executed actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 reply:
 *                   type: string
 *                   example: Tugasan "hantar laporan" telah berjaya ditambahkan untuk esok.
 *                 actions:
 *                   type: array
 *                   description: List of tool calls executed by the AI
 *                   items:
 *                     type: object
 *                     properties:
 *                       tool: { type: string, example: create_task }
 *                       args: { type: object }
 *                       result: { type: object }
 *       400:
 *         description: Message is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/chat", aiLimiter, async (req, res, next) => {
    try {
        const { message, history = [] } = req.body;
        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }
        const { reply, actions } = await chat(req.user.id, req.user.name, message, history);
        res.json({ success: true, reply, actions });
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
