import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getFeed } from '../services/api';
import NavBar from '../components/NavBar';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Feed state
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef();

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

  const renderPost = (post, index) => {
    const isLastElement = index === feed.length - 1;
    
    // Debug logging for post data
    console.log('Rendering post:', {
      id: post.id,
      userName: post.userName,
      profilePhoto: post.profilePhoto
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
              <div key={`feed-post-${post.id}-image-${index}-${url}`} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl border border-gray-200"
                />
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          {/* Feed Section */}
          <div className="mt-4">
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
