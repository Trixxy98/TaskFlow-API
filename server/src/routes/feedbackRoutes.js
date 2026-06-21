const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const feedbackValidators = require("../validators/feedback.validators");
const feedbackService = require("../services/feedbackService");

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const data = await feedbackService.getFeedbackByUser(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(feedbackValidators.createFeedback), async (req, res, next) => {
  try {
    const { task_id, message } = req.body;
    const data = await feedbackService.createFeedback(req.user.id, task_id, message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await feedbackService.deleteFeedback(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
