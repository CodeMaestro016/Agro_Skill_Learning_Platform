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

// Create a new learning plan
export const createLearningPlan = async (planData) => {
  try {
    const response = await api.post('/auth/learning-plan', planData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Fetch all learning plans for a user
export const getLearningPlans = async (userId) => {
  try {
    const response = await api.get('/auth/learning-plan', {
      params: { userId },
    });
    return response.data; // Return the list of learning plans
  } catch (error) {
    throw handleApiError(error);
  }
};

// Fetch a single learning plan by ID for a user
export const getLearningPlanById = async (id, userId) => {
  try {
    const response = await api.get(`/auth/learning-plan/${id}`, {
      params: { userId },
    });
    return response.data; // Return the specific learning plan
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update a learning plan
export const updateLearningPlan = async (id, userId, planData) => {
  try {
    const response = await api.put(`/auth/learning-plan/${id}`, planData, {
      params: { userId },
    });
    return response.data; // Return the updated learning plan
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete a learning plan
export const deleteLearningPlan = async (id, userId) => {
  try {
    const response = await api.delete(`/auth/learning-plan/${id}`, {
      params: { userId },
    });
    return response.data; // Return a success message or status
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update step status
export const updateStepStatus = async (planId, stepIndex, userId, status) => {
  try {
    const response = await api.put(
      `/auth/learning-plan/${planId}/steps/${stepIndex}`,
      { status },
      { params: { userId } }
    );
    return response.data; // Return the updated learning plan
  } catch (error) {
    throw handleApiError(error);
  }
};



// Save post functions
export const savePost = async (postId) => {
  try {
    console.log('Saving post:', postId);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    const userId = JSON.parse(localStorage.getItem('user')).id;
    const response = await api.post(`/auth/posts/${postId}/save?userId=${userId}`, null, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Save post response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving post:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const unsavePost = async (postId) => {
  try {
    console.log('Unsaving post:', postId);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    const userId = JSON.parse(localStorage.getItem('user')).id;
    const response = await api.delete(`/auth/posts/${postId}/save?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Unsave post response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error unsaving post:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getSavedPosts = async () => {
  try {
    console.log('Fetching saved posts...');
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    const userId = JSON.parse(localStorage.getItem('user')).id;
    const response = await api.get(`/auth/posts/saved?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Saved posts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching saved posts:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};




export default api;
