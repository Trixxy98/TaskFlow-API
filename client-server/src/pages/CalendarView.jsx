export default function CalendarView({ tasks }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const withDueDate = tasks
      .filter((t) => t.due_date && t.status !== "completed")
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  
    const overdue = withDueDate.filter((t) => new Date(t.due_date) < today);
    const upcoming = withDueDate.filter((t) => new Date(t.due_date) >= today);
  
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("ms-MY", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      });
    };
  
    const PRIORITY_COLOR = {
      high: "bg-red-50 text-red-500 border-red-100",
      medium: "bg-amber-50 text-amber-500 border-amber-100",
      low: "bg-emerald-50 text-emerald-500 border-emerald-100",
    };
  
    const TaskCard = ({ task }) => (
      <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium truncate">{task.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(task.due_date)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLOR[task.priority || "medium"]}`}>
          {task.priority || "medium"}
        </span>
      </div>
    );
  
    return (
      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-400 text-sm mt-1">Task mengikut tarikh</p>
        </div>
  
        {withDueDate.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-400 text-sm">Tiada task dengan due date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Overdue</span>
                  <span className="bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded-full">{overdue.length}</span>
                </div>
                <div className="space-y-2">
                  {overdue.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </div>
            )}
  
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming</span>
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{upcoming.length}</span>
                </div>
                <div className="space-y-2">
                  {upcoming.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }