import { useState, useEffect, useRef, useCallback } from "react";
import { getAttachments, uploadFile, deleteAttachment } from "../services/api";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Attachments({ taskId }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const fetchAttachments = useCallback(async () => {
    const res = await getAttachments(taskId);
    if (res.success) setAttachments(res.data);
  }, [taskId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (taskId) fetchAttachments();
  }, [taskId, fetchAttachments]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(taskId, file);
    if (res.success) setAttachments((prev) => [res.data, ...prev]);
    setUploading(false);
  };

  const handleDelete = async (id) => {
    const res = await deleteAttachment(id);
    if (res.success) setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const isImage = (mimetype) => mimetype.startsWith("image/");

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        Attachments {attachments.length > 0 && `(${attachments.length})`}
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition mb-3 ${
          dragOver
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-indigo-500">Uploading...</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            📎 Drop file di sini atau <span className="text-indigo-500">browse</span>
            <br />
            <span className="text-gray-300 dark:text-gray-600">JPG, PNG, GIF, WEBP, PDF • Max 5MB</span>
          </p>
        )}
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 group">
              {/* Preview */}
              {isImage(att.mimetype) ? (
                <a href={`http://localhost:3001${att.url}`} target="_blank" rel="noreferrer">
                  <img
  src={`http://localhost:3001${att.url}`}
  alt={att.originalname}
  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
  onError={(e) => {
    e.target.style.display = "none";
    e.target.nextSibling?.style.removeProperty("display");
  }}
/>
<span className="text-2xl hidden">🖼️</span>
                </a>
              ) : (
                <a href={`http://localhost:3001${att.url}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-lg">📄</span>
                </a>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{att.originalname}</p>
                <p className="text-xs text-gray-400">{formatSize(att.size)}</p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(att.id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}