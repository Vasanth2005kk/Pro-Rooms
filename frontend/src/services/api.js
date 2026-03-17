import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  signup: (data) => api.post("/auth/signup", data),
  verifyOtp: (data) => api.post("/auth/verify_otp", data),
  resendOtp: (data) => api.post("/auth/resend_otp", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

export const roomsAPI = {
  list: (params = {}) => api.get("/rooms", { params }),
  get: (id) => api.get(`/rooms/${id}`),
  create: (formData) =>
    api.post("/rooms", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  join: (data) => api.post("/rooms/join", data),
  toggleStar: (roomId) => api.post("/rooms/star", { room_id: roomId }),
};

export const chatAPI = {
  getMessages: (roomId) => api.get(`/chat/${roomId}`),
  postMessage: (roomId, content) => api.post(`/chat/${roomId}`, { content }),
};

export const profileAPI = {
  get: (username) => api.get(`/profile/${username}`),
  update: (username, data) => {
    const isFormData = data instanceof FormData;
    return api.put(`/profile/${username}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
};

export default api;
