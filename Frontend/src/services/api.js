// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8081/api'; // Updated to match backend port

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


// Post-related functions
export const getAllPosts = async (userId) => {
  try {
    const response = await api.get(`/auth/posts?userId=${userId}`);
    console.log('Posts response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error.response?.data || error.message); // Debug log
    throw error.response?.data || error.message;
  }
};

export const getFeed = async (page = 0, size = 10) => {
  try {
    const response = await api.get(`/auth/posts/feed?page=${page}&size=${size}`);
    console.log('Raw Feed response:', response.data); // Debug log for raw response
    console.log('Feed content:', response.data.content); // Debug log for content array
    
    // Process the feed data to ensure user information is properly formatted
    const processedData = {
      ...response.data,
      content: response.data.content.map(post => {
        console.log('Processing post:', post); // Debug log for each post
        console.log('Post user data:', {
          userName: post.userName,
          profilePhoto: post.profilePhoto
        }); // Debug log for user data
        
        return {
          ...post,
          userName: post.userName || 'Unknown User',
          profilePhoto: post.profilePhoto || null,
          createdAt: new Date(post.createdAt).toISOString(),
        };
      }),
    };
    
    console.log('Processed feed data:', processedData); // Debug log for final processed data
    return processedData;
  } catch (error) {
    console.error('Error fetching feed:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const addPost = async (formData) => {
  try {
    // Validate file sizes before upload
    const files = formData.getAll('imageUrls');
    const video = formData.get('videoUrl');
    
    if (files.length > 0) {
      for (const file of files) {
        if (file instanceof File && file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('Image file size exceeds 5MB limit');
        }
      }
    }
    
    if (video instanceof File && video.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('Video file size exceeds 50MB limit');
    }

    // Set appropriate content type for multipart form data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add upload progress tracking
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Upload progress:', percentCompleted);
      },
    };

    // Log the formData contents for debugging
    console.log('Add post formData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }

    const response = await api.post('/auth/posts', formData, config);
    console.log('Add post response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    if (error.response?.status === 413) {
      throw new Error('File size too large. Maximum size is 5MB for images and 50MB for videos.');
    }
    console.error('Error adding post:', error.response?.data || error.message); // Debug log
    throw error.response?.data || error.message;
  }
};

export const editPost = async (id, userId, formData) => {
  try {
    // Ensure userId is included in formData
    if (!formData.has('userId')) {
      formData.append('userId', userId);
    }

    // Validate file sizes before upload
    const files = formData.getAll('imageUrls');
    const video = formData.get('videoUrl');
    
    if (files.length > 0) {
      for (const file of files) {
        if (file instanceof File && file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('Image file size exceeds 5MB limit');
        }
      }
    }
    
    if (video instanceof File && video.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('Video file size exceeds 50MB limit');
    }

    // Set appropriate content type for multipart form data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add upload progress tracking
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Upload progress:', percentCompleted);
      },
    };

    // Log the formData contents for debugging
    console.log('Edit post formData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }

    const response = await api.put(`/auth/posts/${id}`, formData, config);
    console.log('Edit post response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    if (error.response?.status === 413) {
      throw new Error('File size too large. Maximum size is 5MB for images and 50MB for videos.');
    }
    console.error('Error editing post:', error.response?.data || error.message); // Debug log
    throw error.response?.data || error.message;
  }
};

export const deletePost = async (id, userId) => {
  try {
    await api.delete(`/auth/posts/${id}?userId=${userId}`);
  } catch (error) {
    console.error('Error deleting post:', error.response?.data || error.message); // Debug log
    throw error.response?.data || error.message;
  }
};

// Interactivity-related functions
export const toggleLike = async (postId) => {
  try {
    const response = await api.post(`/interactivity/likes/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getLikeCount = async (postId) => {
  try {
    const response = await api.get(`/interactivity/likes/${postId}/count`);
    return response.data.count;
  } catch (error) {
    console.error('Error getting like count:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const hasUserLiked = async (postId) => {
  try {
    const response = await api.get(`/interactivity/likes/${postId}/status`);
    return response.data.hasLiked;
  } catch (error) {
    console.error('Error checking like status:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getComments = async (postId) => {
  try {
    const response = await api.get(`/interactivity/comments/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting comments:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const addComment = async (postId, content) => {
  try {
    const response = await api.post(`/interactivity/comments/${postId}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const updateComment = async (commentId, content) => {
  try {
    const response = await api.put(`/interactivity/comments/${commentId}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const deleteComment = async (commentId) => {
  try {
    await api.delete(`/interactivity/comments/${commentId}`);
  } catch (error) {
    console.error('Error deleting comment:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getNotifications = async () => {
  try {
    const response = await api.get('/interactivity/notifications');
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.put(`/interactivity/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    await api.put('/interactivity/notifications/read-all');
  } catch (error) {
    console.error('Error marking all notifications as read:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export default api;
