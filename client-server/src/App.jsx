import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Completed from "./pages/Completed";
import CalendarView from "./pages/CalendarView";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Sidebar from "./components/Sidebar";
import { getTasks, updateTask, deleteTask } from "./services/api";

export default function App() {
  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

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
    const { deleteTask: del } = await import("./services/api");
    const res = await del(id);
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto md:ml-0">
        {activePage === "dashboard" && (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            tasks={tasks}
            setTasks={setTasks}
          />
        )}
        {activePage === "completed" && (
          <Completed tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        {activePage === "calendar" && (
          <CalendarView tasks={tasks} />
        )}
        {activePage === "search" && (
          <Search tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        {activePage === "profile" && (
          <Profile user={user} tasks={tasks} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}