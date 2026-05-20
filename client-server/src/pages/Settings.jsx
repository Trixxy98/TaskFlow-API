import { useState } from "react";

export default function Settings({ user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    overdue: true,
    dueToday: true,
    dueTomorrow: false,
    teamActivity: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Urus akaun dan keutamaan anda</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Profil</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-5 py-2 rounded-full transition font-medium"
          >
            {saved ? "✓ Saved!" : "Simpan"}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Notifikasi</h3>
        <div className="space-y-3">
          {[
            { key: "overdue", label: "Task overdue" },
            { key: "dueToday", label: "Task due hari ini" },
            { key: "dueTomorrow", label: "Task due esok" },
            { key: "teamActivity", label: "Aktiviti pasukan" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{item.label}</span>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                className={`w-10 h-5 rounded-full transition-all relative ${notifications[item.key] ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifications[item.key] ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}