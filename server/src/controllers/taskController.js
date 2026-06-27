const { db } = require("../config/database");
const { getIO } = require("../config/socket");

const sendServerError = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

const VALID_STATUS = ["pending", "completed"];

/** Get all user IDs that are part of a workspace (owner + accepted members). */
const getWorkspaceMemberIds = async (workspaceId) => {
  const [[workspace]] = await db.query("SELECT owner_id FROM workspaces WHERE id = ?", [workspaceId]);
  if (!workspace) return [];
  const [members] = await db.query(
    "SELECT user_id FROM workspace_members WHERE workspace_id = ? AND status = 'accepted'",
    [workspaceId]
  );
  return Array.from(new Set([workspace.owner_id, ...members.map((m) => m.user_id)]));
};

/** Broadcast a workspace task event to all members except the actor. */
const broadcastToWorkspace = async (workspaceId, actorId, event, payload) => {
  const io = getIO();
  if (!io) return;
  const memberIds = await getWorkspaceMemberIds(workspaceId);
  memberIds.forEach((uid) => {
    if (uid !== actorId) io.to(`user:${uid}`).emit(event, payload);
  });
};

/** Check if user is an accepted member of a workspace (owner OR invited member). */
const isWorkspaceMember = async (userId, workspaceId) => {
  const [[workspace]] = await db.query(
    "SELECT owner_id FROM workspaces WHERE id = ?",
    [workspaceId]
  );
  if (!workspace) return false;
  if (workspace.owner_id === userId) return true;

  const [[member]] = await db.query(
    "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND status = 'accepted'",
    [workspaceId, userId]
  );
  return Boolean(member);
};

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, scope } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let where, params, selectCols;

    if (scope === "workspace") {
      // Return tasks from all workspaces the user owns or is accepted in
      selectCols = "t.*, u.name AS created_by_name, w.name AS workspace_name";
      where = `
        WHERE t.workspace_id IS NOT NULL
          AND (
            w.owner_id = ?
            OR EXISTS (
              SELECT 1 FROM workspace_members wm
              WHERE wm.workspace_id = t.workspace_id
                AND wm.user_id = ?
                AND wm.status = 'accepted'
            )
          )
      `;
      params = [userId, userId];

      if (status && VALID_STATUS.includes(status)) {
        where += " AND t.status = ?";
        params.push(status);
      }

      const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total
         FROM tasks t
         JOIN workspaces w ON t.workspace_id = w.id
         ${where}`,
        params
      );

      const [tasks] = await db.query(
        `SELECT ${selectCols}
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         JOIN workspaces w ON t.workspace_id = w.id
         ${where}
         ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return res.json({
        success: true,
        data: tasks,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    // Default: personal tasks only
    where = "WHERE user_id = ? AND workspace_id IS NULL";
    params = [userId];
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
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date, priority, kanban_status, project, workspace_id } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title diperlukan" });
    }

    if (workspace_id) {
      const isMember = await isWorkspaceMember(userId, workspace_id);
      if (!isMember) {
        return res.status(403).json({ success: false, message: "Anda bukan ahli workspace ini" });
      }
    }

    const [result] = await db.query(
      "INSERT INTO tasks (user_id, workspace_id, title, description, due_date, priority, kanban_status, project) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        workspace_id || null,
        title,
        description || null,
        due_date || null,
        priority || "medium",
        kanban_status || "todo",
        project || null,
      ]
    );

    const [[newTask]] = await db.query(
      `SELECT t.*, u.name AS created_by_name
       FROM tasks t JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    if (workspace_id) {
      await broadcastToWorkspace(workspace_id, userId, "workspace_task_created", newTask);
    }

    res.status(201).json({ success: true, message: "Task berjaya dicipta", data: newTask });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, status, due_date, priority, kanban_status, project } = req.body;

    const [[task]] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    // For workspace tasks: verify membership. For personal tasks: verify ownership.
    if (task.workspace_id) {
      const isMember = await isWorkspaceMember(userId, task.workspace_id);
      if (!isMember) {
        return res.status(403).json({ success: false, message: "Anda bukan ahli workspace ini" });
      }
    } else if (task.user_id !== userId) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    await db.query(
      "UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, priority = ?, kanban_status = ?, project = ? WHERE id = ?",
      [
        title || task.title,
        description !== undefined ? description : task.description,
        status || task.status,
        due_date !== undefined ? due_date : task.due_date,
        priority || task.priority,
        kanban_status !== undefined ? kanban_status : task.kanban_status,
        project !== undefined ? project : task.project,
        taskId,
      ]
    );

    const [[updated]] = await db.query(
      `SELECT t.*, u.name AS created_by_name
       FROM tasks t JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (updated.workspace_id) {
      await broadcastToWorkspace(updated.workspace_id, userId, "workspace_task_updated", updated);
    }

    res.json({ success: true, message: "Task berjaya dikemaskini", data: updated });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const [[task]] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    if (task.workspace_id) {
      const isMember = await isWorkspaceMember(userId, task.workspace_id);
      if (!isMember) {
        return res.status(403).json({ success: false, message: "Anda bukan ahli workspace ini" });
      }
    } else if (task.user_id !== userId) {
      return res.status(404).json({ success: false, message: "Task tidak dijumpai" });
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [taskId]);

    if (task.workspace_id) {
      await broadcastToWorkspace(task.workspace_id, userId, "workspace_task_deleted", { id: Number(taskId) });
    }

    res.json({ success: true, message: "Task berjaya dipadam" });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
