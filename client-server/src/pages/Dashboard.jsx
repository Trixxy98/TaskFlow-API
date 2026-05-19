import { useState, useEffect, useRef } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../services/api";

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
    }
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
    });
    if (res.success) {
      setTasks([res.data, ...tasks]);
      setNewTask("");
      setNewDueDate("");
    }
  };

  const handleToggle = async (task) => {
    const status = task.status === "pending" ? "completed" : "pending";
    const res = await updateTask(task.id, { status });
    if (res.success) {
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteTask(id);
    if (res.success) setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const handleEditSave = async (task) => {
    if (!editingTitle.trim() || editingTitle === task.title) {
      setEditingId(null);
      return;
    }
    const res = await updateTask(task.id, { title: editingTitle });
    if (res.success) {
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e, task) => {
    if (e.key === "Enter") handleEditSave(task);
    if (e.key === "Escape") setEditingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">📝 TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hi, {user.name}!</span>
          <button
            onClick={onLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            Log Keluar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
            <p className="text-gray-400 text-sm mt-1">Jumlah Task</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {tasks.length - completedCount}
            </p>
            <p className="text-gray-400 text-sm mt-1">Pending</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{completedCount}</p>
            <p className="text-gray-400 text-sm mt-1">Selesai</p>
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tambah task baru..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
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
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 group"
              >
                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                    task.status === "completed"
                      ? "bg-green-500 border-green-500"
                      : "border-gray-600 hover:border-blue-400"
                  }`}
                >
                  {task.status === "completed" && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </button>

                {/* Title + Due Date */}
                {editingId === task.id ? (
                  <input
                    ref={editRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleEditSave(task)}
                    onKeyDown={(e) => handleEditKeyDown(e, task)}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div
                    onClick={() => task.status !== "completed" && startEdit(task)}
                    className="flex-1 cursor-pointer"
                  >
                    <p
                      className={`${
                        task.status === "completed"
                          ? "line-through text-gray-500"
                          : "text-white hover:text-blue-400"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p
                        className={`text-xs mt-1 ${
                          task.status === "completed"
                            ? "text-gray-600"
                            : isOverdue(task.due_date)
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        📅 {formatDate(task.due_date)}
                        {isOverdue(task.due_date) &&
                          task.status !== "completed" && (
                            <span className="ml-1 text-red-400">• Overdue!</span>
                          )}
                      </p>
                    )}
                  </div>
                )}

                {/* Edit hint */}
                {editingId !== task.id && task.status !== "completed" && (
                  <span className="text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition">
                    ✏️
                  </span>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-600 hover:text-red-400 transition text-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <p className="text-gray-700 text-xs text-center mt-6">
            Klik pada task untuk edit • Enter untuk save • Esc untuk batal
          </p>
        )}
      </div>
    </div>
  );
}