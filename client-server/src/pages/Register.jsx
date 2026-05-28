import { useState } from "react";
import { registerUser } from "../services/api";

export default function Register({ goToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password mesti sekurang-kurangnya 8 aksara.");
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError("Password mesti ada sekurang-kurangnya 1 huruf besar (A-Z).");
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setError("Password mesti ada sekurang-kurangnya 1 nombor.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError("Password mesti ada sekurang-kurangnya 1 simbol khas (contoh: !@#$).");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Confirmation password tidak sama dengan password.");
      return;
    }

    setLoading(true);

    const res = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (res.success) {
      setSuccess("Akaun berjaya didaftarkan! Sila log masuk.");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-4xl">✦</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 tracking-tight">TaskFlow</h1>
          <p className="text-gray-400 text-sm mt-1">Cipta akaun baru</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Nama</label>
            <input
              type="text"
              placeholder="Nama anda"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              placeholder="rith@gmail.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Minimum 8 aksara, ada huruf besar, nombor, dan simbol khas.
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password</label>
            <input
              type="password"
              placeholder="Ulang semula password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-2"
          >
            {loading ? "Loading..." : "Daftar"}
          </button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          Dah ada akaun?{" "}
          <button onClick={goToLogin} className="text-gray-900 font-medium hover:underline">
            Log masuk
          </button>
        </p>
      </div>
    </div>
  );
}