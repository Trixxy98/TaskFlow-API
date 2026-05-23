const API_URL = "http://localhost:3001/api";

const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Auth
export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
};

// Tasks
export const getTasks = async () => {
  const res = await fetch(`${API_URL}/tasks`, { headers: headers() });
  return res.json();
};
export const createTask = async (data) => {
  const res = await fetch(`${API_URL}/tasks`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return res.json();
};
export const updateTask = async (id, data) => {
  const res = await fetch(`${API_URL}/tasks/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
  return res.json();
};
export const deleteTask = async (id) => {
  const res = await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE", headers: headers() });
  return res.json();
};

// Projects
export const getProjects = async () => {
  const res = await fetch(`${API_URL}/projects`, { headers: headers() });
  return res.json();
};
export const createProject = async (data) => {
  const res = await fetch(`${API_URL}/projects`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return res.json();
};
export const deleteProject = async (id) => {
  const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE", headers: headers() });
  return res.json();
};

// Team
export const getTeam = async () => {
  const res = await fetch(`${API_URL}/team`, { headers: headers() });
  return res.json();
};
export const inviteMember = async (data) => {
  const res = await fetch(`${API_URL}/team`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return res.json();
};
export const removeMember = async (id) => {
  const res = await fetch(`${API_URL}/team/${id}`, { method: "DELETE", headers: headers() });
  return res.json();
};

// Feedback
export const getFeedback = async () => {
  const res = await fetch(`${API_URL}/feedback`, { headers: headers() });
  return res.json();
};
export const createFeedback = async (data) => {
  const res = await fetch(`${API_URL}/feedback`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return res.json();
};
export const deleteFeedback = async (id) => {
  const res = await fetch(`${API_URL}/feedback/${id}`, { method: "DELETE", headers: headers() });
  return res.json();
};

export const getAttachments = async (taskId) => {
  const res = await fetch(`${API_URL}/upload/${taskId}`, { headers: headers() });
  return res.json();
};

export const uploadFile = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload/${taskId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return res.json();
};

export const deleteAttachment = async (id) => {
  const res = await fetch(`${API_URL}/upload/file/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return res.json();
};