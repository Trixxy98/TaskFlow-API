import { useState } from "react";
import { Link } from "react-router-dom";

export default function Settings({ user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    overdue: true,
    dueToday: true,
    dueTomorrow: false,
    teamActivity: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Profile</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white text-xs px-5 py-2 rounded-full transition font-medium"
          >
            {saved ? "✓ Saved!" : "Save"}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Plan</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              You are on the {user?.plan === "pro" ? "Pro" : "Free"} plan
            </p>
          </div>
          {user?.plan !== "pro" && (
            <Link to="/pricing" className="text-xs font-medium text-indigo-500 hover:underline">
              Upgrade
            </Link>
          )}
        </div>
        {user?.limits && (
          <div className="space-y-2 text-xs text-gray-500">
            <p>
              Tasks: {user.usage?.tasks ?? 0}
              {user.limits.maxTasks !== null ? ` / ${user.limits.maxTasks}` : " · unlimited"}
            </p>
            <p>
              Projects: {user.usage?.projects ?? 0}
              {user.limits.maxProjects !== null ? ` / ${user.limits.maxProjects}` : " · unlimited"}
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: "overdue", label: "Overdue tasks" },
            { key: "dueToday", label: "Tasks due today" },
            { key: "dueTomorrow", label: "Tasks due tomorrow" },
            { key: "teamActivity", label: "Team activity" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                className={`w-10 h-5 rounded-full transition-all relative ${notifications[item.key] ? "bg-gray-900 dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifications[item.key] ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}