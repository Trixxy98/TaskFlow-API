const PLANS = {
  free: {
    name: "Free",
    maxTasks: 20,
    maxProjects: 3,
    features: {
      ai: false,
      attachments: false,
      analytics: false,
      calendar: false,
      notes: false,
    },
  },
  pro: {
    name: "Pro",
    maxTasks: null,
    maxProjects: null,
    features: {
      ai: true,
      attachments: true,
      analytics: true,
      calendar: true,
      notes: true,
    },
  },
};

const isManualUpgradeEnabled = () => {
  if (process.env.ALLOW_MANUAL_UPGRADE === "true") return true;
  if (process.env.ALLOW_MANUAL_UPGRADE === "false") return false;
  return process.env.NODE_ENV !== "production";
};

const normalizePlan = (plan) => (plan === "pro" ? "pro" : "free");

module.exports = { PLANS, isManualUpgradeEnabled, normalizePlan };
