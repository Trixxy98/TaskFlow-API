import { useState, useEffect, useRef } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../services/api";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30"   },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  low:    { label: "Low",    color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30"  },
};

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
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

  useEffect(() => { fetchTasks(); }, []);

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
    const res = await createTask({
      title: newTask,
      due_date: newDueDate || null,
      priority: newPriority,
    });
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
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }
  
    console.log("Saving:", {
      title: editingTitle,
      due_date: editingDueDate || null,
      priority: editingPriority,
      status: task.status,
    });
  
    const res = await updateTask(task.id, {
      title: editingTitle,
      due_date: editingDueDate || null,
      priority: editingPriority,
      status: task.status,
    });
  
    console.log("Response:", res);
  
    if (res.success) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e, task) => {
    if (e.key === "Enter") handleEditSave(task);
    if (e.key === "Escape") setEditingId(null);
  };

  const handlePriorityChange = async (task, priority) => {
    const res = await updateTask(task.id, { priority });
    if (res.success) setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ms-MY", {
      day: "numeric", month: "short", year: "numeric",
    });
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg md:text-xl font-bold text-white">📝 TaskFlow</h1>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">Hi, {user.name}!</span>
          <button
            onClick={onLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 md:px-4 py-2 rounded-lg transition"
          >
            Log Keluar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-gray-900 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-white">{tasks.length}</p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Jumlah</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">{tasks.length - completedCount}</p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Pending</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 md:p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-green-400">{completedCount}</p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Selesai</p>
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            placeholder="Tambah task baru..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 text-gray-400 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-400 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-xl font-semibold transition text-sm md:text-base"
            >
              + Tambah
            </button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "pending", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:text-white"
              }`}
            >
              {f === "all" ? "Semua" : f === "pending" ? "Pending" : "Selesai"}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tiada task lagi 🎉</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const p = PRIORITY_CONFIG[task.priority || "medium"];
              return (
                <div
                  key={task.id}
                  className={`bg-gray-900 border rounded-xl px-4 md:px-5 py-4 flex items-start gap-3 group ${
                    task.status === "completed" ? "border-gray-800" : p.border
                  }`}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(task)}
                    className={`mt-0.5 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                      task.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-600 hover:border-blue-400"
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
                          className="w-full bg-gray-800 text-white rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Nama task..."
                        />
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={editingDueDate}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          />
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          >
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(task)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            ✕ Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        onClick={() => task.status !== "completed" && startEdit(task)}
                        className={`cursor-pointer text-sm md:text-base break-words ${
                          task.status === "completed"
                            ? "line-through text-gray-500"
                            : "text-white hover:text-blue-400"
                        }`}
                      >
                        {task.title}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Priority badge */}
                      {task.status !== "completed" && (
                        <select
                          value={task.priority || "medium"}
                          onChange={(e) => handlePriorityChange(task, e.target.value)}
                          className={`text-xs px-2 py-0.5 rounded-md border ${p.bg} ${p.color} ${p.border} bg-transparent outline-none cursor-pointer`}
                        >
                          <option value="high">🔴 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                      )}

                      {/* Due date */}
                      {task.due_date && (
                        <span className={`text-xs ${
                          task.status === "completed"
                            ? "text-gray-600"
                            : isOverdue(task.due_date)
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}>
                          📅 {formatDate(task.due_date)}
                          {isOverdue(task.due_date) && task.status !== "completed" && (
                            <span className="ml-1">• Overdue!</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-600 hover:text-red-400 transition text-base md:text-lg flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <p className="text-gray-700 text-xs text-center mt-6">
            Klik pada task untuk edit • Enter save • Esc batal
          </p>
        )}
      </div>
    </div>
  );
}