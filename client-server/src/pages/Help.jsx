import { useState } from "react";

const FAQS = [
  { q: "How do I add a new task?", a: "Go to the Tasks page, type in the 'What needs to be done?' box and click + Add." },
  { q: "Can I set a priority for a task?", a: "Yes! When adding a task, pick a priority (High/Medium/Low) from the dropdown. You can change it any time by clicking the task." },
  { q: "How do I set a due date?", a: "When adding a task, pick a date from the date picker. Overdue tasks are highlighted in red." },
  { q: "How do I assign a task to a project?", a: "Go to the Projects page. Tasks without a project appear under the Unassigned Tasks section." },
  { q: "How do I edit a task?", a: "Click the task name to enter edit mode. You can change the title, due date, and priority." },
  { q: "What is included in the Free plan?", a: "Free includes up to 20 tasks and 3 projects. AI chatbot, file attachments, analytics, calendar, and notes require Pro." },
  { q: "How do I upgrade to Pro?", a: "Open Plans from the sidebar or Settings. Stripe checkout will be added next; until then, demo unlock may be available in development." },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Help Centre</h2>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Frequently asked questions about TaskFlow</p>
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
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Still have questions?</p>
        <p className="text-xs text-indigo-400 dark:text-indigo-400">Email us at support@taskflow.com</p>
      </div>
    </div>
  );
}