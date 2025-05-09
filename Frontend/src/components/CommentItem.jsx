import React, { useState } from 'react';
import { FaHeart, FaRegHeart, FaReply } from 'react-icons/fa';

const CommentItem = ({ 
  comment, 
  onLike, 
  onReply, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete,
  currentUser 
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.content) {
      onEdit(comment.id, editText);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(comment.id);
  };

  const hasLiked = comment.likedBy?.includes(currentUser?.id);

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {comment.userProfilePhoto ? (
            <img
              src={comment.userProfilePhoto}
              alt={comment.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-800 text-sm font-bold">
                {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900">{comment.userName}</p>
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="2"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{comment.content}</p>
            )}
            
            {/* Like and Reply buttons */}
            <div className="mt-2 flex items-center space-x-4">
              <button
                onClick={() => onLike(comment.id)}
                className={`flex items-center space-x-1 ${
                  hasLiked ? 'text-red-500' : 'text-gray-500'
                } hover:text-red-500 transition-colors`}
              >
                {hasLiked ? <FaHeart /> : <FaRegHeart />}
                <span className="text-xs">{comment.likeCount || 0}</span>
              </button>
              
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-500 hover:text-green-500 transition-colors flex items-center space-x-1"
              >
                <FaReply />
                <span className="text-xs">Reply</span>
              </button>

              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Reply input */}
            {isReplying && (
              <div className="mt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="2"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleReply}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Replies section */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
                
                {showReplies && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onLike={onLike}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        canEdit={currentUser?.id === reply.userId}
                        canDelete={currentUser?.id === reply.userId || currentUser?.id === comment.userId}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit and Delete buttons */}
        {(canEdit || canDelete) && (
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem; 