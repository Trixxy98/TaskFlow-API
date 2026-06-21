const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { db } = require("../config/database");
const validate = require("../middleware/validate");
const feedbackValidators = require("../validators/feedback.validators");

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const [feedbacks] = await db.query(
      `SELECT f.*, t.title as task_title, u.name as author_name 
       FROM feedback f 
       JOIN tasks t ON f.task_id = t.id 
       JOIN users u ON f.user_id = u.id 
       WHERE f.user_id = ? 
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: feedbacks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", validate(feedbackValidators.createFeedback), async (req, res) => {
  try {
    const { task_id, message } = req.body;
    if (!task_id || !message) return res.status(400).json({ success: false, message: "task_id dan message diperlukan" });
    const [result] = await db.query(
      "INSERT INTO feedback (task_id, user_id, message) VALUES (?, ?, ?)",
      [task_id, req.user.id, message]
    );
    const [fb] = await db.query(
      `SELECT f.*, t.title as task_title, u.name as author_name 
       FROM feedback f 
       JOIN tasks t ON f.task_id = t.id 
       JOIN users u ON f.user_id = u.id 
       WHERE f.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: fb[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM feedback WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;