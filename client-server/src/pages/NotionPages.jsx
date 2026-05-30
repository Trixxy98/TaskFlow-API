import { useState, useEffect } from "react";
import Editor from "../components/Editor";

const EMOJI_LIST = ["📄", "📝", "💡", "🎯", "📊", "🚀", "⭐", "🔥", "💼", "🎨", "📚", "🌟"];

export default function NotionPages() {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem("notion_pages");
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "Welcome to TaskFlow Notes", emoji: "👋", content: "<h2>Selamat Datang!</h2><p>Ini adalah halaman pertama anda. Klik untuk mula menulis...</p>", updatedAt: new Date().toISOString() }
    ];
  });

  const [activePage, setActivePage] = useState(pages[0]?.id || null);
  const [editingTitle, setEditingTitle] = useState(false);

  const currentPage = pages.find((p) => p.id === activePage);

  useEffect(() => {
    localStorage.setItem("notion_pages", JSON.stringify(pages));
  }, [pages]);

  const createPage = () => {
    const newPage = {
      id: Date.now(),
      title: "Untitled",
      emoji: EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)],
      content: "",
      updatedAt: new Date().toISOString(),
    };
    setPages([...pages, newPage]);
    setActivePage(newPage.id);
  };

  const updatePage = (id, data) => {
    setPages(pages.map((p) => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePage = (id) => {
    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    setActivePage(remaining[0]?.id || null);
  };

  const changeEmoji = (id) => {
    const emoji = EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];
    updatePage(id, { emoji });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Pages Sidebar */}
      <div className="w-56 bg-gray-50 dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pages</span>
          <button onClick={createPage} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition text-lg">+</button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {pages.length === 0 ? (
            <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-6 px-4">Tiada page lagi</p>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition ${
                  activePage === page.id ? "bg-white dark:bg-gray-900 shadow-sm dark:shadow-none text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <span className="text-sm flex-shrink-0">{page.emoji}</span>
                <span className="text-xs font-medium truncate flex-1">{page.title || "Untitled"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition text-xs"
                >✕</button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={createPage} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-900 rounded-lg transition">
            <span>+</span><span>New Page</span>
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentPage ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Pilih page atau buat yang baru</p>
            <button onClick={createPage} className="bg-gray-900 dark:bg-blue-600 text-white text-sm px-5 py-2 rounded-xl hover:bg-gray-700 dark:hover:bg-blue-500 transition">
              + New Page
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-12">
            {/* Emoji */}
            <button
              onClick={() => changeEmoji(currentPage.id)}
              className="text-5xl mb-4 hover:opacity-70 transition block"
              title="Klik untuk tukar emoji"
            >
              {currentPage.emoji}
            </button>

            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus
                value={currentPage.title}
                onChange={(e) => updatePage(currentPage.id, { title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="w-full text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 outline-none bg-transparent mb-6 border-b border-gray-200 dark:border-gray-700 pb-2"
                placeholder="Untitled"
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 cursor-text hover:opacity-70 transition"
              >
                {currentPage.title || <span className="text-gray-300 dark:text-gray-600">Untitled</span>}
              </h1>
            )}

            <p className="text-xs text-gray-300 dark:text-gray-600 mb-8">Dikemaskini {formatDate(currentPage.updatedAt)}</p>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800 mb-8" />

            {/* Editor */}
            <Editor
              content={currentPage.content}
              onChange={(html) => updatePage(currentPage.id, { content: html })}
              placeholder="Mula taip... Guna toolbar di atas untuk format teks anda."
            />
          </div>
        )}
      </div>
    </div>
  );
}