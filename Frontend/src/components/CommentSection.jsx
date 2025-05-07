import React, { useState, useEffect } from 'react';
import { interactivityService } from '../services/interactivityService';
import { FaTrash, FaEdit, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const CommentSection = ({ postId, postOwnerId }) => {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedComments = await interactivityService.getComments(postId);
            setComments(fetchedComments);
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
            const comment = await interactivityService.addComment(postId, newComment);
            setComments(prev => [comment, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            setError('Failed to add comment');
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
            setComments(prev => prev.map(comment => 
                comment.id === commentId ? updatedComment : comment
            ));
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
            setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            setError('Failed to delete comment');
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
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
                >
                    {isLoading ? (
                        <FaSpinner className="animate-spin mr-2" />
                    ) : null}
                    Post Comment
                </button>
            </form>

            <div className="space-y-4">
                {isLoading && comments.length === 0 ? (
                    <div className="flex justify-center items-center py-4">
                        <FaSpinner className="animate-spin text-blue-500 text-xl" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No comments yet</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start space-x-3">
                                {/* User Avatar */}
                                <div className="flex-shrink-0">
                                    {comment.userProfilePhoto ? (
                                        <img
                                            src={comment.userProfilePhoto}
                                            alt={comment.userName}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold">
                                                {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Comment Content */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-gray-900">{comment.userName}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            {canEditComment(comment) && (
                                                <button
                                                    onClick={() => setEditingComment(comment.id)}
                                                    className="text-gray-500 hover:text-blue-500"
                                                    disabled={isLoading}
                                                    title="Edit comment"
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {canDeleteComment(comment) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-gray-500 hover:text-red-500"
                                                    disabled={isLoading}
                                                    title="Delete comment"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingComment === comment.id ? (
                                        <div className="mt-2 space-y-2">
                                            <textarea
                                                value={comment.content}
                                                onChange={(e) => {
                                                    setComments(prev => prev.map(c => 
                                                        c.id === comment.id ? { ...c, content: e.target.value } : c
                                                    ));
                                                }}
                                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                                disabled={isLoading}
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateComment(comment.id, comment.content)}
                                                    disabled={isLoading}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                                                >
                                                    {isLoading ? (
                                                        <FaSpinner className="animate-spin mr-1" />
                                                    ) : null}
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingComment(null)}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                    disabled={isLoading}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-gray-800">{comment.content}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection; 