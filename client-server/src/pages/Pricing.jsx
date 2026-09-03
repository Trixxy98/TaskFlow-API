import { useState } from "react";
import { activatePro } from "../services/api";

const FEATURES = [
  { name: "Tasks", free: "20 tasks", pro: "Unlimited" },
  { name: "Projects", free: "3 projects", pro: "Unlimited" },
  { name: "AI chatbot", free: "Locked", pro: "Included" },
  { name: "File attachments", free: "Locked", pro: "Included" },
  { name: "Analytics", free: "Locked", pro: "Included" },
  { name: "Calendar", free: "Locked", pro: "Included" },
  { name: "Notes", free: "Locked", pro: "Included" },
];

export default function Pricing({ user, onPlanChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isPro = user?.plan === "pro";
  const canManualUpgrade = Boolean(user?.manualUpgrade);

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    const res = await activatePro();
    if (res.success) {
      onPlanChange?.(res.data);
    } else {
      setError(res.message || "Unable to upgrade right now.");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Plans</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Start free. Unlock AI, attachments, analytics, calendar, and notes with Pro.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-red-500 dark:text-red-300 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Free</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">RM 0</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">For personal task tracking</p>
          <ul className="space-y-2 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>{f.name}</span>
                <span className="text-gray-400">{f.free}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-center text-gray-400 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
            {isPro ? "You are on Pro" : "Current plan"}
          </div>
        </div>

        <div className="bg-gray-900 dark:bg-blue-600 rounded-3xl p-6 text-white shadow-sm">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Pro</p>
          <p className="text-3xl font-bold mt-2">Coming soon</p>
          <p className="text-sm text-white/70 mt-1 mb-5">Stripe checkout will be added next</p>
          <ul className="space-y-2 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex justify-between text-sm">
                <span>{f.name}</span>
                <span className="text-white/70">{f.pro}</span>
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="text-xs text-center text-white/80 py-2.5 rounded-xl bg-white/10">
              You are on Pro
            </div>
          ) : canManualUpgrade ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-white text-gray-900 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? "Activating..." : "Activate Pro (demo)"}
            </button>
          ) : (
            <div className="text-xs text-center text-white/80 py-2.5 rounded-xl bg-white/10">
              Paid checkout is not enabled yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
