import { useNavigate } from "react-router-dom";

export function hasProFeature(user, feature) {
  return user?.plan === "pro" || Boolean(user?.features?.[feature]);
}

export function ProFeature({ user, feature, title, description, children }) {
  if (hasProFeature(user, feature)) return children;
  return (
    <div className="flex-1 p-4 md:p-8 max-w-lg mx-auto w-full flex items-center min-h-[60vh]">
      <div className="w-full">
        <UpgradeGate title={title} description={description} />
      </div>
    </div>
  );
}

export default function UpgradeGate({ title, description }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center">
      <p className="text-3xl mb-3">✦</p>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>
      <button
        onClick={() => navigate("/pricing")}
        className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-500 text-white text-sm px-5 py-2 rounded-xl font-medium transition"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}
