const { db } = require("../config/database");

const getNotifications = async (userId, page, limit) => {
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?",
    [userId]
  );

  const [notifications] = await db.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [userId, limit, offset]
  );

  const unreadCount = await getUnreadCount(userId);

  return {
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUnreadCount = async (userId) => {
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE",
    [userId]
  );
  return count;
};

const markAsRead = async (notificationId, userId) => {
  await db.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await db.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);
};

const deleteNotification = async (notificationId, userId) => {
  await db.query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
