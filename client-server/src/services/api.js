const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);

// ─── Token Refresh Interceptor ────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls when several requests get 401 at once.

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

const attemptRefresh = async () => {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("refresh_failed");
  const json = await res.json();
  return json.data.token;
};

/**
 * Wrapper for every API call that requires auth.
 * Automatically refreshes the access token when a 401 is received.
 */
const fetchWithAuth = async (url, options = {}) => {
  const authHeaders = {
    ...options.headers,
    Authorization: `Bearer ${getToken()}`,
  };

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: authHeaders,
  });

  if (res.status !== 401 || options._retry) {
    return res;
  }

  // 401 received — attempt to refresh access token
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    }).then((newToken) =>
      fetch(url, {
        ...options,
        _retry: true,
        credentials: "include",
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      })
    );
  }

  isRefreshing = true;

  try {
    const newToken = await attemptRefresh();
    setToken(newToken);
    processQueue(null, newToken);
    return fetch(url, {
      ...options,
      _retry: true,
      credentials: "include",
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    });
  } catch (err) {
    processQueue(err);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return new Response(JSON.stringify({ success: false, message: "Session expired. Please sign in again." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    isRefreshing = false;
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const logoutUser = async () => {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const resetPassword = async (token, password, confirmPassword) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, confirmPassword }),
  });
  return res.json();
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const getTasks = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${API_URL}/tasks${query ? `?${query}` : ""}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const createTask = async (data) => {
  const res = await fetchWithAuth(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateTask = async (id, data) => {
  const res = await fetchWithAuth(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};


export const deleteTask = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjects = async () => {
  const res = await fetchWithAuth(`${API_URL}/projects`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const createProject = async (data) => {
  const res = await fetchWithAuth(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteProject = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const getFeedback = async () => {
  const res = await fetchWithAuth(`${API_URL}/feedback`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const createFeedback = async (data) => {
  const res = await fetchWithAuth(`${API_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteFeedback = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/feedback/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

// ─── Attachments ──────────────────────────────────────────────────────────────

export const getAttachments = async (taskId) => {
  const res = await fetchWithAuth(`${API_URL}/upload/${taskId}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const uploadFile = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetchWithAuth(`${API_URL}/upload/${taskId}`, {
    method: "POST",
    headers: {},
    body: formData,
  });
  return res.json();
};

export const deleteAttachment = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/upload/file/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${API_URL}/notifications${query ? `?${query}` : ""}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const markNotificationRead = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const markAllRead = async () => {
  const res = await fetchWithAuth(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const sendChatMessage = async (message, history = []) => {
  const res = await fetchWithAuth(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return res.json();
};

export const deleteNotification = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};
