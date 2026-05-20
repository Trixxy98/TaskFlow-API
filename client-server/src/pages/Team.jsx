import { useState, useEffect } from "react";
import { getTeam, inviteMember, removeMember } from "../services/api";

export default function Team({ teamMembers, setTeamMembers, tasks }) {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Member" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const res = await getTeam();
    if (res.success) setTeamMembers(res.data);
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await inviteMember(form);
    if (res.success) {
      setTeamMembers([...teamMembers, res.data]);
      setForm({ name: "", email: "", role: "Member" });
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleRemove = async (id) => {
    const res = await removeMember(id);
    if (res.success) setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Team</h2>
          <p className="text-gray-400 text-sm mt-1">{teamMembers.length} ahli pasukan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition font-medium">
          + Invite
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleInvite} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Invite Ahli Baru</h3>
          <input type="text" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400" required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400" required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
            <option>Member</option>
            <option>Admin</option>
            <option>Viewer</option>
          </select>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="bg-gray-900 text-white text-xs px-5 py-2 rounded-full hover:bg-gray-700 transition font-medium disabled:opacity-50">
              {saving ? "Loading..." : "Invite"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-500 text-xs px-5 py-2 rounded-full hover:border-gray-400 transition">
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
      ) : teamMembers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-400 text-sm">Belum ada ahli pasukan</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-500 text-sm hover:underline">Invite ahli pertama</button>
        </div>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.color}`}>
                <span className="text-sm font-bold">{member.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{member.role}</span>
              <button onClick={() => handleRemove(member.id)} className="text-gray-200 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}