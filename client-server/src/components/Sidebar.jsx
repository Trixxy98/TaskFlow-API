import { useState } from "react";
import useTheme from "../hooks/UseTheme";


const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "⊞" },
      { id: "projects", label: "Projects", icon: "⊟", badge: null },
      { id: "kanban", label: "Kanban", icon: "⊞" },
      { id: "table", label: "Table View", icon: "⊟" },
    ],
  },
  {
    label: "MY PAGES",
    items: [
      { id: "notes", label: "Notes", icon: "📝" },
      { id: "calendar", label: "Calendar", icon: "📅" },
      { id: "completed", label: "Completion", icon: "✓" },
      { id: "tasks", label: "Tasks", icon: "☰" },
      { id: "feedback", label: "Feedback", icon: "💬", badge: null },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { id: "notifications", label: "Notifications", icon: "🔔" },
      { id: "help", label: "Help Centre", icon: "❓" },
      { id: "settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate, user, onLogout, tasks, teamMembers, theme, setTheme, unreadCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  

  const projectCount = [...new Set(tasks.map((t) => t.project).filter(Boolean))].length;
  const feedbackCount = tasks.filter((t) => t.feedback).length;
  const notifCount = tasks.filter((t) => t.status === "pending" && t.due_date).length;

  const getBadge = (id) => {
    if (id === "projects") return projectCount || null;
    if (id === "feedback") return feedbackCount || null;
    if (id === "notifications") return unreadCount || null;
    return null;
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold"></span>
          </div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">TaskFlow</h1>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-500 dark:text-gray-400 text-xl">
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
  fixed md:sticky top-0 h-screen z-40 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800
        flex flex-col transition-all duration-300 overflow-y-auto
        ${collapsed ? "md:w-16" : "md:w-60"}
        ${mobileOpen ? "left-0 w-64" : "-left-64 md:left-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-50 dark:border-gray-800 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
                <span className="text-black text-xl font-bold">✦</span>
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white">TaskFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto border border-gray-100 dark:border-gray-700">
              <span className="text-black text-xl font-bold">✦</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition text-xs ml-1"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 px-2 mb-2 tracking-wider">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const badge = getBadge(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activePage === item.id
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {badge && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TEAM Section */}
          {!collapsed && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 px-2 mb-2 tracking-wider">TEAM</p>
              <div className="space-y-0.5">
                {teamMembers.length === 0 ? (
                  <button
                    onClick={() => { onNavigate("team"); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <span>+ Invite member</span>
                  </button>
                ) : (
                  teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => { onNavigate("team"); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate">{member.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom — Theme + Logout */}
        <div className="px-3 py-4 border-t border-gray-50 dark:border-gray-800 flex-shrink-0 space-y-3">
          {/* User info */}
          {!collapsed && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          {!collapsed && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
              {["Dark", "Light", "System"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t.toLowerCase())}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                    theme === t.toLowerCase()
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-300 transition"
          >
            <span className="flex-shrink-0">⎋</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}