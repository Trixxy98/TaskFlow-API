import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Completed from "./pages/Completed";
import CalendarView from "./pages/CalendarView";
import Search from "./pages/Search";
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

export default function App() {
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const res = await getTasks();
    if (res.success) setTasks(res.data);
  };

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

  const handleUpdateTask = async (id, data) => {
    const res = await updateTask(id, data);
    if (res.success) setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res;
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
        tasks={tasks}
        teamMembers={teamMembers}
      />

      <main className="flex-1 overflow-y-auto min-h-screen">
        {activePage === "dashboard" && <Dashboard user={user} onLogout={handleLogout} tasks={tasks} setTasks={setTasks} />}
        {activePage === "projects" && <Projects tasks={tasks} setTasks={setTasks} />}
        {activePage === "calendar" && <CalendarView {...sharedProps} />}
        {activePage === "completed" && <Completed {...sharedProps} />}
        {activePage === "tasks" && <Dashboard user={user} onLogout={handleLogout} tasks={tasks} setTasks={setTasks} />}
        {activePage === "feedback" && <Feedback tasks={tasks} user={user} />}
        {activePage === "team" && <Team teamMembers={teamMembers} setTeamMembers={setTeamMembers} tasks={tasks} />}
        {activePage === "notifications" && <Notifications tasks={tasks} />}
        {activePage === "help" && <Help />}
        {activePage === "settings" && <Settings user={user} />}
        {activePage === "profile" && <Profile user={user} tasks={tasks} onLogout={handleLogout} />}
        {activePage === "notes" && <NotionPages />}
      </main>
    </div>
  );
}