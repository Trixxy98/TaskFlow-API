const { db } = require("../config/database");
const { createNotification } = require("./notificationService");

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

  // People I invited who accepted
  const [members] = await db.query(
    `SELECT wm.id, wm.role, wm.joined_at, wm.status, u.name, u.email
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ? AND wm.status = 'accepted'
     ORDER BY wm.joined_at ASC`,
    [workspace.id]
  );

  // Pending outgoing invites (I sent, waiting for response)
  const [pendingInvites] = await db.query(
    `SELECT wm.id, wm.role, wm.joined_at, wm.status, u.name, u.email
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ? AND wm.status = 'pending'
     ORDER BY wm.joined_at ASC`,
    [workspace.id]
  );

  // Workspaces I've been accepted into (bidirectional — show the inviter's workspace)
  const [joinedWorkspaces] = await db.query(
    `SELECT wm.id AS member_id, wm.role AS my_role,
            w.id AS workspace_id, w.name AS workspace_name,
            u.id AS owner_id, u.name AS owner_name, u.email AS owner_email
     FROM workspace_members wm
     JOIN workspaces w ON wm.workspace_id = w.id
     JOIN users u ON w.owner_id = u.id
     WHERE wm.user_id = ? AND wm.status = 'accepted'`,
    [userId]
  );

  return { members, pendingInvites, joinedWorkspaces, workspace };
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
    "INSERT INTO workspace_members (workspace_id, user_id, role, status) VALUES (?, ?, ?, 'pending')",
    [workspace.id, invitedUser.id, role]
  );

  const memberId = result.insertId;
  const [[owner]] = await db.query("SELECT name FROM users WHERE id = ?", [inviterId]);
  const ownerName = owner?.name || "Someone";

  await createNotification(
    invitedUser.id,
    "team_invite",
    "Jemputan Pasukan Baru!",
    `${ownerName} telah menjemput anda untuk menyertai workspace mereka sebagai ${role}.`,
    { member_id: memberId, workspace_id: workspace.id, workspace_name: workspace.name, owner_name: ownerName, role }
  );

  return {
    id: memberId,
    name: invitedUser.name,
    email: invitedUser.email,
    role,
    status: "pending",
    joined_at: new Date().toISOString(),
  };
};

const respondToInvite = async (userId, memberId, action) => {
  const [[invite]] = await db.query(
    "SELECT * FROM workspace_members WHERE id = ? AND user_id = ?",
    [memberId, userId]
  );
  if (!invite) {
    const err = new Error("Jemputan tidak dijumpai");
    err.statusCode = 404;
    throw err;
  }
  if (invite.status === "accepted") {
    const err = new Error("Jemputan sudah diterima sebelum ini");
    err.statusCode = 400;
    throw err;
  }

  if (action === "accept") {
    await db.query(
      "UPDATE workspace_members SET status = 'accepted', joined_at = NOW() WHERE id = ?",
      [memberId]
    );
    // Notify the workspace owner that invite was accepted
    const [[workspace]] = await db.query("SELECT * FROM workspaces WHERE id = ?", [invite.workspace_id]);
    const [[acceptedUser]] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
    if (workspace && acceptedUser) {
      await createNotification(
        workspace.owner_id,
        "team_invite_accepted",
        "Jemputan Diterima!",
        `${acceptedUser.name} telah menerima jemputan anda dan kini menyertai workspace anda.`,
        { user_id: userId, workspace_id: workspace.id }
      );
    }
  } else {
    await db.query("DELETE FROM workspace_members WHERE id = ?", [memberId]);
  }
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

module.exports = { getOrCreateWorkspace, getMembers, inviteMember, respondToInvite, updateMemberRole, removeMember };
