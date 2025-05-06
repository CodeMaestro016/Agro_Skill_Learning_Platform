import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { searchUsers, getFeed } from '../services/api';
import NavBar from '../components/NavBar';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const data = await searchUsers(searchQuery);
      console.log('Search results:', data);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      console.error('Error details:', error.response?.data);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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

  const renderPost = (post, index) => {
    const isLastElement = index === feed.length - 1;
    return (
      <div 
        key={`home-post-${post.id}-${post.createdAt}-${index}`} 
        ref={isLastElement ? lastPostElementRef : null}
        className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
      >
        <div className="flex items-center mb-4 gap-3">
          {post.userImageUrl ? (
            <img
              src={post.userImageUrl}
              alt={post.userName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
              <span className="text-gray-500 text-lg font-bold">
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div>
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
              <img
                key={`home-post-${post.id}-image-${index}-${url}`}
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-52 object-cover rounded-xl border border-gray-200"
                loading="lazy"
              />
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

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Search Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Users</h2>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </form>

            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Results</h2>
                {searchResults.map((result) => (
                  <div
                    key={`home-search-${result.id}-${result.email}`}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={result.profilePhoto || result.imageUrl || 'https://via.placeholder.com/40'}
                        alt={result.firstName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">
                          {result.firstName} {result.lastName}
                        </h3>
                        <p className="text-gray-600">{result.email}</p>
                        {result.about && (
                          <p className="text-sm text-gray-500 mt-1">{result.about}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <p className="text-center text-gray-500 py-4">No users found</p>
            )}
          </div>

          {/* Feed Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Feed</h2>
            {feed.map((post, index) => renderPost(post, index))}
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
