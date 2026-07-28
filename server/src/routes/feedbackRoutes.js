const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const feedbackValidators = require("../validators/feedback.validators");
const feedbackService = require("../services/feedbackService");

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Task feedback endpoints
 */

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedback for authenticated user
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: List of feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 */
router.get("/", async (req, res, next) => {
  try {
    const data = await feedbackService.getFeedbackByUser(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Create feedback for a task
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_id, message]
 *             properties:
 *               task_id:
 *                 type: integer
 *                 example: 1
 *               message:
 *                 type: string
 *                 example: This task needs more detail
 *     responses:
 *       201:
 *         description: Feedback created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 */
router.post("/", validate(feedbackValidators.createFeedback), async (req, res, next) => {
  try {
    const { task_id, message } = req.body;
    const data = await feedbackService.createFeedback(req.user.id, task_id, message);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Delete a feedback entry
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", async (req, res, next) => {
  try {
    await feedbackService.deleteFeedback(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
