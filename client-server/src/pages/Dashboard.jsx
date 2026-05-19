import { useState, useEffect } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../services/api";

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await getTasks();
    if (res.success) setTasks(res.data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await createTask({ title: newTask });
    if (res.success) {
      setTasks([res.data, ...tasks]);
      setNewTask("");
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

        {/* Add Task */}
        <form onSubmit={handleCreate} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Tambah task baru..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            + Tambah
          </button>
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "pending", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
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
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
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

                <span
                  className={`flex-1 ${
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-white"
                  }`}
                >
                  {task.title}
                </span>

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
      </div>
    </div>
  );
}