import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { useNavigate } from 'react-router-dom';

const Post = () => {
  const { user } = useAuth();
  const { posts, loading, error: postError, addPost, editPost, deletePost, fetchPosts } = usePost();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [newPostVideo, setNewPostVideo] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [editedImages, setEditedImages] = useState([]);
  const [editedVideo, setEditedVideo] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e, isEditing = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    // Convert files to base64 strings
    const processFiles = async () => {
      const base64Promises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const base64Strings = await Promise.all(base64Promises);
        
        if (isEditing) {
          setEditedImages(files);
          setPreviewImages(base64Strings);
        } else {
          setNewPostImages(files);
          setPreviewImages(base64Strings);
        }
      } catch (error) {
        console.error('Error processing images:', error);
        setError('Failed to process images. Please try again.');
      }
    };

    processFiles();
  };

  const handleVideoChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      // Create a video element to check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Convert duration to seconds
        const durationInSeconds = video.duration;
        
        if (durationInSeconds > 30) {
          alert('Video duration must not exceed 30 seconds');
          // Clear the file input
          e.target.value = '';
          return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        if (isEditing) {
          setEditedVideo(file);
          setPreviewVideo(previewUrl);
        } else {
          setNewPostVideo(file);
          setPreviewVideo(previewUrl);
        }
      };
      
      video.onerror = () => {
        alert('Error loading video. Please try another file.');
        e.target.value = '';
      };
      
      // Set the video source to the selected file
      video.src = URL.createObjectURL(file);
    }
  };

  const handleRemoveImage = (index, isEditing = false) => {
    if (isEditing) {
      setEditedImages(prev => prev.filter((_, i) => i !== index));
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewPostImages(prev => prev.filter((_, i) => i !== index));
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleRemoveVideo = (isEditing = false) => {
    if (isEditing) {
      setEditedVideo(null);
      setPreviewVideo(null);
    } else {
      setNewPostVideo(null);
      setPreviewVideo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('caption', newPostCaption);

      // Check which type of content is being submitted
      const hasContent = newPostContent.trim().length > 0;
      const hasImages = newPostImages.length > 0;
      const hasVideo = newPostVideo !== null;

      // Count how many types of content are present
      let contentCount = 0;
      if (hasContent) contentCount++;
      if (hasImages) contentCount++;
      if (hasVideo) contentCount++;

      if (contentCount === 0) {
        throw new Error('Please add either text content, images, or a video');
      }

      if (contentCount > 1) {
        throw new Error('Please add only one type of content: text, images, or video');
      }

      // Add the selected content type
      if (hasContent) {
        formData.append('content', newPostContent);
      }

      // Handle image uploads
      if (hasImages) {
        // Convert files to base64 strings
        const base64Promises = newPostImages.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        const base64Strings = await Promise.all(base64Promises);
        formData.append('imageUrls', JSON.stringify(base64Strings));
      }

      // Handle video upload
      if (hasVideo) {
        formData.append('video', newPostVideo);
      }

      if (editingPostId) {
        await editPost(editingPostId, formData);
      } else {
        await addPost(formData);
      }

      // Reset form
      setNewPostContent('');
      setNewPostCaption('');
      setNewPostImages([]);
      setNewPostVideo(null);
      setPreviewImages([]);
      setPreviewVideo(null);
      setEditingPostId(null);

      // Refresh posts
      fetchPosts();
    } catch (err) {
      setError(err.message || 'Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPost = (id, content, caption, imageUrls, videoUrl) => {
    if (!id) {
      console.error('Post ID is required for editing');
      return;
    }
    setEditingPostId(id);
    setEditedContent(content || '');
    setEditedCaption(caption || '');
    setEditedImages([]);
    setEditedVideo(null);
    setPreviewImages(imageUrls || []);
    setPreviewVideo(videoUrl || null);
  };

  const handleSaveEdit = async (id) => {
    if (!id) {
      console.error('Post ID is required for saving edits');
      return;
    }

    const hasContent = editedContent.trim().length > 0;
    const hasImages = editedImages.length > 0 || previewImages.length > 0;
    const hasVideo = editedVideo !== null || previewVideo !== null;

    if (!hasContent && !hasImages && !hasVideo) {
      alert('Please add either text content, images, or a video');
      return;
    }

    if ((hasContent && hasImages) || (hasContent && hasVideo) || (hasImages && hasVideo)) {
      alert('Please add only one type of content: text, images, or video');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      if (hasContent) {
        formData.append('content', editedContent);
      }
      if (editedCaption.trim()) {
        formData.append('caption', editedCaption);
      }
      if (hasImages) {
        editedImages.forEach((image) => {
          formData.append('images', image);
        });
      }
      if (hasVideo) {
        formData.append('video', editedVideo);
      }

      await editPost(id, formData);
      setEditingPostId(null);
      setEditedContent('');
      setEditedCaption('');
      setEditedImages([]);
      setEditedVideo(null);
      setPreviewImages([]);
      setPreviewVideo(null);
    } catch (error) {
      console.error('Failed to edit post:', error);
      alert('Failed to edit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedContent('');
    setEditedCaption('');
    setEditedImages([]);
    setEditedVideo(null);
    setPreviewImages([]);
    setPreviewVideo(null);
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
    try {
      await deletePost(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (postError) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-500 text-center mb-4">Error: {postError}</p>
            <button
              onClick={fetchPosts}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Your Posts</h1>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>

          {/* Error Display */}
          {(error || postError) && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error || postError}
            </div>
          )}

          {/* Add Post Section */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a caption..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content 
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write something..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Images (up to 3)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageChange(e)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {previewImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {previewImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoChange(e)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {previewVideo && (
                  <div className="mt-2 relative">
                    <video
                      src={previewVideo}
                      controls
                      className="w-full rounded"
                    />
                    <button
                      onClick={() => handleRemoveVideo()}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSubmitting ? 'Posting...' : 'Create Post'}
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts yet. Create your first post!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    {post.userImageUrl ? (
                      <img
                        src={post.userImageUrl}
                        alt={post.userName}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{post.userName || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Edit caption..."
                      />
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Images
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, true)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        {previewImages.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {previewImages.map((url, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => handleRemoveImage(index, true)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  title="Remove image"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Video
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoChange(e, true)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        {previewVideo && (
                          <div className="mt-2 relative">
                            <video
                              src={previewVideo}
                              controls
                              className="w-full rounded"
                            />
                            <button
                              onClick={() => handleRemoveVideo(true)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove video"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          disabled={isSubmitting}
                          className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {post.caption && (
                        <p className="text-gray-800 font-medium mb-2">{post.caption}</p>
                      )}
                      {post.content && (
                        <p className="text-gray-600 mb-4">{post.content}</p>
                      )}
                      {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {post.imageUrls.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      {post.videoUrl && (
                        <div className="mt-4 relative">
                          <video
                            src={post.videoUrl}
                            controls
                            className="w-full rounded"
                          />
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditPost(post.id, post.content, post.caption, post.imageUrls, post.videoUrl)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post; 