import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await forgotPassword(email);
    if (res.success) {
      setResult(res);
    } else {
      setError(res.message || "Ralat berlaku. Sila cuba lagi.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-4xl">✦</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 tracking-tight">TaskFlow</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Reset kata laluan anda</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-red-500 dark:text-red-300 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
            {error}
          </div>
        )}

        {result ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-6 space-y-4 transition-colors duration-200">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 px-4 py-3 rounded-2xl text-sm text-center">
              {result.message}
            </div>

            {/* Dev mode only — show reset link for testing without email service */}
            {result.devResetUrl && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-medium">
                  [DEV MODE] Pautan reset:
                </p>
                <a
                  href={result.devResetUrl}
                  className="block text-xs text-indigo-500 dark:text-indigo-400 text-center break-all hover:underline"
                >
                  {result.devResetUrl}
                </a>
              </div>
            )}

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition text-sm"
            >
              Kembali ke Log Masuk
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-6 space-y-4 transition-colors duration-200">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                placeholder="anda@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition"
                required
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                Masukkan email yang berdaftar. Pautan reset akan dihantar.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-2"
            >
              {loading ? "Menghantar..." : "Hantar Pautan Reset"}
            </button>
          </form>
        )}

        <p className="text-gray-400 dark:text-gray-500 text-xs text-center mt-6">
          Ingat kata laluan?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-gray-900 dark:text-blue-400 font-medium hover:underline"
          >
            Log masuk
          </button>
        </p>
      </div>
    </div>
  );
}
