const { db } = require("../config/database");

const getFeedbackByUser = async (userId) => {
  const [feedbacks] = await db.query(
    `SELECT f.*, t.title AS task_title, u.name AS author_name
     FROM feedback f
     JOIN tasks t ON f.task_id = t.id
     JOIN users u ON f.user_id = u.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return feedbacks;
};

const createFeedback = async (userId, taskId, message) => {
  const [result] = await db.query(
    "INSERT INTO feedback (task_id, user_id, message) VALUES (?, ?, ?)",
    [taskId, userId, message]
  );
  const [[feedback]] = await db.query(
    `SELECT f.*, t.title AS task_title, u.name AS author_name
     FROM feedback f
     JOIN tasks t ON f.task_id = t.id
     JOIN users u ON f.user_id = u.id
     WHERE f.id = ?`,
    [result.insertId]
  );
  return feedback;
};

const deleteFeedback = async (feedbackId, userId) => {
  await db.query("DELETE FROM feedback WHERE id = ? AND user_id = ?", [feedbackId, userId]);
};

module.exports = { getFeedbackByUser, createFeedback, deleteFeedback };
