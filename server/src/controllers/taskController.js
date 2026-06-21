const { db } = require("../config/database");

const sendServerError = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

const VALID_STATUS = ["pending", "completed"];

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let where = "WHERE user_id = ?";
    let params = [userId];
    if (status && VALID_STATUS.includes(status)) {
      where += " AND status = ?";
      params.push(status);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM tasks ${where}`,
      params
    );

    const [tasks] = await db.query(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date, priority, kanban_status, project } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title diperlukan" });
    }

    const [result] = await db.query(
      "INSERT INTO tasks (user_id, title, description, due_date, priority, kanban_status, project) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, title, description || null, due_date || null, priority || "medium", kanban_status || "todo", project || null]
    );
    const [newTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Task berjaya dicipta", data: newTask[0] });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, status, due_date, priority, kanban_status, project } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    const current = rows[0];

    await db.query(
      "UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, priority = ?, kanban_status = ?, project = ? WHERE id = ?",
      [
        title || current.title,
        description !== undefined ? description : current.description,
        status || current.status,
        due_date !== undefined ? due_date : current.due_date,
        priority || current.priority,
        kanban_status !== undefined ? kanban_status : current.kanban_status,
        project !== undefined ? project : current.project,
        taskId,
      ]
    );

    const [updated] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);

    res.json({ success: true, message: "Task berjaya dikemaskini", data: updated[0] });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const [existing] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [taskId]);
    res.json({ success: true, message: "Task berjaya dipadam" });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };