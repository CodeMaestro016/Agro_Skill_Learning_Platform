import {
    toggleLike,
    getLikeCount,
    hasUserLiked,
    getComments,
    addComment,
    updateComment,
    deleteComment,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleCommentLike,
    getCommentReplies
  } from './api';
  
  const API_URL = 'http://localhost:8081/api/interactivity';
  
  const getAuthHeader = () => {
      const token = localStorage.getItem('token');
      return {
          headers: {
              Authorization: `Bearer ${token}`
          }
      };
  };
  
  export const interactivityService = {
      // Like-related functions
      toggleLike: async (postId) => {
          try {
              return await toggleLike(postId);
          } catch (error) {
              throw new Error(error.message || 'Failed to toggle like');
          }
      },
  
      getLikeCount: async (postId) => {
          try {
              return await getLikeCount(postId);
          } catch (error) {
              throw new Error(error.message || 'Failed to get like count');
          }
      },
  
      hasUserLiked: async (postId) => {
          try {
              return await hasUserLiked(postId);
          } catch (error) {
              throw new Error(error.message || 'Failed to check like status');
          }
      },
  
      // Comment-related functions
      getComments: async (postId) => {
          try {
              return await getComments(postId);
          } catch (error) {
              throw new Error(error.message || 'Failed to get comments');
          }
      },
  
      addComment: async (postId, content, parentCommentId = null) => {
          try {
              return await addComment(postId, content, parentCommentId);
          } catch (error) {
              throw new Error(error.message || 'Failed to add comment');
          }
      },
  
      updateComment: async (commentId, content) => {
          try {
              return await updateComment(commentId, content);
          } catch (error) {
              throw new Error(error.message || 'Failed to update comment');
          }
      },
  
      deleteComment: async (commentId) => {
          try {
              return await deleteComment(commentId);
          } catch (error) {
              throw new Error(error.message || 'Failed to delete comment');
          }
      },
  
      toggleCommentLike: async (commentId) => {
          try {
              return await toggleCommentLike(commentId);
          } catch (error) {
              throw new Error(error.message || 'Failed to toggle comment like');
          }
      },
  
      getCommentReplies: async (commentId) => {
          try {
              return await getCommentReplies(commentId);
          } catch (error) {
              throw new Error(error.message || 'Failed to get comment replies');
          }
      },
  
      // Notification-related functions
      getNotifications: async () => {
          try {
              return await getNotifications();
          } catch (error) {
              throw new Error(error.message || 'Failed to get notifications');
          }
      },
  
      markNotificationAsRead: async (notificationId) => {
          try {
              return await markNotificationAsRead(notificationId);
          } catch (error) {
              throw new Error(error.message || 'Failed to mark notification as read');
          }
      },
  
      markAllNotificationsAsRead: async () => {
          try {
              return await markAllNotificationsAsRead();
          } catch (error) {
              throw new Error(error.message || 'Failed to mark all notifications as read');
          }
      }
  }; 