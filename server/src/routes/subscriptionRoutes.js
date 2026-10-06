const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { isManualUpgradeEnabled } = require("../config/plans");
const { getSnapshot, setPlan } = require("../services/subscriptionService");
const {
  createCheckoutSession,
  createPortalSession,
} = require("../services/stripeService");
const { db } = require("../config/database");

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Plan snapshot, Stripe checkout, and demo activate
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
 * /api/subscription/checkout:
 *   post:
 *     summary: Create a Stripe Checkout session for Pro
 *     tags: [Subscription]
 */
router.post("/checkout", async (req, res, next) => {
  try {
    const [[user]] = await db.query(
      "SELECT id, email, name FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const data = await createCheckoutSession(user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/subscription/portal:
 *   post:
 *     summary: Open Stripe Customer Portal (manage / cancel)
 *     tags: [Subscription]
 */
router.post("/portal", async (req, res, next) => {
  try {
    const data = await createPortalSession(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/activate", async (req, res, next) => {
  try {
    if (!isManualUpgradeEnabled()) {
      return res.status(403).json({
        success: false,
        code: "STRIPE_PENDING",
        message: "Paid checkout is not enabled yet. Use Upgrade on the Plans page.",
      });
    }

    const data = await setPlan(req.user.id, "pro");
    res.json({ success: true, message: "You are now on the Pro plan.", data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;