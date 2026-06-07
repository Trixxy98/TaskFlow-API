const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { db } = require("../config/database");

router.use(auth);

const handleRouteError = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

// Auto create workspace kalau belum ada
const getOrCreateWorkspace = async (userId) => {
  const [rows] = await db.query("SELECT * FROM workspaces WHERE owner_id = ?", [userId]);
  if (rows.length > 0) return rows[0];
  const [result] = await db.query(
    "INSERT INTO workspaces (owner_id, name) VALUES (?, ?)",
    [userId, "My Workspace"]
  );
  const [workspace] = await db.query("SELECT * FROM workspaces WHERE id = ?", [result.insertId]);
  return workspace[0];
};

// GET /api/team — get all members dalam workspace
router.get("/", async (req, res) => {
  try {
    const workspace = await getOrCreateWorkspace(req.user.id);
    const [members] = await db.query(
      `SELECT wm.id, wm.role, wm.joined_at, u.name, u.email
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = ?
       ORDER BY wm.joined_at ASC`,
      [workspace.id]
    );
    res.json({ success: true, data: members, workspace });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// POST /api/team/invite — invite by email
router.post("/invite", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email diperlukan" });

    // Check user wujud dalam sistem
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User dengan email ${email} belum mendaftar dalam TaskFlow`
      });
    }

    const invitedUser = users[0];

    // Check kalau owner invite diri sendiri
    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ success: false, message: "Anda tidak boleh invite diri sendiri" });
    }

    const workspace = await getOrCreateWorkspace(req.user.id);

    // Check kalau dah jadi member
    const [existing] = await db.query(
      "SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
      [workspace.id, invitedUser.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `${invitedUser.name} sudah dalam team` });
    }

    // Add member
    const [result] = await db.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
      [workspace.id, invitedUser.id, role || "member"]
    );

    // Create notification untuk invited user
    const [ownerRows] = await db.query("SELECT name FROM users WHERE id = ?", [req.user.id]);
    const ownerName = ownerRows[0]?.name || "Someone";

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        invitedUser.id,
        "team_invite",
        "Jemputan Pasukan Baru! 🎉",
        `${ownerName} telah menjemput anda untuk menyertai workspace mereka sebagai ${role || "member"}.`,
        JSON.stringify({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          owner_name: ownerName,
          role: role || "member",
        }),
      ]
    );

    res.status(201).json({
      success: true,
      message: `${invitedUser.name} berjaya dijemput!`,
      data: {
        id: result.insertId,
        name: invitedUser.name,
        email: invitedUser.email,
        role: role || "member",
        joined_at: new Date().toISOString(),
      }
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// PATCH /api/team/:id/role — update role
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const workspace = await getOrCreateWorkspace(req.user.id);
    await db.query(
      "UPDATE workspace_members SET role = ? WHERE id = ? AND workspace_id = ?",
      [role, req.params.id, workspace.id]
    );
    res.json({ success: true, message: "Role berjaya dikemaskini" });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// DELETE /api/team/:id — remove member
router.delete("/:id", async (req, res) => {
  try {
    const workspace = await getOrCreateWorkspace(req.user.id);
    await db.query(
      "DELETE FROM workspace_members WHERE id = ? AND workspace_id = ?",
      [req.params.id, workspace.id]
    );
    res.json({ success: true });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

module.exports = router;