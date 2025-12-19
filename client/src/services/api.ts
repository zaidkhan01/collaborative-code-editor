import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Rooms
  createRoom: async (name: string, language: string = 'javascript') => {
    const response = await api.post('/rooms', { name, language });
    return response.data;
  },

  getRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  getRoom: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  updateRoom: async (roomId: string, data: { name?: string; language?: string }) => {
    const response = await api.put(`/rooms/${roomId}`, data);
    return response.data;
  },

  deleteRoom: async (roomId: string) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  }
};

export default apiService;

