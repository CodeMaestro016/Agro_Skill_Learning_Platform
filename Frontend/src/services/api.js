// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api'; // Ensure this is your backend port

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return {
    user: {
      id: response.data.id,
      email: response.data.email,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      about: response.data.about || '',
      address: response.data.address || '',
      contactNumber: response.data.contactNumber || '',
      profilePhoto: response.data.profilePhoto || '',
      coverPhoto: response.data.coverPhoto || '',
      roles: response.data.roles || ['ROLE_USER']
    },
    token: response.data.token,
  };
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return await login(userData.email, userData.password);
};

// User Profile APIs
export const getCurrentUserProfile = async () => {
  const response = await api.get('/user/me');
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/user/update', data);
  return response.data;
};

// Search API
export const searchUsers = async (query) => {
  const response = await api.get(`/user/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

// Debug API
export const getAllUsers = async () => {
  const response = await api.get('/user/debug/all');
  return response.data;
};

export default api;
