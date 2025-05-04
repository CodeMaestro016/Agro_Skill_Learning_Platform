import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();
  const { feed, loading, error, hasMore, loadMoreFeed } = usePost();
  const navigate = useNavigate();
  const observer = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Loading...';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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

  const renderPost = (post, index) => {
    const isLastElement = index === feed.length - 1;
    
    return (
      <div 
        key={post.id} 
        ref={isLastElement ? lastPostElementRef : null}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex items-center mb-4">
          {post.userImageUrl ? (
            <img
              src={post.userImageUrl}
              alt={post.userName}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{post.userName || 'Unknown User'}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {renderPostContent(post)}
      </div>
    );
  };

  const renderPostContent = (post) => {
    return (
      <div className="space-y-4">
        {post.content && (
          <p className="text-gray-800">{post.content}</p>
        )}
        
        {post.caption && (
          <p className="text-gray-600 italic">{post.caption}</p>
        )}

        {post.videoUrl && (
          <div className="relative pt-[56.25%] w-full">
            <video
              controls
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={post.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {post.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full rounded-lg"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {fullName}!
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700">You have successfully logged in to your account.</p>
            
            <div className="mt-6">
              <button
                onClick={() => navigate('/posts')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                Go to Posts
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Feed</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {feed.map((post, index) => renderPost(post, index))}
          
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          
          {!loading && !hasMore && feed.length > 0 && (
            <div className="text-center text-gray-500 py-4">
              No more posts to load
            </div>
          )}
          
          {!loading && feed.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No posts available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
