export default function Completed({ tasks, onToggle, onDelete }) {
    const completedTasks = tasks.filter((t) => t.status === "completed");
  
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleDateString("ms-MY", {
        day: "numeric", month: "short", year: "numeric",
      });
    };
  
    return (
      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Completed</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{completedTasks.length} task selesai</p>
        </div>
  
        {completedTasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada task yang selesai</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4 flex items-start gap-3 group shadow-sm dark:shadow-none"
              >
                <button
                  onClick={() => onToggle(task)}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-emerald-500 border-emerald-500 transition"
                >
                  <span className="text-white text-xs">✓</span>
                </button>
  
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through text-gray-300 dark:text-gray-600">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {task.due_date && (
                      <span className="text-xs text-gray-300 dark:text-gray-600">
                        📅 {formatDate(task.due_date)}
                      </span>
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