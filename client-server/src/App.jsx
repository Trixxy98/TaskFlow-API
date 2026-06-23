import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Completed from "./pages/Completed";
import CalendarView from "./pages/CalendarView";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Feedback from "./pages/Feedback";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { getTasks, updateTask, deleteTask } from "./services/api";
import NotionPages from "./pages/NotionPages";
import Kanban from "./pages/Kanban";
import useTheme from "./hooks/useTheme";
import TableView from "./pages/TableView";
import useAuthGuard from "./hooks/useAuthGuard";
import useIdleTimeout from "./hooks/useIdleTimeout";

function ProtectedRoute({ isAuthenticated }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppLayout({ user, tasks, teamMembers, theme, setTheme, onLogout, unreadCount }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar
        user={user}
        tasks={tasks}
        teamMembers={teamMembers}
        theme={theme}
        setTheme={setTheme}
        onLogout={onLogout}
        unreadCount={unreadCount}
      />
      <main className="flex-1 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuthGuard(user);

  async function fetchTasks() {
    const res = await getTasks();
    if (res.success) setTasks(res.data);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleLogin = (userData) => {
    setUser(userData);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setTasks([]);
    navigate("/login");
  };

  useIdleTimeout({
    enabled: Boolean(user),
    timeoutMs: 30 * 60 * 1000,
    onTimeout: handleLogout,
  });

  const handleToggle = async (task) => {
    const status = task.status === "pending" ? "completed" : "pending";
    const res = await updateTask(task.id, { status });
    if (res.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
  };

  const handleDelete = async (id) => {
    const res = await deleteTask(id);
    if (res.success) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const sharedProps = { tasks, onToggle: handleToggle, onDelete: handleDelete };
  const layoutProps = { user, tasks, teamMembers, theme, setTheme, onLogout: handleLogout, unreadCount };

  return (
    <Routes>
      {/* Public routes — redirect to /dashboard if already logged in */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes — redirect to /login if not authenticated */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<AppLayout {...layoutProps} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} tasks={tasks} setTasks={setTasks} />} />
          <Route path="/tasks" element={<Dashboard user={user} tasks={tasks} setTasks={setTasks} />} />
          <Route path="/projects" element={<Projects tasks={tasks} setTasks={setTasks} />} />
          <Route path="/kanban" element={<Kanban tasks={tasks} setTasks={setTasks} />} />
          <Route path="/table" element={<TableView tasks={tasks} setTasks={setTasks} />} />
          <Route path="/notes" element={<NotionPages />} />
          <Route path="/calendar" element={<CalendarView {...sharedProps} />} />
          <Route path="/completed" element={<Completed {...sharedProps} />} />
          <Route path="/feedback" element={<Feedback tasks={tasks} />} />
          <Route path="/team" element={<Team teamMembers={teamMembers} setTeamMembers={setTeamMembers} tasks={tasks} />} />
          <Route path="/notifications" element={<Notifications tasks={tasks} onUnreadChange={setUnreadCount} />} />
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/profile" element={<Profile user={user} tasks={tasks} onLogout={handleLogout} />} />
        </Route>
      </Route>

      {/* Fallback — redirect based on auth state */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
