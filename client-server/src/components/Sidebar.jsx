import { useState } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "completed", label: "Completed", icon: "✓" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "search", label: "Search", icon: "⌕" },
  { id: "profile", label: "Profile", icon: "◉" },
];

export default function Sidebar({ activePage, onNavigate, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <h1 className="text-base font-semibold text-gray-900">TaskFlow</h1>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-500 hover:text-gray-900 text-xl"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen z-40
          bg-white border-r border-gray-100
          flex flex-col transition-all duration-300
          ${collapsed ? "md:w-16" : "md:w-56"}
          ${mobileOpen ? "left-0 w-64" : "-left-64 md:left-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl">✦</span>
              <span className="text-base font-semibold text-gray-900">TaskFlow</span>
            </div>
          )}
          {collapsed && <span className="text-xl mx-auto">✦</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block text-gray-300 hover:text-gray-600 transition text-sm ml-auto"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === item.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-4 border-t border-gray-50">
          {!collapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <span className="flex-shrink-0">⎋</span>
            {!collapsed && <span>Log Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}