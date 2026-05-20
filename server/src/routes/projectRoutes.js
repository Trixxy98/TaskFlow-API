const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { db } = require("../config/database");

router.use(auth);

// GET all projects
router.get("/", async (req, res) => {
  try {
    const [projects] = await db.query(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, data: projects });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create project
router.post("/", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Nama diperlukan" });
    const [result] = await db.query(
      "INSERT INTO projects (user_id, name, color) VALUES (?, ?, ?)",
      [req.user.id, name, color || "#6366f1"]
    );
    const [project] = await db.query("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: project[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    await db.query("UPDATE tasks SET project = NULL WHERE project = (SELECT name FROM projects WHERE id = ?)", [req.params.id]);
    await db.query("DELETE FROM projects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;