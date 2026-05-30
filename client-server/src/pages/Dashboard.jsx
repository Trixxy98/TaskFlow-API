import { useState, useEffect, useRef } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import Attachments from "../components/Attachments";
import { getAttachments } from "../services/api";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",    border: "border-red-200 dark:border-red-800"   },
  medium: { label: "Medium", color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800" },
  low:    { label: "Low",    color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
};

function TaskAttachmentPreview({ taskId }) {
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    getAttachments(taskId).then((res) => {
      if (res.success) setAttachments(res.data);
    });
  }, [taskId]);

  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimetype.startsWith("image/"));
  const pdfs = attachments.filter((a) => a.mimetype === "application/pdf");

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      {images.map((att) => (
        <a key={att.id} href={`http://localhost:3001${att.url}`} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}>
          <img
            src={`http://localhost:3001${att.url}`}
            alt={att.originalname}
            className="w-14 h-14 rounded-lg object-cover border border-gray-100 dark:border-gray-700 hover:opacity-80 transition"
          />
        </a>
      ))}
      {pdfs.map((att) => (
        <a key={att.id} href={`http://localhost:3001${att.url}`} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs px-3 py-2 rounded-lg hover:opacity-80 transition border border-red-100 dark:border-red-900/30">
          <span>📄</span>
          <span className="truncate max-w-24">{att.originalname}</span>
        </a>
      ))}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("tasks");
  const editRef = useRef(null);

  useEffect(() => { setLoading(false); }, [tasks]);
  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await createTask({ title: newTask, due_date: newDueDate || null, priority: newPriority });
    if (res.success) {
      setTasks([res.data, ...tasks]);
      setNewTask(""); setNewDueDate(""); setNewPriority("medium");
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
      title: editingTitle, due_date: editingDueDate || null,
      priority: editingPriority, status: task.status,
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
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  // ── Chart Data ──────────────────────────────────────────
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Pie chart — status
  const statusData = [
    { name: "Completed", value: completedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Bar chart — priority
  const priorityData = [
    { name: "High", count: tasks.filter((t) => t.priority === "high").length, color: "#ef4444" },
    { name: "Medium", count: tasks.filter((t) => t.priority === "medium").length, color: "#f59e0b" },
    { name: "Low", count: tasks.filter((t) => t.priority === "low").length, color: "#10b981" },
  ];

  // Area chart — tasks created last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const label = date.toLocaleDateString("ms-MY", { weekday: "short" });
      const created = tasks.filter((t) => {
        const d = new Date(t.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      }).length;
      const completed = tasks.filter((t) => {
        if (t.status !== "completed") return false;
        const d = new Date(t.updated_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      }).length;
      days.push({ day: label, Dibuat: created, Selesai: completed });
    }
    return days;
  };

  const weeklyData = getLast7Days();

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

    return (
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Hello, {user.name} 👋</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          {tasks.length === 0 ? "Tiada task lagi. Mula tambah sekarang!" : `${completedCount} daripada ${tasks.length} task selesai`}
        </p>
        {tasks.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
              <span>Overall Progress</span><span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: tasks.length, color: "text-gray-900 dark:text-white", bg: "bg-white dark:bg-gray-900" },
          { label: "Pending", value: pendingCount, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Selesai", value: completedCount, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Overdue", value: tasks.filter((t) => t.due_date && isOverdue(t.due_date) && t.status !== "completed").length, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm dark:shadow-none`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {[
          { id: "tasks", label: "📋 Tasks" },
          { id: "charts", label: "📊 Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              activeTab === tab.id ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {activeTab === "tasks" && (
        <>
          {/* Add Task */}
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-5">
            <input
              type="text"
              placeholder="Apa yang perlu dibuat?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="w-full text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 text-sm outline-none mb-3 bg-transparent"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 outline-none focus:border-gray-400 dark:focus:border-gray-500 bg-transparent"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 outline-none focus:border-gray-400 dark:focus:border-gray-500 bg-transparent"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
              <button type="submit" className="ml-auto bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white text-xs px-5 py-1.5 rounded-full transition font-medium">
                + Tambah
              </button>
            </div>
          </form>

          {/* Filter */}
          <div className="flex gap-1.5 mb-4">
            {["all", "pending", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === f ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-700 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {f === "all" ? "Semua" : f === "pending" ? "Pending" : "Selesai"}
              </button>
            ))}
          </div>

          {/* Task List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-blue-500 rounded-full animate-spin mx-auto" />
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
                  <div key={task.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4 flex items-start gap-3 group shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => handleToggle(task)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                        task.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-gray-900"
                      }`}
                    >
                      {task.status === "completed" && <span className="text-white text-xs">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            ref={editRef}
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, task)}
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="date"
                              value={editingDueDate}
                              onChange={(e) => setEditingDueDate(e.target.value)}
                              className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                            />
                            <select
                              value={editingPriority}
                              onChange={(e) => setEditingPriority(e.target.value)}
                              className="text-xs border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 outline-none bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300"
                            >
                              <option value="high">🔴 High</option>
                              <option value="medium">🟡 Medium</option>
                              <option value="low">🟢 Low</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleEditSave(task)} className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-full transition">✓ Save</button>
                              <button onClick={() => setEditingId(null)} className="border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full transition">Batal</button>
                          </div>
                              <Attachments taskId={task.id} />
                        </div>
                      ) : (
                        <div>
                        <div onClick={() => task.status !== "completed" && startEdit(task)} className="cursor-pointer">
                          <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-300" : "text-gray-800 dark:text-gray-100 hover:text-gray-500"}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>{p.label}</span>
                            {task.due_date && (
                              <span className={`text-xs ${task.status === "completed" ? "text-gray-300" : isOverdue(task.due_date) ? "text-red-400" : "text-gray-400"}`}>
                                📅 {formatDate(task.due_date)}
                                {isOverdue(task.due_date) && task.status !== "completed" && " • Overdue!"}
                              </span>
                            )}
                          </div>
                        </div>
                        <Attachments taskId={task.id} />
                      </div>
                      )}
                    </div>

                    <button onClick={() => handleDelete(task.id)} className="text-gray-200 hover:text-red-400 transition opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "charts" && (
        <div className="space-y-5">
          {/* Weekly Activity — Area Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Aktiviti Mingguan</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Task dibuat vs diselesaikan dalam 7 hari lepas</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorDibuat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="Dibuat" stroke="#6366f1" strokeWidth={2} fill="url(#colorDibuat)" />
                <Area type="monotone" dataKey="Selesai" stroke="#10b981" strokeWidth={2} fill="url(#colorSelesai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Priority Bar Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Tasks by Priority</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Bilangan task mengikut priority</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Pie Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Completion Status</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Nisbah task selesai vs pending</p>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-300 dark:text-gray-600 text-sm">Belum ada task</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Ringkasan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Completion Rate", value: `${progress}%`, color: "text-indigo-500" },
                { label: "High Priority", value: tasks.filter((t) => t.priority === "high" && t.status !== "completed").length, color: "text-red-500" },
                { label: "Due This Week", value: tasks.filter((t) => {
                  if (!t.due_date || t.status === "completed") return false;
                  const due = new Date(t.due_date);
                  const today = new Date();
                  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                  return diff >= 0 && diff <= 7;
                }).length, color: "text-amber-500" },
                { label: "Overdue", value: tasks.filter((t) => t.due_date && isOverdue(t.due_date) && t.status !== "completed").length, color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tasks.length > 0 && activeTab === "tasks" && (
        <p className="text-gray-300 text-xs text-center mt-8">
          Klik pada task untuk edit • Enter save • Esc batal
        </p>
      )}
    </div>
  );
}