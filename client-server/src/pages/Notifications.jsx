import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, markAllRead, deleteNotification } from "../services/api";
import { Bell, Users, CircleAlert, Clock, CalendarClock, X } from "lucide-react";

const NOTIF_CONFIG = {
  team_invite: { icon: Users, color: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800", iconColor: "text-indigo-500" },
  task_overdue: { icon: CircleAlert, color: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800", iconColor: "text-red-500" },
  task_due_today: { icon: Clock, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800", iconColor: "text-amber-500" },
  task_due_tomorrow: { icon: CalendarClock, color: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800", iconColor: "text-blue-500" },
  default: { icon: Bell, color: "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700", iconColor: "text-gray-400" },
};

export default function Notifications({ onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  async function fetchNotifications() {
    setLoading(true);
    const res = await getNotifications();
    if (res.success) {
      setNotifications(res.data);
      onUnreadChange?.(res.unreadCount);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchNotifications(); }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    const unread = notifications.filter((n) => !n.is_read && n.id !== id).length;
    onUnreadChange?.(unread);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    onUnreadChange?.(updated.filter((n) => !n.is_read).length);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  
  const unread = notifications.filter((n) => !n.is_read);
  const filtered = activeTab === "unread" ? unread : notifications;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-gray-400 text-sm mt-1">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "unread"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              activeTab === tab
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {tab === "all" ? "All" : `Unread ${unread.length > 0 ? `(${unread.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">
            {activeTab === "unread" ? "No unread notifications" : "No notifications"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default;
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleRead(notif.id)}
                className={`rounded-2xl border px-4 py-4 flex items-start gap-3 transition group cursor-pointer ${config.color} ${
                  !notif.is_read ? "opacity-100" : "opacity-60"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold text-gray-800 dark:text-gray-100 ${!notif.is_read ? "" : "font-normal"}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.is_read && typeof notif.id === "number" && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                      {typeof notif.id === "number" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>

                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">{formatTime(notif.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}