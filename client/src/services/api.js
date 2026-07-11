import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Cows API
export const cowsAPI = {
  getAll: () => api.get('/cows'),
  getById: (id) => api.get(`/cows/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/cows', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/cows', data);
  },
  update: (id, data) => api.put(`/cows/${id}`, data),
  delete: (id) => api.delete(`/cows/${id}`),
  getDashboardStats: () => api.get('/cows/stats/dashboard'),
  getPublicPassport: (id) => api.get(`/cows/passport/${id}`),
};

// Health Records API
export const healthAPI = {
  getByCow: (cowId) => api.get(`/cows/${cowId}/health`),
  getById: (id) => api.get(`/health/${id}`),
  create: (cowId, data) => api.post(`/cows/${cowId}/health`, data),
  update: (id, data) => api.put(`/health/${id}`, data),
  delete: (id) => api.delete(`/health/${id}`),
};

// Vaccinations API
export const vaccinationAPI = {
  getByCow: (cowId) => api.get(`/cows/${cowId}/vaccinations`),
  getById: (id) => api.get(`/vaccinations/${id}`),
  create: (cowId, data) => api.post(`/cows/${cowId}/vaccinations`, data),
  update: (id, data) => api.put(`/vaccinations/${id}`, data),
  delete: (id) => api.delete(`/vaccinations/${id}`),
};

// Diagnoses API
export const diagnosisAPI = {
  getByCow: (cowId) => api.get(`/cows/${cowId}/diagnoses`),
  getById: (id) => api.get(`/diagnoses/${id}`),
  create: (cowId, data) => api.post(`/cows/${cowId}/diagnoses`, data),
  update: (id, data) => api.put(`/diagnoses/${id}`, data),
  delete: (id) => api.delete(`/diagnoses/${id}`),
  aiAnalyze: (data) => api.post('/diagnoses/ai-analyze', data),
};

// Notifications API
export const notificationAPI = {
  getAll: (unreadOnly = false) =>
    api.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;