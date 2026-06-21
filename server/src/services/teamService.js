const { db } = require("../config/database");

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

const getMembers = async (userId) => {
  const workspace = await getOrCreateWorkspace(userId);
  const [members] = await db.query(
    `SELECT wm.id, wm.role, wm.joined_at, u.name, u.email
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ?
     ORDER BY wm.joined_at ASC`,
    [workspace.id]
  );
  return { members, workspace };
};

const inviteMember = async (inviterId, email, role) => {
  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  if (users.length === 0) {
    const err = new Error(`User dengan email ${email} belum mendaftar dalam TaskFlow`);
    err.statusCode = 404;
    throw err;
  }

  const invitedUser = users[0];

  if (invitedUser.id === inviterId) {
    const err = new Error("Anda tidak boleh invite diri sendiri");
    err.statusCode = 400;
    throw err;
  }

  const workspace = await getOrCreateWorkspace(inviterId);

  const [existing] = await db.query(
    "SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
    [workspace.id, invitedUser.id]
  );
  if (existing.length > 0) {
    const err = new Error(`${invitedUser.name} sudah dalam team`);
    err.statusCode = 400;
    throw err;
  }

  const [result] = await db.query(
    "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
    [workspace.id, invitedUser.id, role]
  );

  const [[owner]] = await db.query("SELECT name FROM users WHERE id = ?", [inviterId]);
  const ownerName = owner?.name || "Someone";

  await db.query(
    "INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)",
    [
      invitedUser.id,
      "team_invite",
      "Jemputan Pasukan Baru!",
      `${ownerName} telah menjemput anda untuk menyertai workspace mereka sebagai ${role}.`,
      JSON.stringify({ workspace_id: workspace.id, workspace_name: workspace.name, owner_name: ownerName, role }),
    ]
  );

  return {
    id: result.insertId,
    name: invitedUser.name,
    email: invitedUser.email,
    role,
    joined_at: new Date().toISOString(),
  };
};

const updateMemberRole = async (memberId, workspaceId, role) => {
  await db.query(
    "UPDATE workspace_members SET role = ? WHERE id = ? AND workspace_id = ?",
    [role, memberId, workspaceId]
  );
};

const removeMember = async (memberId, workspaceId) => {
  await db.query(
    "DELETE FROM workspace_members WHERE id = ? AND workspace_id = ?",
    [memberId, workspaceId]
  );
};

module.exports = { getOrCreateWorkspace, getMembers, inviteMember, updateMemberRole, removeMember };
