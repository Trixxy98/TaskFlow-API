import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  Columns3,
  Table2,
  StickyNote,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  MessageSquare,
  Bell,
  CircleHelp,
  Settings,
  Lock,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { hasProFeature } from "./UpgradeGate";
import BrandMark from "./BrandMark";

const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "projects", label: "Projects", icon: Folder, badge: null },
      { id: "kanban", label: "Kanban", icon: Columns3 },
      { id: "table", label: "Table View", icon: Table2 },
    ],
  },
  {
    label: "MY PAGES",
    items: [
      { id: "notes", label: "Notes", icon: StickyNote },
      { id: "calendar", label: "Calendar", icon: CalendarDays },
      { id: "completed", label: "Completion", icon: CheckCircle2 },
      { id: "tasks", label: "Tasks", icon: ListTodo },
      { id: "feedback", label: "Feedback", icon: MessageSquare, badge: null },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "help", label: "Help Centre", icon: CircleHelp },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ user, onLogout, tasks, theme, setTheme, unreadCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (id) => location.pathname === `/${id}` || (id === "dashboard" && location.pathname === "/");

  const handleNavigate = (id) => {
    navigate(`/${id}`);
    setMobileOpen(false);
  };

  const projectCount = [...new Set(tasks.map((t) => t.project).filter(Boolean))].length;
  const feedbackCount = tasks.filter((t) => t.feedback).length;

  const getBadge = (id) => {
    if (id === "projects") return projectCount || null;
    if (id === "feedback") return feedbackCount || null;
    if (id === "notifications") return unreadCount || null;
    return null;
  };

  return (
    <>
      <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2">
          <BrandMark />
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">TaskFlow</h1>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-500 dark:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed md:sticky top-0 h-screen z-40 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800
        flex flex-col transition-all duration-300 overflow-y-auto
        ${collapsed ? "md:w-16" : "md:w-60"}
        ${mobileOpen ? "left-0 w-64" : "-left-64 md:left-0"}
      `}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-50 dark:border-gray-800 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-base font-semibold text-gray-900 dark:text-white">TaskFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <BrandMark />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition ml-1"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

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
                  const locked = (item.id === "notes" || item.id === "calendar") && !hasProFeature(user, item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.id)
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {locked && <Lock className="w-3 h-3 text-gray-400" strokeWidth={2} />}
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

        </nav>

        <div className="px-3 py-4 border-t border-gray-50 dark:border-gray-800 flex-shrink-0 space-y-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {user.plan === "pro" ? "Pro" : "Free"} · {user.email}
                </p>
              </div>
            </div>
          )}

          {!collapsed && user?.plan !== "pro" && (
            <button
              onClick={() => handleNavigate("pricing")}
              className="w-full bg-gray-900 dark:bg-blue-600 text-white text-xs font-medium py-2 rounded-xl hover:bg-gray-700 dark:hover:bg-blue-500 transition"
            >
              Upgrade to Pro
            </button>
          )}

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

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-300 transition"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
