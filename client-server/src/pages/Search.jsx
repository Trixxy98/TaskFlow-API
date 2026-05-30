import { useState } from "react";

const PRIORITY_COLOR = {
  high: "bg-red-50 dark:bg-red-900/20 text-red-500",
  medium: "bg-amber-50 dark:bg-amber-900/20 text-amber-500",
  low: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500",
};

export default function Search({ tasks, onToggle, onDelete }) {
  const [query, setQuery] = useState("");

  const results = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ms-MY", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Search</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Cari task anda</p>
      </div>

      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">⌕</span>
        <input
          type="text"
          placeholder="Taip untuk cari..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 shadow-sm dark:shadow-none transition"
        />
      </div>

      {query === "" ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">⌕</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Taip sesuatu untuk mula cari</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Tiada task dijumpai untuk "{query}"</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{results.length} result dijumpai</p>
          {results.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4 flex items-start gap-3 group shadow-sm dark:shadow-none"
            >
              <button
                onClick={() => onToggle(task)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  task.status === "completed"
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-400"
                }`}
              >
                {task.status === "completed" && <span className="text-white text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === "completed" ? "line-through text-gray-300 dark:text-gray-600" : "text-gray-800 dark:text-gray-100"}`}>
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority || "medium"]}`}>
                    {task.priority || "medium"}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">📅 {formatDate(task.due_date)}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(task.id)}
                className="text-gray-200 dark:text-gray-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}