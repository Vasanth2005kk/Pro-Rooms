/**
 * services/api.js
 * ───────────────
 * Single Axios instance for all backend communication.
 *
 * Features:
 *  - Automatically attaches the JWT from localStorage to every request
 *  - Global 401 → redirects to /login (token expired or missing)
 *  - Throws consistent Axios error objects so components only catch .response.data.error
 */

import axios from "axios";

// ── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  // With the Vite proxy configured, we use /api so the browser never hits CORS
  baseURL: "/api",
  withCredentials: true, // needed for session cookie during Google OAuth redirect
});

// ── Request interceptor: attach JWT Bearer token ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: global 401 handling ──────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/signup")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth endpoints ──────────────────────────────────────────────────────────
export const authAPI = {
  login:     (data)  => api.post("/auth/login",      data),
  signup:    (data)  => api.post("/auth/signup",     data),
  verifyOtp: (data)  => api.post("/auth/verify_otp", data),
  resendOtp: ()      => api.post("/auth/resend_otp"),
  logout:    ()      => api.post("/auth/logout"),
  getMe:     ()      => api.get("/auth/me"),
};

// ── Rooms endpoints ─────────────────────────────────────────────────────────
export const roomsAPI = {
  /** GET /api/rooms?search=&category=&privacy= */
  list: (params = {}) => api.get("/rooms", { params }),

  /** GET /api/rooms/:id */
  get: (id) => api.get(`/rooms/${id}`),

  /** POST /api/rooms  (multipart/form-data — includes optional file upload) */
  create: (formData) =>
    api.post("/rooms", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** POST /api/rooms/join  { room_id, password? } */
  join: (data) => api.post("/rooms/join", data),

  /** POST /api/rooms/star  { room_id } */
  toggleStar: (roomId) => api.post("/rooms/star", { room_id: roomId }),
};

// ── Chat endpoints ──────────────────────────────────────────────────────────
export const chatAPI = {
  /** GET /api/chat/:roomId */
  getMessages: (roomId) => api.get(`/chat/${roomId}`),

  /** POST /api/chat/:roomId  { content } */
  postMessage: (roomId, content) => api.post(`/chat/${roomId}`, { content }),
};

// ── Profile endpoints ───────────────────────────────────────────────────────
export const profileAPI = {
  /** GET /api/profile/:username */
  get: (username) => api.get(`/profile/${username}`),

  /** PUT /api/profile/:username  (multipart for avatar, JSON for text) */
  update: (username, data) => {
    const isFormData = data instanceof FormData;
    return api.put(`/profile/${username}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
};

export default api;
