const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { db } = require("../config/database");

router.use(auth);

const handleRouteError = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

// GET — semua notifications untuk user
router.get("/", async (req, res) => {
  try {
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// PATCH — mark as read
router.patch("/:id/read", async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// PATCH — mark all as read
router.patch("/read-all", async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// DELETE — clear notification
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

module.exports = router;