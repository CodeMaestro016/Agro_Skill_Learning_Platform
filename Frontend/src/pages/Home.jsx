import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getFeed } from '../services/api';
import NavBar from '../components/NavBar';
import PostCard from '../components/PostCard';
import NotificationCenter from '../components/NotificationCenter';

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
            <NotificationCenter />
          </div>
          
          {/* Feed Section */}
          <div className="mt-8">
            {feed.map((post, index) => (
              <div
                key={`home-post-${post.id}-${post.createdAt}-${index}`}
                ref={index === feed.length - 1 ? lastPostElementRef : null}
              >
                <PostCard post={post} isOwnProfile={false} />
              </div>
            ))}
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
