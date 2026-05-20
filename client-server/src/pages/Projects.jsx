import { useState } from "react";

const PRIORITY_COLOR = {
  high: "bg-red-50 text-red-500",
  medium: "bg-amber-50 text-amber-500",
  low: "bg-emerald-50 text-emerald-500",
};

export default function Projects({ tasks, setTasks, onUpdateTask }) {
  const [newProject, setNewProject] = useState("");
  const [showInput, setShowInput] = useState(false);

  const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))];
  const unassigned = tasks.filter((t) => !t.project);

  const getProjectTasks = (project) => tasks.filter((t) => t.project === project);

  const handleAssignProject = async (taskId, project) => {
    const res = await onUpdateTask(taskId, { project });
    if (res.success) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data : t)));
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-400 text-sm mt-1">{projects.length} projek aktif</p>
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition font-medium"
        >
          + New Project
        </button>
      </div>

      {showInput && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Nama project..."
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newProject.trim()) {
                setShowInput(false);
                setNewProject("");
              }
              if (e.key === "Escape") setShowInput(false);
            }}
            className="flex-1 text-sm text-gray-800 outline-none"
          />
          <button
            onClick={() => { setShowInput(false); setNewProject(""); }}
            className="text-gray-300 hover:text-gray-600 text-sm"
          >
            Batal
          </button>
        </div>
      )}

      {projects.length === 0 && unassigned.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-400 text-sm">Tiada project lagi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const ptasks = getProjectTasks(project);
            const done = ptasks.filter((t) => t.status === "completed").length;
            const progress = Math.round((done / ptasks.length) * 100);
            return (
              <div key={project} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{project}</h3>
                  <span className="text-xs text-gray-400">{done}/{ptasks.length} selesai</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-2">
                  {ptasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-1">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === "completed" ? "bg-emerald-400" : "bg-gray-300"}`} />
                      <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-gray-300" : "text-gray-700"}`}>
                        {task.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority || "medium"]}`}>
                        {task.priority || "medium"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5">
              <h3 className="font-semibold text-gray-400 mb-3 text-sm">Unassigned Tasks</h3>
              <div className="space-y-2">
                {unassigned.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 flex-shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{task.title}</span>
                    <select
                      onChange={(e) => handleAssignProject(task.id, e.target.value)}
                      defaultValue=""
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-400"
                    >
                      <option value="" disabled>Assign project</option>
                      {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}