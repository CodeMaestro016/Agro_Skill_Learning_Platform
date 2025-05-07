import React, { useState, useEffect } from 'react';
import { interactivityService } from '../services/interactivityService';
import { FaTrash, FaEdit, FaSpinner, FaReply, FaHeart, FaRegHeart, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const CommentSection = ({ postId, postOwnerId }) => {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({});
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedComments = await interactivityService.getComments(postId);
            
            // Fetch replies for each comment
            const commentsWithReplies = await Promise.all(
                fetchedComments.map(async (comment) => {
                    const replies = await interactivityService.getCommentReplies(comment.id);
                    // Ensure user information is preserved for both comments and replies
                    return {
                        ...comment,
                        replies: replies.map(reply => ({
                            ...reply,
                            userName: reply.userName || `${currentUser.firstName} ${currentUser.lastName}`,
                            userProfilePhoto: reply.userProfilePhoto || currentUser.profilePhoto
                        }))
                    };
                })
            );
            
            setComments(commentsWithReplies);
        } catch (error) {
            console.error('Error loading comments:', error);
            setError('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            // Add user information to the new comment before adding it to state
            const comment = await interactivityService.addComment(postId, newComment);
            const commentWithUserInfo = {
                ...comment,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                userProfilePhoto: currentUser.profilePhoto
            };
            setComments(prev => [commentWithUserInfo, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            setError('Failed to add comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || isLoading || !replyingTo) return;

        setIsLoading(true);
        setError(null);
        try {
            const reply = await interactivityService.addComment(postId, replyContent, replyingTo.id);
            // Add user information to the new reply
            const replyWithUserInfo = {
                ...reply,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                userProfilePhoto: currentUser.profilePhoto
            };
            
            // Fetch the updated replies for the parent comment
            const updatedReplies = await interactivityService.getCommentReplies(replyingTo.id);
            
            setComments(prev => prev.map(comment => {
                if (comment.id === replyingTo.id) {
                    return {
                        ...comment,
                        replies: updatedReplies
                    };
                }
                return comment;
            }));
            setReplyContent('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Error adding reply:', error);
            setError('Failed to add reply');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateComment = async (commentId, content) => {
        if (!content.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const updatedComment = await interactivityService.updateComment(commentId, content);
            
            // Update the comment in the state, handling both root comments and replies
            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    // Preserve the user information when updating the comment
                    return {
                        ...updatedComment,
                        userName: comment.userName,
                        userProfilePhoto: comment.userProfilePhoto
                    };
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => 
                            reply.id === commentId ? {
                                ...updatedComment,
                                userName: reply.userName,
                                userProfilePhoto: reply.userProfilePhoto
                            } : reply
                        )
                    };
                }
                return comment;
            }));
            setEditingComment(null);
        } catch (error) {
            console.error('Error updating comment:', error);
            setError('Failed to update comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            await interactivityService.deleteComment(commentId);
            
            // Update the state, handling both root comments and replies
            setComments(prev => prev.map(comment => {
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: comment.replies.filter(reply => reply.id !== commentId)
                    };
                }
                return comment;
            }).filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            setError('Failed to delete comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLike = async (commentId) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const updatedComment = await interactivityService.toggleCommentLike(commentId);
            
            // Update the comment in the state, handling both root comments and replies
            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    // Preserve the user information when updating the comment
                    return {
                        ...updatedComment,
                        userName: comment.userName,
                        userProfilePhoto: comment.userProfilePhoto
                    };
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => 
                            reply.id === commentId ? {
                                ...updatedComment,
                                userName: reply.userName,
                                userProfilePhoto: reply.userProfilePhoto
                            } : reply
                        )
                    };
                }
                return comment;
            }));
        } catch (error) {
            console.error('Error toggling like:', error);
            setError('Failed to toggle like');
        } finally {
            setIsLoading(false);
        }
    };

    const canEditComment = (comment) => {
        return currentUser && comment.userId === currentUser.id;
    };

    const canDeleteComment = (comment) => {
        return currentUser && (comment.userId === currentUser.id || postOwnerId === currentUser.id);
    };

    const hasLikedComment = (comment) => {
        return currentUser && comment.likedBy?.includes(currentUser.id);
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    // Calculate total comments (including replies)
    const getTotalCommentCount = () => {
        return comments.reduce((total, comment) => {
            return total + 1 + (comment.replies?.length || 0);
        }, 0);
    };

    const renderComment = (comment, isReply = false) => (
        <div key={comment.id} className={`mt-4 ${isReply ? 'ml-8' : ''}`}>
            <div className="flex items-start space-x-3">
                <img
                    src={comment.userProfilePhoto || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full border-2 border-[#22C55E]"
                />
                <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{comment.userName}</p>
                                {editingComment === comment.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            value={comment.content}
                                            onChange={(e) => setComments(prev => prev.map(c => 
                                                c.id === comment.id ? { ...c, content: e.target.value } : c
                                            ))}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none bg-white"
                                            rows="2"
                                            disabled={isLoading}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateComment(comment.id, comment.content)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#1a9d4a] disabled:opacity-50 flex items-center transition-colors"
                                                >
                                                    {isLoading ? (
                                                        <FaSpinner className="animate-spin mr-1" />
                                                    ) : null}
                                                    Update
                                                </button>
                                                <button
                                                    onClick={() => setEditingComment(null)}
                                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                                    disabled={isLoading}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-gray-800">{comment.content}</p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {canEditComment(comment) && (
                                    <button
                                        onClick={() => setEditingComment(comment.id)}
                                        className="text-gray-500 hover:text-[#22C55E] transition-colors"
                                        disabled={isLoading}
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                                {canDeleteComment(comment) && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-4">
                            <button
                                onClick={() => handleToggleLike(comment.id)}
                                className={`flex items-center space-x-1 ${
                                    hasLikedComment(comment) ? 'text-[#22C55E]' : 'text-gray-500'
                                } hover:text-[#22C55E] transition-colors`}
                                disabled={isLoading}
                            >
                                {hasLikedComment(comment) ? <FaHeart /> : <FaRegHeart />}
                                <span>{comment.likeCount || 0}</span>
                            </button>
                            {!isReply && (
                                <button
                                    onClick={() => setReplyingTo(comment)}
                                    className="text-gray-500 hover:text-[#22C55E] transition-colors flex items-center space-x-1"
                                >
                                    <FaReply />
                                    <span>Reply</span>
                                </button>
                            )}
                            <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {replyingTo?.id === comment.id && (
                        <div className="mt-2">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none"
                                rows="2"
                                disabled={isLoading}
                            />
                            <div className="flex space-x-2 mt-2">
                                <button
                                    onClick={handleAddReply}
                                    disabled={isLoading || !replyContent.trim()}
                                    className="px-3 py-1 bg-[#22C55E] text-white rounded hover:bg-[#1a9d4a] disabled:opacity-50 flex items-center transition-colors"
                                >
                                    {isLoading ? (
                                        <FaSpinner className="animate-spin mr-1" />
                                    ) : null}
                                    Post Reply
                                </button>
                                <button
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {!isReply && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2">
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="flex items-center space-x-1 text-gray-500 hover:text-[#22C55E] transition-colors"
                            >
                                {expandedReplies[comment.id] ? (
                                    <>
                                        <FaChevronUp />
                                        <span>Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                                    </>
                                ) : (
                                    <>
                                        <FaChevronDown />
                                        <span>Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                                    </>
                                )}
                            </button>
                            {expandedReplies[comment.id] && (
                                <div className="mt-2">
                                    {comment.replies.map(reply => renderComment(reply, true))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="mt-4">
            {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleAddComment} className="mb-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none"
                    rows="2"
                    disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !newComment.trim()}
                        className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#1a9d4a] disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                        {isLoading ? (
                            <FaSpinner className="animate-spin mr-2" />
                        ) : null}
                        Post Comment
                    </button>
                    <div className="text-sm text-gray-500">
                        {getTotalCommentCount()} {getTotalCommentCount() === 1 ? 'Comment' : 'Comments'}
                    </div>
                </div>
            </form>

            {!showComments && getTotalCommentCount() > 0 && (
                <button
                    onClick={() => setShowComments(true)}
                    className="w-full py-2 text-[#22C55E] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                    View {getTotalCommentCount()} {getTotalCommentCount() === 1 ? 'Comment' : 'Comments'}
                </button>
            )}

            {showComments && (
                <div className="space-y-4">
                    {isLoading && comments.length === 0 ? (
                        <div className="flex justify-center items-center py-4">
                            <FaSpinner className="animate-spin text-[#22C55E] text-xl" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-gray-500 text-center">No comments yet</p>
                    ) : (
                        <>
                            {comments.map(comment => renderComment(comment))}
                            <button
                                onClick={() => setShowComments(false)}
                                className="w-full py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                            >
                                Hide Comments
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentSection; 