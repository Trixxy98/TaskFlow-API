import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Selamat datang, {user.name}! 👋
          </h1>
          <p className="text-gray-400 mb-6">Dashboard akan dibina seterusnya</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Log Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {page === "login" && (
        <Login onLogin={handleLogin} goToRegister={() => setPage("register")} />
      )}
      {page === "register" && (
        <Register goToLogin={() => setPage("login")} />
      )}
    </>
  );
}