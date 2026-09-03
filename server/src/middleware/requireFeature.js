const { PLANS } = require("../config/plans");
const { getPlanForUser } = require("../services/subscriptionService");

const requireFeature = (feature) => async (req, res, next) => {
  try {
    const plan = await getPlanForUser(req.user.id);
    if (PLANS[plan].features[feature]) return next();

    return res.status(403).json({
      success: false,
      code: "UPGRADE_REQUIRED",
      feature,
      message: "This feature is available on the Pro plan.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = requireFeature;
