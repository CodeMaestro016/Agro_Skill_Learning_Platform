import React from 'react';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';

const PostCard = ({ post, isOwnProfile, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {post.profilePhoto ? (
            <img
              src={post.profilePhoto}
              alt={post.userName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border border-gray-200">
              <span className="text-green-800 text-lg font-bold">
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{post.userName}</p>
            <p className="text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {isOwnProfile && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(post)}
              className="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors duration-150"
              title="Edit post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(post)}
              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors duration-150"
              title="Delete post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
            <div key={`post-${post.id}-image-${index}-${url}`} className="relative aspect-square">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover rounded-xl border border-gray-200"
              />
            </div>
          ))}
        </div>
      )}

      {post.videoUrl && (
        <div className="mb-3">
          <video
            key={`post-${post.id}-video-${post.videoUrl}`}
            controls
            className="w-full rounded-xl border border-gray-200 max-h-[300px] object-contain"
            src={post.videoUrl}
          />
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-4">
          <LikeButton postId={post.id} initialLikeCount={post.likeCount || 0} />
        </div>
        <div className="mt-4">
          <CommentSection 
            postId={post.id} 
            postOwnerId={post.userId}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCard; 