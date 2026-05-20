const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { db } = require("../config/database");

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const [members] = await db.query(
      "SELECT * FROM team_members WHERE owner_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, data: members });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: "Nama dan email diperlukan" });
    const colors = ["bg-indigo-200 text-indigo-700", "bg-pink-200 text-pink-700", "bg-amber-200 text-amber-700", "bg-emerald-200 text-emerald-700", "bg-purple-200 text-purple-700"];
    const [existing] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE owner_id = ?", [req.user.id]);
    const color = colors[existing[0].count % colors.length];
    const [result] = await db.query(
      "INSERT INTO team_members (owner_id, name, email, role, color) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, name, email, role || "Member", color]
    );
    const [member] = await db.query("SELECT * FROM team_members WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: member[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM team_members WHERE id = ? AND owner_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;