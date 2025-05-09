import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getFeed, savePost, unsavePost, getSavedPosts } from '../services/api';
import NavBar from '../components/NavBar';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Feed state
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const observer = useRef();

  // Load saved posts
  useEffect(() => {
    const loadSavedPosts = async () => {
      try {
        console.log('Loading saved posts...');
        const data = await getSavedPosts();
        console.log('Saved posts data:', data);
        const savedIds = new Set((Array.isArray(data) ? data : (data.content || [])).map(post => post.id));
        console.log('Saved post IDs:', Array.from(savedIds));
        setSavedPostIds(savedIds);
      } catch (error) {
        console.error('Error loading saved posts:', error);
        if (error.message === 'Authentication required') {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    if (user) {
      loadSavedPosts();
    }
  }, [user, navigate]);

  const loadFeed = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getFeed(page);
      if (data.content.length === 0) {
        setHasMore(false);
      } else {
        setFeed(prevFeed => {
          const newContent = data.content.filter(post => !prevFeed.some(existingPost => existingPost.id === post.id));
          return [...prevFeed, ...newContent];
        });
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const loadMoreFeed = useCallback(() => {
    if (!loading && hasMore) {
      loadFeed();
    }
  }, [loading, hasMore]);

  const handleSavePost = async (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      console.log('Toggling save for post:', postId);
      console.log('Current savedPostIds:', Array.from(savedPostIds));
      
      if (savedPostIds.has(postId)) {
        console.log('Unsaving post:', postId);
        await unsavePost(postId);
        setSavedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          console.log('Updated savedPostIds after unsave:', Array.from(newSet));
          return newSet;
        });
      } else {
        console.log('Saving post:', postId);
        await savePost(postId);
        setSavedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          console.log('Updated savedPostIds after save:', Array.from(newSet));
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const renderPost = (post, index) => {
    const isLastElement = index === feed.length - 1;
    const isSaved = savedPostIds.has(post.id);
    
    console.log('Rendering post:', {
      id: post.id,
      isSaved,
      savedPostIds: Array.from(savedPostIds)
    });

    return (
      <div 
        key={`home-post-${post.id}-${post.createdAt}-${index}`} 
        ref={isLastElement ? lastPostElementRef : null}
        className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
      >
        <div className="flex items-center mb-4 gap-3">
          {post.profilePhoto ? (
            <img
              src={post.profilePhoto}
              alt={post.userName || 'User'}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                console.error('Error loading profile image:', post.profilePhoto);
                e.target.onerror = null;
                e.target.src = '';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border border-gray-200">
              <span className="text-green-800 text-lg font-bold">
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{post.userName || 'Unknown User'}</p>
            <p className="text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => handleSavePost(post.id)}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isSaved ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
            }`}
            title={isSaved ? 'Unsave post' : 'Save post'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill={isSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>
        
        {post.caption && (
          <p className="text-gray-900 font-semibold mb-1 text-lg">{post.caption}</p>
        )}
        {post.content && (
          <p className="text-gray-700 mb-3 text-base">{post.content}</p>
        )}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {post.imageUrls.map((url, index) => (
              <div key={`feed-post-${post.id}-image-${index}-${url}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-contain rounded-xl border border-gray-200 hover:opacity-90 transition-opacity duration-200"
                    onError={(e) => {
                      console.error('Error loading image:', url);
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {post.videoUrl && (
          <div className="mb-3">
            <video
              key={`home-post-${post.id}-video-${post.videoUrl}`}
              controls
              className="w-full rounded-xl border border-gray-200 max-h-[300px] object-contain"
              src={post.videoUrl}
              preload="metadata"
            >
              <source src={post.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    );
  };

  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreFeed();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreFeed]);

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Feed Section */}
          <div className="mt-8">
            {feed.map((post, index) => renderPost(post, index))}
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            )}
            {!hasMore && feed.length > 0 && (
              <p className="text-center text-gray-500 py-4">No more posts to load</p>
            )}
            {!loading && feed.length === 0 && (
              <p className="text-center text-gray-500 py-4">No posts yet</p>
            )}
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Home;
