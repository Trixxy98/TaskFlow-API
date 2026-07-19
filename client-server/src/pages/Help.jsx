import { useState } from "react";

const FAQS = [
  { q: "Macam mana nak tambah task baru?", a: "Pergi ke halaman Tasks, taip dalam kotak 'Apa yang perlu dibuat?' dan klik + Tambah." },
  { q: "Boleh ke set priority untuk task?", a: "Ya! Masa tambah task, pilih priority (High/Medium/Low) dari dropdown. Boleh tukar bila-bila masa dengan klik pada task." },
  { q: "Macam mana nak set due date?", a: "Masa tambah task, pilih tarikh dari date picker. Task yang overdue akan ditanda dengan warna merah." },
  { q: "Macam mana nak assign task ke project?", a: "Pergi ke halaman Projects. Task yang belum ada project akan muncul di bahagian Unassigned Tasks." },
  { q: "Macam mana nak edit task?", a: "Klik pada nama task untuk masuk edit mode. Boleh edit title, due date, dan priority." },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Help Centre</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Soalan lazim tentang TaskFlow</p>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{faq.q}</span>
              <span className="text-gray-400 dark:text-gray-500 text-sm ml-3 flex-shrink-0">{openIndex === i ? "↑" : "↓"}</span>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 text-center border border-indigo-100 dark:border-indigo-800">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Masih ada soalan?</p>
        <p className="text-xs text-indigo-400 dark:text-indigo-400">Email kami di support@taskflow.com</p>
      </div>
    </div>
  );
}