import { useState, useEffect, useRef } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../services/api";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200"   },
  medium: { label: "Medium", color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200" },
  low:    { label: "Low",    color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
};

export default function Dashboard({ user, onLogout, tasks, setTasks }) {
  const [filter, setFilter] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const editRef = useRef(null);

  useEffect(() => { setLoading(false); }, [tasks]);
  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await getTasks();
    if (res.success) setTasks(res.data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await createTask({ title: newTask, due_date: newDueDate || null, priority: newPriority });
    if (res.success) {
      setTasks([res.data, ...tasks]);
      setNewTask("");
      setNewDueDate("");
      setNewPriority("medium");
    }
  };

  const handleToggle = async (task) => {
    const status = task.status === "pending" ? "completed" : "pending";
    const res = await updateTask(task.id, { status });
    if (res.success) setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
  };

  const handleDelete = async (id) => {
    const res = await deleteTask(id);
    if (res.success) setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    setEditingPriority(task.priority || "medium");
  };

  const handleEditSave = async (task) => {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    const res = await updateTask(task.id, {
      title: editingTitle,
      due_date: editingDueDate || null,
      priority: editingPriority,
      status: task.status,
    });
    if (res.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    setEditingId(null);
  };

  const handleEditKeyDown = (e, task) => {
    if (e.key === "Enter") handleEditSave(task);
    if (e.key === "Escape") setEditingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const filteredTasks = tasks
    .filter((t) => {
      if (filter === "pending") return t.status === "pending";
      if (filter === "completed") return t.status === "completed";
      return true;
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✦</span>
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">TaskFlow</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:block">{user.name}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-1.5 rounded-full transition"
          >
            Log Keluar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Hello, {user.name} 👋
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            {tasks.length === 0
              ? "Tiada task lagi. Mula tambah sekarang!"
              : `${completedCount} daripada ${tasks.length} task selesai`}
          </p>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{tasks.length}</p>
            <p className="text-gray-400 text-xs mt-1">Jumlah</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-sm">
            <p className="text-2xl md:text-3xl font-bold text-amber-500">{tasks.length - completedCount}</p>
            <p className="text-gray-400 text-xs mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-emerald-100 shadow-sm">
            <p className="text-2xl md:text-3xl font-bold text-emerald-500">{completedCount}</p>
            <p className="text-gray-400 text-xs mt-1">Selesai</p>
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="Apa yang perlu dibuat?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full text-gray-800 placeholder-gray-300 text-sm outline-none mb-3 bg-transparent"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-gray-400 bg-transparent"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-gray-400 bg-transparent"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <button
              type="submit"
              className="ml-auto bg-gray-900 hover:bg-gray-700 text-white text-xs px-5 py-1.5 rounded-full transition font-medium"
            >
              + Tambah
            </button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-5">
          {["all", "pending", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-400 hover:text-gray-700 border border-gray-200"
              }`}
            >
              {f === "all" ? "Semua" : f === "pending" ? "Pending" : "Selesai"}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-400 text-sm">Tiada task di sini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const p = PRIORITY_CONFIG[task.priority || "medium"];
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-start gap-3 group shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(task)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                      task.status === "completed"
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300 hover:border-gray-900"
                    }`}
                  >
                    {task.status === "completed" && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={editRef}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, task)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-gray-400"
                          placeholder="Nama task..."
                        />
                        <div className="flex gap-2 flex-wrap">
                          <input
                            type="date"
                            value={editingDueDate}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            className="text-xs border border-gray-200 rounded-full px-3 py-1 outline-none focus:border-gray-400"
                          />
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value)}
                            className="text-xs border border-gray-200 rounded-full px-3 py-1 outline-none focus:border-gray-400 bg-white"
                          >
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(task)}
                            className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-4 py-1.5 rounded-full transition"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="border border-gray-200 hover:border-gray-400 text-gray-500 text-xs px-4 py-1.5 rounded-full transition"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => task.status !== "completed" && startEdit(task)} className="cursor-pointer">
                        <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-300" : "text-gray-800 hover:text-gray-500"}`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>
                            {p.label}
                          </span>
                          {task.due_date && (
                            <span className={`text-xs ${task.status === "completed" ? "text-gray-300" : isOverdue(task.due_date) ? "text-red-400" : "text-gray-400"}`}>
                              📅 {formatDate(task.due_date)}
                              {isOverdue(task.due_date) && task.status !== "completed" && " • Overdue!"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-200 hover:text-red-400 transition text-base flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <p className="text-gray-300 text-xs text-center mt-8">
            Klik pada task untuk edit • Enter save • Esc batal
          </p>
        )}
      </div>
    </div>
  );
}