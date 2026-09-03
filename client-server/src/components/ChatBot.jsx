import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function ChatBot({ onTasksUpdated, user }) {
  const navigate = useNavigate();
  const isPro = user?.plan === "pro" || user?.features?.ai;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: `Hi ${user?.name?.split(" ")[0] || ""}! I'm TaskFlow AI. How can I help you today?` },
  ]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    let res;
    try {
      res = await sendChatMessage(text, chatHistory);
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "Failed to connect to the server. Please try again." }]);
      setLoading(false);
      return;
    }

    if (res.success) {
      setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text }] },
        { role: "model", parts: [{ text: res.reply }] },
      ]);
      const taskChanged = res.actions?.some((a) =>
        ["create_task", "update_task", "delete_task"].includes(a.tool)
      );
      if (taskChanged) onTasksUpdated?.();
    } else {
      const errorText = res.message || "An error occurred. Please try again.";
      setMessages((prev) => [...prev, { role: "error", text: errorText }]);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setMessages([{ role: "model", text: "Chat cleared. What can I help you with?" }]);
    setChatHistory([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ height: "460px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-white text-sm font-semibold">TaskFlow AI</p>
                <p className="text-gray-400 text-xs">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleClear} className="text-gray-400 hover:text-gray-200 text-xs transition">
                Clear
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xl leading-none transition">
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isPro ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-3xl mb-3">🔒</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">AI is a Pro feature</p>
                <p className="text-xs text-gray-400 mb-4">Create and manage tasks in natural language after you upgrade.</p>
                <button
                  onClick={() => { setOpen(false); navigate("/pricing"); }}
                  className="bg-gray-900 dark:bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-medium"
                >
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-br-sm"
                      : msg.role === "error"
                      ? "bg-red-50 dark:bg-red-900/30 text-red-500 rounded-bl-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          {isPro && (
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask a question or create a task..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm px-3 py-2 rounded-xl outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="bg-gray-900 text-white px-3 py-2 rounded-xl disabled:opacity-40 hover:bg-gray-700 transition text-base"
              >
                ↑
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-13 h-13 bg-gray-900 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-xl"
        style={{ width: "52px", height: "52px" }}
      >
        {open ? "×" : "🤖"}
      </button>
    </div>
  );
}