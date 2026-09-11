const { db } = require("../config/database");
const { PLANS, isManualUpgradeEnabled, normalizePlan } = require("../config/plans");

const withUserLock = async (userId, fn) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getPlanForUser = async (userId, conn = db) => {
  const [[row]] = await conn.query("SELECT plan FROM users WHERE id = ?", [userId]);
  return normalizePlan(row?.plan);
};

const getSnapshot = async (userId, conn = db) => {
  const plan = await getPlanForUser(userId, conn);
  const config = PLANS[plan];

  const [[{ tasks }]] = await conn.query(
    "SELECT COUNT(*) AS tasks FROM tasks WHERE user_id = ?",
    [userId]
  );
  const [[{ projects }]] = await conn.query(
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

const planLimitError = (message, feature) => {
  const err = new Error(message);
  err.statusCode = 403;
  err.code = "PLAN_LIMIT";
  err.feature = feature;
  return err;
};

const assertCanCreateTask = async (userId, conn = db) => {
  const snapshot = await getSnapshot(userId, conn);
  if (snapshot.limits.maxTasks !== null && snapshot.usage.tasks >= snapshot.limits.maxTasks) {
    throw planLimitError(
      `Free plan allows up to ${snapshot.limits.maxTasks} tasks. Upgrade to Pro for unlimited tasks.`,
      "tasks"
    );
  }
};

const assertCanCreateProject = async (userId, conn = db) => {
  const snapshot = await getSnapshot(userId, conn);
  if (snapshot.limits.maxProjects !== null && snapshot.usage.projects >= snapshot.limits.maxProjects) {
    throw planLimitError(
      `Free plan allows up to ${snapshot.limits.maxProjects} projects. Upgrade to Pro for unlimited projects.`,
      "projects"
    );
  }
};

const setPlan = async (userId, plan) => {
  await db.query("UPDATE users SET plan = ? WHERE id = ?", [normalizePlan(plan), userId]);
  return getSnapshot(userId);
};

module.exports = {
  withUserLock,
  getPlanForUser,
  getSnapshot,
  assertCanCreateTask,
  assertCanCreateProject,
  setPlan,
};
