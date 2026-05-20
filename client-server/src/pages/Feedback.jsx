import { useState } from "react";

export default function Feedback({ tasks, user }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedTask) return;
    const task = tasks.find((t) => t.id === parseInt(selectedTask));
    setFeedbacks([
      {
        id: Date.now(),
        taskTitle: task?.title || "Unknown",
        message,
        author: user.name,
        time: new Date().toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toLocaleDateString("ms-MY", { day: "numeric", month: "short" }),
      },
      ...feedbacks,
    ]);
    setMessage("");
    setSelectedTask("");
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Feedback</h2>
        <p className="text-gray-400 text-sm mt-1">Nota dan komen untuk tasks</p>
      </div>

      {/* Add Feedback */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 mb-3 bg-white"
        >
          <option value="">Pilih task...</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <textarea
          placeholder="Tulis nota atau feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-5 py-2 rounded-full transition font-medium"
          >
            Hantar
          </button>
        </div>
      </form>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-400 text-sm">Belum ada feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-xs font-bold">{fb.author.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{fb.author}</span>
                    <span className="text-xs text-gray-400">{fb.date} • {fb.time}</span>
                  </div>
                  <p className="text-xs text-indigo-500 mb-1">re: {fb.taskTitle}</p>
                  <p className="text-sm text-gray-600">{fb.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}