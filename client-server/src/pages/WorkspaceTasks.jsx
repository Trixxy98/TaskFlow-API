import { useState, useEffect, useCallback } from "react";
import { getWorkspaceTasks, createTask, updateTask, deleteTask, getTeam } from "../services/api";
import { useSocketContext } from "../contexts/SocketContext";

const PRIORITY_CONFIG = {
  high:   { label: "Tinggi",  bg: "bg-red-100 dark:bg-red-900/30",    color: "text-red-600 dark:text-red-400"    },
  medium: { label: "Sedang",  bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-400" },
  low:    { label: "Rendah",  bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600 dark:text-green-400" },
};

const COLORS = [
  "bg-indigo-200 text-indigo-700",
  "bg-pink-200 text-pink-700",
  "bg-amber-200 text-amber-700",
  "bg-emerald-200 text-emerald-700",
  "bg-purple-200 text-purple-700",
];

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
};

const isOverdue = (dateStr) => dateStr && new Date(dateStr) < new Date().setHours(0, 0, 0, 0);

export default function WorkspaceTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium", workspace_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterWorkspace, setFilterWorkspace] = useState("all");

  async function fetchData() {
    setLoading(true);
    const [tasksRes, teamRes] = await Promise.all([getWorkspaceTasks(), getTeam()]);

    if (tasksRes.success) setTasks(tasksRes.data);

    if (teamRes.success) {
      // Build workspace list: own workspace + joined workspaces
      const ownWs = teamRes.workspace ? [{ id: teamRes.workspace.id, name: teamRes.workspace.name + " (Saya)" }] : [];
      const joinedWs = (teamRes.joinedWorkspaces || []).map((w) => ({
        id: w.workspace_id,
        name: `${w.workspace_name} (${w.owner_name})`,
      }));
      const all = [...ownWs, ...joinedWs];
      setWorkspaces(all);
      if (all.length > 0 && !form.workspace_id) {
        setForm((f) => ({ ...f, workspace_id: String(all[0].id) }));
      }
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  // Real-time sync: consume the shared socket from SocketProvider (App.jsx)
  const socket = useSocketContext();

  const handleRemoteCreate = useCallback((task) => {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
  }, []);

  const handleRemoteUpdate = useCallback((task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, []);

  const handleRemoteDelete = useCallback(({ id }) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("workspace_task_created", handleRemoteCreate);
    socket.on("workspace_task_updated", handleRemoteUpdate);
    socket.on("workspace_task_deleted", handleRemoteDelete);
    return () => {
      socket.off("workspace_task_created", handleRemoteCreate);
      socket.off("workspace_task_updated", handleRemoteUpdate);
      socket.off("workspace_task_deleted", handleRemoteDelete);
    };
  }, [socket, handleRemoteCreate, handleRemoteUpdate, handleRemoteDelete]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.workspace_id) return setError("Sila pilih workspace");
    setSaving(true);
    setError("");
    const res = await createTask({
      title: form.title,
      description: form.description || undefined,
      due_date: form.due_date || undefined,
      priority: form.priority,
      workspace_id: Number(form.workspace_id),
    });
    if (res.success) {
      setTasks((prev) => [res.data, ...prev]);
      setForm({ title: "", description: "", due_date: "", priority: "medium", workspace_id: form.workspace_id });
      setShowForm(false);
    } else {
      setError(res.message || "Gagal mencipta task");
    }
    setSaving(false);
  };

  const handleToggle = async (task) => {
    const status = task.status === "pending" ? "completed" : "pending";
    const res = await updateTask(task.id, { status });
    if (res.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Padam task "${title}"?`)) return;
    const res = await deleteTask(id);
    if (res.success) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = filterWorkspace === "all"
    ? tasks
    : tasks.filter((t) => String(t.workspace_id) === filterWorkspace);

  const pending = filtered.filter((t) => t.status === "pending");
  const completed = filtered.filter((t) => t.status === "completed");

  return (
    <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Workspace Tasks</h2>
          <p className="text-gray-400 text-sm mt-1">Tasks dikongsi bersama ahli workspace</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2 rounded-xl transition font-medium"
        >
          + Task
        </button>
      </div>

      {/* Workspace filter tabs */}
      {workspaces.length > 1 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setFilterWorkspace("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterWorkspace === "all"
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500"
            }`}
          >
            Semua
          </button>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setFilterWorkspace(String(ws.id))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filterWorkspace === String(ws.id)
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500"
              }`}
            >
              {ws.name}
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mt-5 space-y-3"
        >
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Task Baru</h3>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">⚠️ {error}</p>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Workspace</label>
            <select
              value={form.workspace_id}
              onChange={(e) => setForm({ ...form, workspace_id: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Tajuk *</label>
            <input
              type="text"
              placeholder="Nama task..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Penerangan</label>
            <textarea
              placeholder="Penerangan task (pilihan)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Tarikh Akhir</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Keutamaan</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
              >
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-5 py-2 rounded-full hover:bg-gray-700 transition font-medium disabled:opacity-50"
            >
              {saving ? "Mencipta..." : "Cipta Task"}
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

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-gray-400 text-sm mb-2">Tiada workspace tasks lagi</p>
          <p className="text-gray-300 dark:text-gray-600 text-xs">Cipta task dan assign ke workspace untuk dikongsi bersama ahli</p>
          {workspaces.length === 0 ? (
            <p className="text-xs text-amber-500 mt-3">Anda belum dalam mana-mana workspace. Pergi ke Team untuk join.</p>
          ) : (
            <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-500 text-sm hover:underline">
              Cipta task pertama
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Dalam Proses ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colorIdx={i}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Selesai ({completed.length})
              </p>
              <div className="space-y-2 opacity-60">
                {completed.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colorIdx={i}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, colorIdx, onToggle, onDelete }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const avatarColor = COLORS[colorIdx % COLORS.length];
  const overdue = task.status === "pending" && isOverdue(task.due_date);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-5 py-4 flex items-start gap-4 group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
          task.status === "completed"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
        }`}
      >
        {task.status === "completed" && <span className="text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Creator avatar */}
          {task.created_by_name && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avatarColor}`}>
              {task.created_by_name.charAt(0).toUpperCase()} {task.created_by_name.split(" ")[0]}
            </span>
          )}

          {/* Workspace name */}
          {task.workspace_name && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {task.workspace_name}
            </span>
          )}

          {/* Priority */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>

          {/* Due date */}
          {task.due_date && (
            <span className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {overdue ? "⚠️ " : "📅 "}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id, task.title)}
        className="text-gray-200 dark:text-gray-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm mt-0.5 flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
