import { useState, useEffect } from "react";
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

export default function App() {
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, setTheme } = useTheme();

  async function fetchTasks() {
    const res = await getTasks();
    if (res.success) setTasks(res.data);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleLogin = (userData) => {
    setUser(userData);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
    setTasks([]);
  };

  const handleToggle = async (task) => {
    const status = task.status === "pending" ? "completed" : "pending";
    const res = await updateTask(task.id, { status });
    if (res.success) setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
  };

  const handleDelete = async (id) => {
    const res = await deleteTask(id);
    if (res.success) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (!user) {
    return (
      <>
        {page === "login" && <Login onLogin={handleLogin} goToRegister={() => setPage("register")} />}
        {page === "register" && <Register goToLogin={() => setPage("login")} />}
      </>
    );
  }

  const sharedProps = { tasks, onToggle: handleToggle, onDelete: handleDelete };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar
  activePage={activePage}
  onNavigate={setActivePage}
  user={user}
  onLogout={handleLogout}
  tasks={tasks}
  teamMembers={teamMembers}
  theme={theme}
  setTheme={setTheme}
  unreadCount={unreadCount}
/>

      <main className="flex-1 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        {activePage === "dashboard" && <Dashboard user={user} onLogout={handleLogout} tasks={tasks} setTasks={setTasks} />}
        {activePage === "projects" && <Projects tasks={tasks} setTasks={setTasks} />}
        {activePage === "calendar" && <CalendarView {...sharedProps} />}
        {activePage === "completed" && <Completed {...sharedProps} />}
        {activePage === "tasks" && <Dashboard user={user} onLogout={handleLogout} tasks={tasks} setTasks={setTasks} />}
        {activePage === "feedback" && <Feedback tasks={tasks} user={user} />}
        {activePage === "team" && <Team teamMembers={teamMembers} setTeamMembers={setTeamMembers} tasks={tasks} />}
        {activePage === "notifications" && <Notifications tasks={tasks} onUnreadChange={setUnreadCount} />}
        {activePage === "help" && <Help />}
        {activePage === "settings" && <Settings user={user} />}
        {activePage === "profile" && <Profile user={user} tasks={tasks} onLogout={handleLogout} />}
        {activePage === "notes" && <NotionPages />}
        {activePage === "kanban" && <Kanban tasks={tasks} setTasks={setTasks} />}
        {activePage === "table" && <TableView tasks={tasks} setTasks={setTasks} />}
      </main>
    </div>
  );
}