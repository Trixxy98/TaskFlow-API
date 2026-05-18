const { db } = require("../config/database");

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    let query = "SELECT * FROM tasks WHERE user_id = ?";
    let params = [userId];
    if (status && ["pending", "completed"].includes(status)) {
      query += " AND status = ?";
      params.push(status);
    }
    query += " ORDER BY created_at DESC";
    const [tasks] = await db.query(query, params);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date } = req.body;
    if (!title)
      return res.status(400).json({ success: false, message: "Title diperlukan" });

    const [result] = await db.query(
      "INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)",
      [userId, title, description || null, due_date || null]
    );
    const [newTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Task berjaya dicipta", data: newTask[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, status, due_date } = req.body;
    const [existing] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });

    await db.query(
      "UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ?",
      [title || existing[0].title, description !== undefined ? description : existing[0].description, status || existing[0].status, due_date !== undefined ? due_date : existing[0].due_date, taskId]
    );
    const [updatedTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    res.json({ success: true, message: "Task berjaya dikemaskini", data: updatedTask[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const [existing] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });

    await db.query("DELETE FROM tasks WHERE id = ?", [taskId]);
    res.json({ success: true, message: "Task berjaya dipadam" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };