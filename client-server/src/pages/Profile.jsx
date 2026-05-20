export default function Profile({ user, tasks, onLogout }) {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  
    const highCount = tasks.filter((t) => t.priority === "high" && t.status !== "completed").length;
  
    const stats = [
      { label: "Total Task", value: tasks.length, color: "text-gray-900" },
      { label: "Selesai", value: completed, color: "text-emerald-500" },
      { label: "Pending", value: pending, color: "text-amber-500" },
      { label: "High Priority", value: highCount, color: "text-red-500" },
    ];
  
    return (
      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Profile</h2>
          <p className="text-gray-400 text-sm mt-1">Maklumat akaun anda</p>
        </div>
  
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
  
          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Completion Rate</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
  
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
  
        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full border border-red-100 text-red-400 hover:bg-red-50 py-3 rounded-2xl text-sm font-medium transition"
        >
          Log Keluar
        </button>
      </div>
    );
  }