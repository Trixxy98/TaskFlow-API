import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, markAllRead, deleteNotification, acceptInvite, rejectInvite } from "../services/api";

const NOTIF_CONFIG = {
  team_invite: { icon: "👥", color: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" },
  task_overdue: { icon: "🔴", color: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800" },
  task_due_today: { icon: "🟡", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800" },
  task_due_tomorrow: { icon: "🔵", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
  default: { icon: "🔔", color: "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700" },
};

export default function Notifications({ tasks, onUnreadChange }) {
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

  const handleAcceptInvite = async (notif) => {
    const data = typeof notif.data === "string" ? JSON.parse(notif.data) : notif.data;
    const res = await acceptInvite(data?.member_id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, is_read: true, _invite_resolved: "accepted" } : n)
      );
      onUnreadChange?.((prev) => Math.max(0, prev - 1));
    }
  };

  const handleRejectInvite = async (notif) => {
    const data = typeof notif.data === "string" ? JSON.parse(notif.data) : notif.data;
    const res = await rejectInvite(data?.member_id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, is_read: true, _invite_resolved: "rejected" } : n)
      );
      onUnreadChange?.((prev) => Math.max(0, prev - 1));
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Baru sahaja";
    if (diff < 3600) return `${Math.floor(diff / 60)} minit lepas`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lepas`;
    return date.toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
  };

  // Task-based notifications
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const taskNotifs = tasks
    .filter((t) => t.due_date && t.status !== "completed")
    .map((t) => {
      const due = new Date(t.due_date); due.setHours(0, 0, 0, 0);
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { id: `task-${t.id}`, type: "task_overdue", title: "Task Overdue!", message: `"${t.title}" dah lepas tarikh akhir ${Math.abs(diff)} hari lepas`, is_read: false, created_at: new Date().toISOString() };
      if (diff === 0) return { id: `task-${t.id}`, type: "task_due_today", title: "Due Hari Ini!", message: `"${t.title}" perlu disiapkan hari ini`, is_read: false, created_at: new Date().toISOString() };
      if (diff === 1) return { id: `task-${t.id}`, type: "task_due_tomorrow", title: "Due Esok", message: `"${t.title}" perlu disiapkan esok`, is_read: false, created_at: new Date().toISOString() };
      return null;
    })
    .filter(Boolean);

  const allNotifs = [...notifications, ...taskNotifs];
  const unread = allNotifs.filter((n) => !n.is_read);
  const filtered = activeTab === "unread" ? unread : allNotifs;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-gray-400 text-sm mt-1">
            {unread.length > 0 ? `${unread.length} belum dibaca` : "Semua dah dibaca ✓"}
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
            {tab === "all" ? "Semua" : `Belum Baca ${unread.length > 0 ? `(${unread.length})` : ""}`}
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
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400 text-sm">
            {activeTab === "unread" ? "Tiada notifikasi belum dibaca" : "Tiada notifikasi"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default;
            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && typeof notif.id === "number" && handleRead(notif.id)}
                className={`rounded-2xl border px-4 py-4 flex items-start gap-3 transition group cursor-pointer ${config.color} ${
                  !notif.is_read ? "opacity-100" : "opacity-60"
                }`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
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
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>

                  {/* Accept / Reject buttons for team invites */}
                  {notif.type === "team_invite" && (() => {
                    const data = typeof notif.data === "string" ? JSON.parse(notif.data || "{}") : (notif.data || {});
                    if (!data?.member_id) return null;
                    if (notif._invite_resolved === "accepted") return (
                      <p className="text-xs text-emerald-500 font-medium mt-2">✅ Jemputan diterima</p>
                    );
                    if (notif._invite_resolved === "rejected") return (
                      <p className="text-xs text-gray-400 mt-2">Jemputan ditolak</p>
                    );
                    if (notif.is_read) return null;
                    return (
                      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAcceptInvite(notif)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded-full font-medium transition"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleRejectInvite(notif)}
                          className="border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-400 text-xs px-3 py-1 rounded-full transition"
                        >
                          Tolak
                        </button>
                      </div>
                    );
                  })()}

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