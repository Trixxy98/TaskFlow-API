import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/api";

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), message: "Contains an uppercase letter (A-Z)" },
  { test: (p) => /[0-9]/.test(p), message: "Contains a number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), message: "Contains a special character (!@#$...)" },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token not found. Please request a new reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const failedRule = PASSWORD_RULES.find((r) => !r.test(form.password));
    if (failedRule) {
      setError(`Password must have: ${failedRule.message.toLowerCase()}.`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, form.password, form.confirmPassword);

    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => navigate("/login"), 2500);
    } else {
      setError(res.message || "An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-4xl">✦</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3 tracking-tight">TaskFlow</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Set a new password</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-red-500 dark:text-red-300 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-6 space-y-4 transition-colors duration-200">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 px-4 py-3 rounded-2xl text-sm text-center">
              {success}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Redirecting to the sign in page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-6 space-y-4 transition-colors duration-200">
            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-medium">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition"
                required
              />
              {/* Password strength indicators */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => (
                    <div key={rule.message} className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold ${rule.test(form.password) ? "text-green-500" : "text-gray-300 dark:text-gray-600"}`}>
                        {rule.test(form.password) ? "✓" : "○"}
                      </span>
                      <span className={`text-[11px] ${rule.test(form.password) ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`}>
                        {rule.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-medium">Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-2"
            >
              {loading ? "Saving..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
