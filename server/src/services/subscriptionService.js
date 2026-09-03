const { db } = require("../config/database");
const { PLANS, isManualUpgradeEnabled, normalizePlan } = require("../config/plans");

const getPlanForUser = async (userId) => {
  const [[row]] = await db.query("SELECT plan FROM users WHERE id = ?", [userId]);
  return normalizePlan(row?.plan);
};

const getSnapshot = async (userId) => {
  const plan = await getPlanForUser(userId);
  const config = PLANS[plan];

  const [[{ tasks }]] = await db.query(
    "SELECT COUNT(*) AS tasks FROM tasks WHERE user_id = ?",
    [userId]
  );
  const [[{ projects }]] = await db.query(
    "SELECT COUNT(*) AS projects FROM projects WHERE user_id = ?",
    [userId]
  );

  return {
    plan,
    planName: config.name,
    limits: {
      maxTasks: config.maxTasks,
      maxProjects: config.maxProjects,
    },
    usage: { tasks, projects },
    features: config.features,
    manualUpgrade: isManualUpgradeEnabled(),
  };
};

const assertCanCreateTask = async (userId) => {
  const snapshot = await getSnapshot(userId);
  if (snapshot.limits.maxTasks !== null && snapshot.usage.tasks >= snapshot.limits.maxTasks) {
    const err = new Error(
      `Free plan allows up to ${snapshot.limits.maxTasks} tasks. Upgrade to Pro for unlimited tasks.`
    );
    err.statusCode = 403;
    err.code = "PLAN_LIMIT";
    err.feature = "tasks";
    throw err;
  }
};

const assertCanCreateProject = async (userId) => {
  const snapshot = await getSnapshot(userId);
  if (snapshot.limits.maxProjects !== null && snapshot.usage.projects >= snapshot.limits.maxProjects) {
    const err = new Error(
      `Free plan allows up to ${snapshot.limits.maxProjects} projects. Upgrade to Pro for unlimited projects.`
    );
    err.statusCode = 403;
    err.code = "PLAN_LIMIT";
    err.feature = "projects";
    throw err;
  }
};

const setPlan = async (userId, plan) => {
  await db.query("UPDATE users SET plan = ? WHERE id = ?", [normalizePlan(plan), userId]);
  return getSnapshot(userId);
};

module.exports = {
  getPlanForUser,
  getSnapshot,
  assertCanCreateTask,
  assertCanCreateProject,
  setPlan,
};
