const { db } = require("../config/database");
const { createNotification } = require("./notificationService");

const INTERVAL_MS = 15 * 60 * 1000;

const toDateKey = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
};

const notifyTasks = async (tasks, type, title, buildMessage) => {
  for (const task of tasks) {
    const dueDate = toDateKey(task.due_date);
    await createNotification(
      task.user_id,
      type,
      title,
      buildMessage(task),
      { taskId: task.id, dueDate },
      `${type}:${task.id}:${dueDate}`
    );
  }
};

const runDueDateNotifications = async () => {
  const [overdue] = await db.query(`
    SELECT t.id, t.user_id, t.title, t.due_date,
           DATEDIFF(CURDATE(), t.due_date) AS days_overdue
    FROM tasks t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.status = 'pending'
      AND t.due_date IS NOT NULL
      AND t.due_date < CURDATE()
      AND u.notify_overdue = 1
  `);
  await notifyTasks(overdue, "task_overdue", "Task Overdue!", (task) => {
    const days = Number(task.days_overdue) || 1;
    const when = days === 1 ? "1 day ago" : `${days} days ago`;
    return `"${task.title}" passed its deadline ${when}`;
  });

  const [dueToday] = await db.query(`
    SELECT t.id, t.user_id, t.title, t.due_date
    FROM tasks t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.status = 'pending'
      AND t.due_date IS NOT NULL
      AND t.due_date = CURDATE()
      AND u.notify_due_today = 1
  `);
  await notifyTasks(
    dueToday,
    "task_due_today",
    "Due Today!",
    (task) => `"${task.title}" needs to be completed today`
  );

  const [dueTomorrow] = await db.query(`
    SELECT t.id, t.user_id, t.title, t.due_date
    FROM tasks t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.status = 'pending'
      AND t.due_date IS NOT NULL
      AND t.due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND u.notify_due_tomorrow = 1
  `);
  await notifyTasks(
    dueTomorrow,
    "task_due_tomorrow",
    "Due Tomorrow",
    (task) => `"${task.title}" needs to be completed tomorrow`
  );
};

const startDueDateNotificationJob = () => {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runDueDateNotifications();
    } catch (err) {
      console.error("Due-date notification job failed:", err.message);
    } finally {
      running = false;
    }
  };

  tick();
  setInterval(tick, INTERVAL_MS);
};

module.exports = { startDueDateNotificationJob, runDueDateNotifications };