export default function Notifications({ tasks }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    const notifications = tasks
      .filter((t) => t.due_date && t.status !== "completed")
      .map((t) => {
        const due = new Date(t.due_date);
        due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
        if (diff < 0) return { task: t, type: "overdue", label: `Overdue ${Math.abs(diff)} hari`, color: "text-red-500", bg: "bg-red-50", icon: "🔴" };
        if (diff === 0) return { task: t, type: "today", label: "Due hari ini!", color: "text-amber-500", bg: "bg-amber-50", icon: "🟡" };
        if (diff === 1) return { task: t, type: "tomorrow", label: "Due esok", color: "text-blue-500", bg: "bg-blue-50", icon: "🔵" };
        if (diff <= 3) return { task: t, type: "soon", label: `Due dalam ${diff} hari`, color: "text-indigo-500", bg: "bg-indigo-50", icon: "🟣" };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.task.due_date) - new Date(b.task.due_date));
  
    return (
      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-400 text-sm mt-1">{notifications.length} notifikasi aktif</p>
        </div>
  
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-400 text-sm">Tiada notifikasi — semua task okay!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.task.id} className={`rounded-2xl border px-4 py-4 flex items-start gap-3 ${notif.bg} border-transparent`}>
                <span className="text-lg flex-shrink-0">{notif.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{notif.task.title}</p>
                  <p className={`text-xs mt-0.5 font-medium ${notif.color}`}>{notif.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }