import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAllPosts, addPost as addPostApi, editPost as editPostApi, deletePost as deletePostApi, getFeed } from '../services/api';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchFeed();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching posts for user:', user.id); // Debug log
      const data = await getAllPosts(user.id);
      console.log('Fetched posts:', data); // Debug log
      setPosts(data);
      setError(null);
    } catch (err) {
      console.error('Error in fetchPosts:', err); // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeed = async (page = 0) => {
    try {
      setLoading(true);
      const data = await getFeed(page);
      console.log('Fetched feed:', data); // Debug log
      
      if (page === 0) {
        setFeed(data.content);
      } else {
        setFeed(prev => [...prev, ...data.content]);
      }
      
      setHasMore(!data.last);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error in fetchFeed:', err); // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeed = () => {
    if (!loading && hasMore) {
      fetchFeed(currentPage + 1);
    }
  };

  const addPost = async (formData) => {
    try {
      console.log('Adding post with formData:', formData); // Debug log
      const newPost = await addPostApi(formData);
      console.log('Added post:', newPost); // Debug log
      setPosts((prevPosts) => [...prevPosts, newPost]);
      setError(null);
    } catch (err) {
      console.error('Error in addPost:', err); // Debug log
      setError(err.message);
      throw err;
    }
  };

  const editPost = async (id, formData) => {
    try {
      console.log('Editing post:', id, formData); // Debug log
      // Ensure formData is properly constructed
      if (!(formData instanceof FormData)) {
        const newFormData = new FormData();
        if (formData.content) newFormData.append('content', formData.content);
        if (formData.caption) newFormData.append('caption', formData.caption);
        if (formData.images) {
          Array.from(formData.images).forEach(image => {
            newFormData.append('images', image);
          });
        }
        if (formData.video) {
          newFormData.append('video', formData.video);
        }
        formData = newFormData;
      }
      
      const editedPost = await editPostApi(id, user.id, formData);
      console.log('Edited post:', editedPost); // Debug log
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === id ? editedPost : post))
      );
      setError(null);
    } catch (err) {
      console.error('Error in editPost:', err); // Debug log
      setError(err.message);
      throw err;
    }
  };

  const deletePost = async (id) => {
    try {
      console.log('Deleting post:', id); // Debug log
      await deletePostApi(id, user.id);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error in deletePost:', err); // Debug log
      setError(err.message);
      throw err;
    }
  };

  return (
    <PostContext.Provider value={{ 
      posts, 
      feed, 
      loading, 
      error, 
      hasMore, 
      addPost, 
      editPost, 
      deletePost, 
      fetchPosts, 
      fetchFeed, 
      loadMoreFeed 
    }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};