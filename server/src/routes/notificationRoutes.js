const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const notificationService = require("../services/notificationService");

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await notificationService.getNotifications(req.user.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
