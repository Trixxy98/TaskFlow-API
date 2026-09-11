import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { getMe, updateMe } from "../services/api";

const DEFAULT_PREFS = {
  overdue: true,
  dueToday: true,
  dueTomorrow: false,
};

export default function Settings({ user, onUserUpdated }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState({
    overdue: user?.notifyOverdue ?? DEFAULT_PREFS.overdue,
    dueToday: user?.notifyDueToday ?? DEFAULT_PREFS.dueToday,
    dueTomorrow: user?.notifyDueTomorrow ?? DEFAULT_PREFS.dueTomorrow,
  });

  useEffect(() => {
    let active = true;
    getMe().then((res) => {
      if (!active || !res.success) return;
      setName(res.data.name);
      setEmail(res.data.email);
      setNotifications({
        overdue: res.data.notifyOverdue,
        dueToday: res.data.notifyDueToday,
        dueTomorrow: res.data.notifyDueTomorrow,
      });
      onUserUpdated?.(res.data);
    });
    return () => {
      active = false;
    };
  }, [onUserUpdated]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await updateMe({ name });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Could not save settings");
      return;
    }
    onUserUpdated?.(res.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePref = async (key, apiField) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setError("");
    const res = await updateMe({ [apiField]: next[key] });
    if (!res.success) {
      setNotifications(notifications);
      setError(res.message || "Could not save notification preference");
      return;
    }
    onUserUpdated?.(res.data);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

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
              disabled
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-xl px-3 py-2 text-sm outline-none cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed yet.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white text-xs px-5 py-2 rounded-full transition font-medium disabled:opacity-60"
          >
            {saved ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            ) : saving ? (
              "Saving…"
            ) : (
              "Save"
            )}
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

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: "overdue", apiField: "notifyOverdue", label: "Overdue tasks" },
            { key: "dueToday", apiField: "notifyDueToday", label: "Tasks due today" },
            { key: "dueTomorrow", apiField: "notifyDueTomorrow", label: "Tasks due tomorrow" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
              <button
                type="button"
                onClick={() => togglePref(item.key, item.apiField)}
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