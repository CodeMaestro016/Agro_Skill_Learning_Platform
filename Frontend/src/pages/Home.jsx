import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getFeed, savePost, unsavePost, getSavedPosts, getLikedPosts, addComment, getComments, updateComment, deleteComment, toggleCommentLike, getCommentReplies } from '../services/api';
import NavBar from '../components/NavBar';
import NotificationCenter from '../components/NotificationCenter';
import LikeButton from '../components/LikeButton';
import CommentItem from '../components/CommentItem';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Feed state
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const observer = useRef();

  // Load saved posts and liked posts
  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        console.log('Loading user interactions...');
        // Load saved posts
        const savedData = await getSavedPosts();
        console.log('Saved posts data:', savedData);
        const savedIds = new Set((Array.isArray(savedData) ? savedData : (savedData.content || [])).map(post => post.id));
        console.log('Saved post IDs:', Array.from(savedIds));
        setSavedPostIds(savedIds);

        // Load liked posts
        const likedData = await getLikedPosts();
        console.log('Liked posts data:', likedData);
        const likedIds = new Set((Array.isArray(likedData) ? likedData : (likedData.content || [])).map(post => post.id));
        console.log('Liked post IDs:', Array.from(likedIds));
        setLikedPostIds(likedIds);
      } catch (error) {
        console.error('Error loading user interactions:', error);
        if (error.message === 'Authentication required') {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    if (user) {
      loadUserInteractions();
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

  const handleAddComment = async (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const text = commentText[postId];
    if (!text?.trim()) return;

    try {
      const newComment = await addComment(postId, text);
      // Add user information to the new comment
      const commentWithUserInfo = {
        ...newComment,
        userName: user.firstName + ' ' + user.lastName,
        userProfilePhoto: user.profilePhoto,
        userId: user.id
      };
      
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), commentWithUserInfo]
      }));
      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await getComments(postId);
      setComments(prev => ({
        ...prev,
        [postId]: data
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Load comments when a post is rendered
  useEffect(() => {
    const loadCommentsForPosts = async () => {
      const postsWithoutComments = feed.filter(post => !comments[post.id]);
      if (postsWithoutComments.length > 0) {
        try {
          await Promise.all(
            postsWithoutComments.map(async (post) => {
              const data = await getComments(post.id);
              setComments(prev => ({
                ...prev,
                [post.id]: data
              }));
            })
          );
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }
    };

    loadCommentsForPosts();
  }, [feed]);

  const handleUpdateComment = async (postId, commentId, newText) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const updatedComment = await updateComment(commentId, newText);
      
      // Update the comment in the state, handling both root comments and replies
      setComments(prev => {
        const newComments = { ...prev };
        if (newComments[postId]) {
          newComments[postId] = newComments[postId].map(comment => {
            // If this is the comment being updated
            if (comment.id === commentId) {
              return {
                ...comment,
                content: newText,
                userName: comment.userName,
                userProfilePhoto: comment.userProfilePhoto,
                replies: comment.replies // Preserve existing replies
              };
            }
            // If this comment has replies, check if any reply needs updating
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === commentId
                    ? {
                        ...reply,
                        content: newText,
                        userName: reply.userName,
                        userProfilePhoto: reply.userProfilePhoto
                      }
                    : reply
                )
              };
            }
            return comment;
          });
        }
        return newComments;
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await deleteComment(commentId);
      
      // Update the state, handling both root comments and replies
      setComments(prev => {
        const newComments = { ...prev };
        if (newComments[postId]) {
          // First, try to find and remove the comment from replies
          newComments[postId] = newComments[postId].map(comment => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== commentId)
              };
            }
            return comment;
          });
          
          // Then, remove the comment if it's a root comment
          newComments[postId] = newComments[postId].filter(comment => comment.id !== commentId);
        }
        return newComments;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const startEditingComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleCommentLike = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const updatedComment = await toggleCommentLike(commentId);
      
      // Update the comment in the state
      setComments(prev => {
        const newComments = { ...prev };
        Object.keys(newComments).forEach(postId => {
          newComments[postId] = newComments[postId].map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                ...updatedComment,
                userName: comment.userName,
                userProfilePhoto: comment.userProfilePhoto
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        ...updatedComment,
                        userName: reply.userName,
                        userProfilePhoto: reply.userProfilePhoto
                      }
                    : reply
                )
              };
            }
            return comment;
          });
        });
        return newComments;
      });
    } catch (error) {
      console.error('Error toggling comment like:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleAddReply = async (postId, parentCommentId, content) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // First, add the reply to the backend
      const newReply = await addComment(postId, content, parentCommentId);
      
      // Add user information to the new reply
      const replyWithUserInfo = {
        ...newReply,
        userName: user.firstName + ' ' + user.lastName,
        userProfilePhoto: user.profilePhoto,
        userId: user.id
      };

      // Update the comments state with the new reply
      setComments(prev => {
        const newComments = { ...prev };
        if (newComments[postId]) {
          newComments[postId] = newComments[postId].map(comment => {
            if (comment.id === parentCommentId) {
              // Create a new array with the existing replies plus the new reply
              const updatedReplies = [...(comment.replies || []), replyWithUserInfo];
              return {
                ...comment,
                replies: updatedReplies
              };
            }
            return comment;
          });
        }
        return newComments;
      });

      // Instead of fetching all comments again, just fetch the updated replies for this comment
      const updatedReplies = await getCommentReplies(parentCommentId);
      
      // Update only the replies for this specific comment
      setComments(prev => {
        const newComments = { ...prev };
        if (newComments[postId]) {
          newComments[postId] = newComments[postId].map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: updatedReplies.map(reply => ({
                  ...reply,
                  userName: reply.userName || user.firstName + ' ' + user.lastName,
                  userProfilePhoto: reply.userProfilePhoto || user.profilePhoto
                }))
              };
            }
            return comment;
          });
        }
        return newComments;
      });

    } catch (error) {
      console.error('Error adding reply:', error);
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const renderComments = (postId, postComments, post) => {
    return (
      <div className="mt-4 space-y-4">
        {postComments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={handleCommentLike}
            onReply={(parentCommentId, content) => handleAddReply(postId, parentCommentId, content)}
            onEdit={(commentId, newText) => handleUpdateComment(postId, commentId, newText)}
            onDelete={(commentId) => handleDeleteComment(postId, commentId)}
            canEdit={user?.id === comment.userId}
            canDelete={user?.id === comment.userId || user?.id === post.userId}
            currentUser={user}
          />
        ))}
      </div>
    );
  };

  // Update feed posts with like status
  useEffect(() => {
    if (feed.length > 0) {
      setFeed(prevFeed => 
        prevFeed.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id)
        }))
      );
    }
  }, [likedPostIds]);

  const toggleComments = (postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const renderPost = (post, index) => {
    const isLastElement = index === feed.length - 1;
    const isSaved = savedPostIds.has(post.id);
    const postComments = comments[post.id] || [];
    const isCommentsExpanded = expandedComments.has(post.id);
    
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

        {/* Like and Comment Section */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-4 mb-4">
            <LikeButton postId={post.id} initialLikeCount={post.likeCount || 0} />
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm font-medium">{postComments.length}</span>
            </button>
          </div>

          {/* Comments Section */}
          {isCommentsExpanded && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Write a comment..."
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Comment
                </button>
              </div>
              {renderComments(post.id, postComments, post)}
            </div>
          )}
        </div>
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
    <div className="min-h-screen bg-gray-100 pt-16 relative">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2">
          {/* Feed Section */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-6 relative">
            
            {/* Notification Center inside feed, top-right */}
            <div className="absolute top-6 right-2 z-50">
              <div className="w-20">
                <NotificationCenter />
              </div>
            </div>
  
            {/* Feed Posts */}
            <div className="mt-20"> {/* adds space below the NotificationCenter */}
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
      </div>
  
      <NavBar />
    </div>
  );
  
  
  
};

export default Home;

