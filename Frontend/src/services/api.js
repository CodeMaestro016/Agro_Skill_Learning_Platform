import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout for large file uploads
  timeout: 300000, // 5 minutes
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return {
      user: {
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        imageUrl: response.data.imageUrl,
      },
      token: response.data.token,
    };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
    });
    
    // After successful registration, login the user
    const loginResponse = await login(userData.email, userData.password);
    return loginResponse;
  } catch (error) {
    throw error.response?.data || error.message;
  }
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
    console.log('Feed response:', response.data); // Debug log
    
    // Process the feed data to ensure user information is properly formatted
    const processedData = {
      ...response.data,
      content: response.data.content.map(post => ({
        ...post,
        userName: post.userName || 'Unknown User',
        userImageUrl: post.userImageUrl || null,
        createdAt: new Date(post.createdAt).toISOString(),
      })),
    };
    
    return processedData;
  } catch (error) {
    console.error('Error fetching feed:', error.response?.data || error.message); // Debug log
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
        if (file.size > 100 * 1024 * 1024) { // 100MB
          throw new Error('Image file size exceeds 100MB limit');
        }
      }
    }
    
    if (video && video.size > 100 * 1024 * 1024) { // 100MB
      throw new Error('Video file size exceeds 100MB limit');
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

    const response = await api.post('/auth/posts', formData, config);
    console.log('Add post response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    if (error.response?.status === 413) {
      throw new Error('File size too large. Maximum size is 100MB.');
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
        if (file.size > 100 * 1024 * 1024) { // 100MB
          throw new Error('Image file size exceeds 100MB limit');
        }
      }
    }
    
    if (video && video.size > 100 * 1024 * 1024) { // 100MB
      throw new Error('Video file size exceeds 100MB limit');
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
      throw new Error('File size too large. Maximum size is 100MB.');
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

export default api; 