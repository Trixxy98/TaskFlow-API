const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { isManualUpgradeEnabled } = require("../config/plans");
const { getSnapshot, setPlan } = require("../services/subscriptionService");

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Plan and feature-gate endpoints (Stripe checkout comes later)
 */

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     summary: Get the current user's plan, limits, and feature flags
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Current subscription snapshot
 */
router.get("/", async (req, res, next) => {
  try {
    const data = await getSnapshot(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/subscription/activate:
 *   post:
 *     summary: Manually activate Pro (dev / demo only until Stripe is wired)
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Plan updated to Pro
 *       403:
 *         description: Manual upgrade disabled
 */
router.post("/activate", async (req, res, next) => {
  try {
    if (!isManualUpgradeEnabled()) {
      return res.status(403).json({
        success: false,
        code: "STRIPE_PENDING",
        message: "Paid checkout is not enabled yet. Stripe will be added next.",
      });
    }

    const data = await setPlan(req.user.id, "pro");
    res.json({ success: true, message: "You are now on the Pro plan.", data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
