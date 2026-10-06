import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  activatePro,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
} from "../services/api";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const isPro = user?.plan === "pro";
  const canManualUpgrade = Boolean(user?.manualUpgrade);
  const checkoutEnabled = Boolean(user?.checkoutEnabled);
  const priceLabel = user?.proPriceLabel || "Pro";

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;

    if (checkout === "cancel") {
      setInfo("Checkout canceled. You are still on Free.");
      setSearchParams({}, { replace: true });
      return;
    }

    if (checkout === "success") {
      setInfo("Payment received. Refreshing your plan…");
      getSubscription().then((res) => {
        if (res.success) {
          onPlanChange?.(res.data);
          setInfo(
            res.data.plan === "pro"
              ? "You are now on Pro."
              : "Payment received. Plan updates in a few seconds — refresh if needed."
          );
        }
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, onPlanChange]);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    const res = await createCheckoutSession();
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setError(res.message || "Unable to start checkout.");
    setLoading(false);
  };

  const handlePortal = async () => {
    setLoading(true);
    setError("");
    const res = await createPortalSession();
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setError(res.message || "Unable to open billing portal.");
    setLoading(false);
  };

  const handleDemoUpgrade = async () => {
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
      {info && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-2xl mb-5 text-sm text-center">
          {info}
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
          <p className="text-3xl font-bold mt-2">{priceLabel}</p>
          <p className="text-sm text-white/70 mt-1 mb-5">Billed monthly via Stripe</p>
          <ul className="space-y-2 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex justify-between text-sm">
                <span>{f.name}</span>
                <span className="text-white/70">{f.pro}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="space-y-2">
              <div className="text-xs text-center text-white/80 py-2.5 rounded-xl bg-white/10">
                You are on Pro
              </div>
              {checkoutEnabled && (
                <button
                  type="button"
                  onClick={handlePortal}
                  disabled={loading}
                  className="w-full bg-white/15 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-white/25 transition disabled:opacity-50"
                >
                  {loading ? "Opening…" : "Manage billing"}
                </button>
              )}
            </div>
          ) : checkoutEnabled ? (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-white text-gray-900 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
          ) : canManualUpgrade ? (
            <button
              type="button"
              onClick={handleDemoUpgrade}
              disabled={loading}
              className="w-full bg-white text-gray-900 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading ? "Activating..." : "Activate Pro (demo)"}
            </button>
          ) : (
            <div className="text-xs text-center text-white/80 py-2.5 rounded-xl bg-white/10">
              Paid checkout is not configured yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}