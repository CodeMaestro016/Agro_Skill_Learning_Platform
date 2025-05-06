import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentUserProfile, getUserProfile, getAllPosts, deletePost, addPost, editPost } from '../services/api';
import NavBar from '../components/NavBar';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Post form states
  const [postForm, setPostForm] = useState({
    content: '',
    caption: '',
    imageUrls: [],
    videoUrl: ''
  });

  // Preview states
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Add state to control how many posts are shown
  const [showAllPosts, setShowAllPosts] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let userData;
        
        if (!userId) {
          userData = await getCurrentUserProfile();
        } else {
          userData = await getUserProfile(userId);
        }
        
        setProfileUser(userData);
        
        // Fetch user's posts
        const posts = await getAllPosts(userData.id);
        setUserPosts(posts);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPostForm(prev => ({ ...prev, imageUrls: validFiles }));
    setPreviewImages(previewUrls);
    setError(null); // Clear any previous errors
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        e.target.value = '';
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size exceeds 50MB limit');
        e.target.value = '';
        return;
      }

      // Create a video element to check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Convert duration to seconds
        const durationInSeconds = video.duration;
        
        if (durationInSeconds > 30) {
          setError('Video duration must not exceed 30 seconds');
          e.target.value = '';
          return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setPostForm(prev => ({ ...prev, videoUrl: file }));
        setPreviewVideo(previewUrl);
        setError(null); // Clear any previous errors
      };
      
      video.onerror = () => {
        setError('Error loading video. Please try another file.');
        e.target.value = '';
      };
      
      // Set the video source to the selected file
      video.src = URL.createObjectURL(file);
    }
  };

  const handleRemoveImage = (index) => {
    setPostForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = () => {
    setPostForm(prev => ({ ...prev, videoUrl: null }));
    setPreviewVideo(null);
  };

  const handleDeletePost = async (postId) => {
    try {
      setIsDeleting(true);
      await deletePost(postId, currentUser.id);
      setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setShowDeleteModal(false);
      setSelectedPost(null);
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    // Initialize form with existing data
    setPostForm({
      content: post.content || '',
      caption: post.caption || '',
      imageUrls: [], // Start with empty array for new images
      videoUrl: post.videoUrl || ''
    });
    // If there are existing images, set them as preview URLs
    if (post.imageUrls && post.imageUrls.length > 0) {
      setPreviewImages(post.imageUrls);
    } else {
      setPreviewImages([]);
    }
    // If there's an existing video, set it as preview URL
    if (post.videoUrl) {
      setPreviewVideo(post.videoUrl);
    } else {
      setPreviewVideo(null);
    }
    setShowEditModal(true);
  };

  const handleCreatePost = () => {
    setPostForm({
      content: '',
      caption: '',
      imageUrls: [],
      videoUrl: ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const hasContent = postForm.content.trim().length > 0;
      const hasImages = postForm.imageUrls.length > 0;
      const hasVideo = postForm.videoUrl !== null && postForm.videoUrl !== '';

      // Check if at least one type of content is provided
      if (!hasContent && !hasImages && !hasVideo) {
        setError('Please add either text content, images, or a video');
        return;
      }

      // Check if only one type of content is provided
      const contentTypes = [hasContent, hasImages, hasVideo].filter(Boolean);
      if (contentTypes.length > 1) {
        setError('Please add only one type of content: text, images, or video');
        return;
      }

      const formData = new FormData();
      formData.append('userId', currentUser.id);
      
      // Only append one type of content
      if (hasContent) {
        formData.append('content', postForm.content.trim());
      } else if (hasImages) {
        // Handle images for edit mode
        if (showEditModal && selectedPost) {
          // If we have new images, use them
          if (postForm.imageUrls.length > 0) {
            postForm.imageUrls.forEach((image) => {
              if (image instanceof File) {
                formData.append('imageUrls', image);
              }
            });
          } else {
            // If no new images, keep the existing ones
            selectedPost.imageUrls.forEach(url => {
              formData.append('imageUrls', url);
            });
          }
        } else {
          // For new posts, just append the new images
          postForm.imageUrls.forEach((image) => {
            if (image instanceof File) {
              formData.append('imageUrls', image);
            }
          });
        }
      }
      
      // Handle video separately
      if (hasVideo) {
        if (postForm.videoUrl instanceof File) {
          formData.append('videoUrl', postForm.videoUrl);
        } else if (showEditModal && selectedPost && selectedPost.videoUrl) {
          formData.append('videoUrl', selectedPost.videoUrl);
        }
      }
      
      // Always append caption if it exists
      if (postForm.caption.trim()) {
        formData.append('caption', postForm.caption.trim());
      }

      // Log formData contents for debugging
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      let response;
      if (showEditModal && selectedPost) {
        response = await editPost(selectedPost.id, currentUser.id, formData);
        setUserPosts(prevPosts => prevPosts.map(post => 
          post.id === selectedPost.id ? response : post
        ));
        setShowEditModal(false);
      } else {
        response = await addPost(formData);
        setUserPosts(prevPosts => [response, ...prevPosts]);
        setShowCreateModal(false);
      }
      
      // Reset form and previews
      setPostForm({
        content: '',
        caption: '',
        imageUrls: [],
        videoUrl: ''
      });
      setPreviewImages([]);
      setPreviewVideo(null);
      setSelectedPost(null);
    } catch (err) {
      setError(err.message || 'Failed to save post');
      console.error('Error submitting post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CreateEditModal = ({ isOpen, onClose, mode }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
      caption: '',
      content: '',
      imageUrls: [],
      videoUrl: ''
    });

    const [previewImages, setPreviewImages] = useState([]);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (isOpen) {
        if (mode === 'edit' && selectedPost) {
          setFormData({
            caption: selectedPost.caption || '',
            content: selectedPost.content || '',
            imageUrls: selectedPost.imageUrls || [],
            videoUrl: selectedPost.videoUrl || ''
          });
          setPreviewImages(selectedPost.imageUrls || []);
          setPreviewVideo(selectedPost.videoUrl || null);
        } else {
          setFormData({
            caption: '',
            content: '',
            imageUrls: [],
            videoUrl: ''
          });
          setPreviewImages([]);
          setPreviewVideo(null);
        }
      }
    }, [isOpen, mode, selectedPost?.id]);

    const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        setError('Maximum 3 images allowed');
        return;
      }

      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      });

      const previewUrls = validFiles.map(file => URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrls: validFiles }));
      setPreviewImages(previewUrls);
      setError(null);
    };

    const handleVideoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('video/')) {
          setError('Please select a valid video file');
          e.target.value = '';
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          setError('Video file size exceeds 50MB limit');
          e.target.value = '';
          return;
        }

        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            setError('Video duration must not exceed 30 seconds');
            e.target.value = '';
            return;
          }
          
          const previewUrl = URL.createObjectURL(file);
          setFormData(prev => ({ ...prev, videoUrl: file }));
          setPreviewVideo(previewUrl);
          setError(null);
        };
        
        video.onerror = () => {
          setError('Error loading video. Please try another file.');
          e.target.value = '';
        };
        
        video.src = URL.createObjectURL(file);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setIsSubmitting(true);
        setError(null);

        const hasContent = formData.content.trim().length > 0;
        const hasImages = formData.imageUrls && formData.imageUrls.length > 0;
        const hasVideo = formData.videoUrl !== null && formData.videoUrl !== '';

        // Check if at least one type of content is provided
        if (!hasContent && !hasImages && !hasVideo) {
          setError('Please add either text content, images, or a video');
          return;
        }

        // Check if only one type of content is provided
        const contentTypes = [hasContent, hasImages, hasVideo].filter(Boolean);
        if (contentTypes.length > 1) {
          setError('Please add only one type of content: text, images, or video');
          return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('userId', currentUser.id);
        
        // Only append one type of content
        if (hasContent) {
          formDataToSubmit.append('content', formData.content.trim());
        } else if (hasImages) {
          // Convert imageUrls to a proper list format
          const imageUrlsList = formData.imageUrls.map(image => {
            if (image instanceof File) {
              return image;
            }
            return image;
          });
          
          // Append each image with a unique key
          imageUrlsList.forEach((image, index) => {
            formDataToSubmit.append('imageUrls', image);
          });
        } else if (hasVideo) {
          // Handle video for both create and edit modes
          if (formData.videoUrl instanceof File) {
            formDataToSubmit.append('videoUrl', formData.videoUrl);
          } else if (mode === 'edit' && selectedPost && selectedPost.videoUrl) {
            formDataToSubmit.append('videoUrl', selectedPost.videoUrl);
          }
        }
        
        if (formData.caption.trim()) {
          formDataToSubmit.append('caption', formData.caption.trim());
        }

        // Log formData contents for debugging
        console.log('FormData contents:');
        for (let pair of formDataToSubmit.entries()) {
          console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        let response;
        if (mode === 'edit' && selectedPost) {
          response = await editPost(selectedPost.id, currentUser.id, formDataToSubmit);
          setUserPosts(prevPosts => prevPosts.map(post => 
            post.id === selectedPost.id ? response : post
          ));
        } else {
          response = await addPost(formDataToSubmit);
          setUserPosts(prevPosts => [response, ...prevPosts]);
        }
        
        setFormData({
          caption: '',
          content: '',
          imageUrls: [],
          videoUrl: ''
        });
        setPreviewImages([]);
        setPreviewVideo(null);
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to save post');
        console.error('Error submitting post:', err);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            {mode === 'create' ? 'Create New Post' : 'Edit Post'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Caption</label>
                <input
                  type="text"
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a caption..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Write something..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Images (up to 3)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
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
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              imageUrls: prev.imageUrls.filter((_, i) => i !== index)
                            }));
                            setPreviewImages(prev => prev.filter((_, i) => i !== index));
                          }}
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
                <label className="block text-sm font-medium text-gray-700">Video (max 30s)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="mt-1 block w-full"
                />
                {previewVideo && (
                  <div className="mt-2 relative">
                    <video
                      src={previewVideo}
                      controls
                      className="w-full rounded max-h-[250px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, videoUrl: '' }));
                        setPreviewVideo(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = ({ isOpen, onClose, postId }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Delete Post</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeletePost(postId)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p>{error}</p>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  const isOwnProfile = !userId || userId === currentUser?.id;

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Photo */}
          <div className="h-48 bg-gray-200 relative">
            {profileUser?.coverPhoto && (
              <img
                src={profileUser.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Section */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative -mt-16">
                  {profileUser?.profilePhoto ? (
                    <img
                      src={profileUser.profilePhoto}
                      alt={profileUser.firstName}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-500">
                        {profileUser?.firstName ? profileUser.firstName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser?.firstName} {profileUser?.lastName}
                  </h1>
                  <p className="text-gray-600">{profileUser?.email}</p>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/update-profile')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* About Section */}
            {profileUser?.about && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600">{profileUser.about}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {profileUser?.email}
                  </p>
                  {profileUser?.phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span> {profileUser.phone}
                    </p>
                  )}
                </div>
                {profileUser?.location && (
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {profileUser.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Posts Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
                {isOwnProfile && (
                  <button
                    onClick={handleCreatePost}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Create New Post
                  </button>
                )}
              </div>

              {userPosts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No posts yet</p>
              ) : (
                <>
                  <div className="space-y-6">
                    {(showAllPosts ? userPosts : userPosts.slice(0, 2)).map((post) => (
                      <div
                        key={`profile-post-${post.id}-${post.createdAt}`}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {profileUser?.profilePhoto ? (
                              <img
                                src={profileUser.profilePhoto}
                                alt={profileUser.firstName}
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
                                <span className="text-gray-500 text-lg font-bold">
                                  {profileUser?.firstName ? profileUser.firstName.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {profileUser?.firstName} {profileUser?.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(post.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded transition-colors duration-150"
                                disabled={isSubmitting}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPost(post);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded transition-colors duration-150"
                                disabled={isDeleting}
                              >
                                Delete
                              </button>
                            </div>
                          )}
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
                                key={`profile-post-${post.id}-image-${index}-${url}`}
                                src={url}
                                alt={`Post image ${index + 1}`}
                                className="w-full h-52 object-cover rounded-xl border border-gray-200"
                              />
                            ))}
                          </div>
                        )}

                        {post.videoUrl && (
                          <div className="mb-3">
                            <video
                              key={`profile-post-${post.id}-video-${post.videoUrl}`}
                              controls
                              className="w-full rounded-xl border border-gray-200 max-h-[300px] object-contain"
                              src={post.videoUrl}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!showAllPosts && userPosts.length > 2 && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setShowAllPosts(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        See More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEditModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPostForm({
            content: '',
            caption: '',
            imageUrls: [],
            videoUrl: ''
          });
          setPreviewImages([]);
          setPreviewVideo(null);
        }}
        mode="create"
      />
      <CreateEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPost(null);
          setPostForm({
            content: '',
            caption: '',
            imageUrls: [],
            videoUrl: ''
          });
          setPreviewImages([]);
          setPreviewVideo(null);
        }}
        mode="edit"
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPost(null);
        }}
        postId={selectedPost?.id}
      />
      <NavBar />
    </div>
  );
};

export default Profile; 