import { useState, useEffect } from "react";
import { getTeam, inviteMember, removeMember, updateMemberRole } from "../services/api";

const ROLE_CONFIG = {
  admin:  { label: "Admin",  bg: "bg-purple-50 dark:bg-purple-900/20",  color: "text-purple-600" },
  member: { label: "Member", bg: "bg-blue-50 dark:bg-blue-900/20",      color: "text-blue-600"   },
  viewer: { label: "Viewer", bg: "bg-gray-100 dark:bg-gray-800",        color: "text-gray-500"   },
};

const COLORS = [
  "bg-indigo-200 text-indigo-700",
  "bg-pink-200 text-pink-700",
  "bg-amber-200 text-amber-700",
  "bg-emerald-200 text-emerald-700",
  "bg-purple-200 text-purple-700",
];

export default function Team({ teamMembers, setTeamMembers }) {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", role: "member" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const res = await getTeam();
    if (res.success) {
      setTeamMembers(res.data);
      setWorkspace(res.workspace);
    }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await inviteMember(form);

    if (res.success) {
      setTeamMembers([...teamMembers, { ...res.data, color: COLORS[teamMembers.length % COLORS.length] }]);
      setSuccess(res.message);
      setForm({ email: "", role: "member" });
      setShowForm(false);
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Buang ${name} daripada team?`)) return;
    const res = await removeMember(id);
    if (res.success) setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  const handleRoleChange = async (id, role) => {
    const res = await updateMemberRole(id, role);
    if (res.success) setTeamMembers(teamMembers.map((m) => m.id === id ? { ...m, role } : m));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Team</h2>
          {workspace && (
            <p className="text-gray-400 text-sm mt-1">{workspace.name} • {teamMembers.length} ahli</p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
          className="bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2 rounded-xl transition font-medium"
        >
          + Invite
        </button>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 px-4 py-3 rounded-xl text-sm mb-4 mt-4">
          ✅ {success}
        </div>
      )}

      {/* Invite Form */}
      {showForm && (
        <form onSubmit={handleInvite} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-6 mt-4 space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Invite Ahli Baru</h3>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 px-3 py-2 rounded-xl text-xs">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">* User mesti dah register dalam TaskFlow</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="admin">Admin — boleh edit semua</option>
              <option value="member">Member — boleh edit task sendiri</option>
              <option value="viewer">Viewer — tengok sahaja</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-5 py-2 rounded-full hover:bg-gray-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Checking..." : "Invite"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs px-5 py-2 rounded-full hover:border-gray-400 transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-400 text-sm mb-2">Belum ada ahli pasukan</p>
          <p className="text-gray-300 dark:text-gray-600 text-xs">Invite rakan yang dah register dalam TaskFlow</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-indigo-500 text-sm hover:underline"
          >
            Invite ahli pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {teamMembers.map((member, i) => {
            const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const color = COLORS[i % COLORS.length];
            return (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-5 py-4 flex items-center gap-4 group"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <span className="text-sm font-bold">{member.name.charAt(0).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                  {member.joined_at && (
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                      Joined {formatDate(member.joined_at)}
                    </p>
                  )}
                </div>

                {/* Role dropdown */}
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-lg border-0 outline-none cursor-pointer font-medium ${role.bg} ${role.color}`}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(member.id, member.name)}
                  className="text-gray-200 dark:text-gray-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">ℹ️ Cara invite ahli</p>
        <p className="text-xs text-blue-500 dark:text-blue-500 leading-relaxed">
          Ahli yang nak dijemput perlu daftar akaun TaskFlow dahulu. Lepas tu masukkan email mereka untuk tambah ke dalam team anda.
        </p>
      </div>
    </div>
  );
} 