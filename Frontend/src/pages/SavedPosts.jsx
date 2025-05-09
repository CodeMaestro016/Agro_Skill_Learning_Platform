import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSavedPosts } from '../services/api';
import NavBar from '../components/NavBar';

const SavedPosts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        console.log('Loading saved posts...');
        const data = await getSavedPosts();
        console.log('Raw saved posts data:', data);
        
        // Handle different response formats
        let posts = [];
        if (Array.isArray(data)) {
          posts = data;
        } else if (data && data.content) {
          posts = data.content;
        }
        
        console.log('Processed saved posts:', posts);
        
        // Process the saved posts data to ensure proper formatting
        const processedPosts = posts.map(post => ({
          ...post,
          userName: post.userName || 'Unknown User',
          profilePhoto: post.profilePhoto || null,
          createdAt: new Date(post.createdAt).toISOString(),
        }));
        
        console.log('Final processed posts:', processedPosts);
        setSavedPosts(processedPosts);
      } catch (error) {
        console.error('Error loading saved posts:', error);
        if (error.message === 'Authentication required') {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSavedPosts();
  }, [user, navigate]);

  const renderPost = (post) => {
    return (
      <div 
        key={`saved-post-${post.id}-${post.createdAt}`}
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
              <div key={`saved-post-${post.id}-image-${index}-${url}`} className="relative group">
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
              key={`saved-post-${post.id}-video-${post.videoUrl}`}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Posts</h1>
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map(post => renderPost(post))
            ) : (
              <p className="text-center text-gray-500 py-4">No saved posts yet</p>
            )}
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default SavedPosts; 