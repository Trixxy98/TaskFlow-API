import { useState, useEffect } from "react";
import { getFeedback, createFeedback, deleteFeedback } from "../services/api";

export default function Feedback({ tasks, user }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    const res = await getFeedback();
    if (res.success) setFeedbacks(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedTask) return;
    setSaving(true);
    const res = await createFeedback({ task_id: selectedTask, message });
    if (res.success) {
      setFeedbacks([res.data, ...feedbacks]);
      setMessage(""); setSelectedTask("");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const res = await deleteFeedback(id);
    if (res.success) setFeedbacks(feedbacks.filter((f) => f.id !== id));
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Feedback</h2>
        <p className="text-gray-400 text-sm mt-1">Nota dan komen untuk tasks</p>
      </div>

      {/* Add Feedback */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}
          className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 mb-3 bg-white">
          <option value="">Pilih task...</option>
          {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <textarea placeholder="Tulis nota atau feedback..." value={message} onChange={(e) => setMessage(e.target.value)}
          rows={3} className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 resize-none mb-3" />
        <div className="flex justify-end">
          <button type="submit" disabled={saving || !selectedTask || !message.trim()}
            className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-5 py-2 rounded-full transition font-medium disabled:opacity-40">
            {saving ? "Menghantar..." : "Hantar"}
          </button>
        </div>
      </form>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-400 text-sm">Belum ada feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-xs font-bold">{fb.author_name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{fb.author_name}</span>
                      <span className="text-xs text-gray-400">{formatTime(fb.created_at)}</span>
                    </div>
                    <button onClick={() => handleDelete(fb.id)} className="text-gray-200 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm">✕</button>
                  </div>
                  <p className="text-xs text-indigo-500 mb-1.5">📌 {fb.task_title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{fb.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}