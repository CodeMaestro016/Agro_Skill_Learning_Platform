import React, { useState, useEffect } from 'react';
import { toggleLike, getLikeCount, hasUserLiked } from '../services/api';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const LikeButton = ({ postId, initialLikeCount = 0 }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkLikeStatus = async () => {
            try {
                const hasLiked = await hasUserLiked(postId);
                setIsLiked(hasLiked);
            } catch (error) {
                console.error('Error checking like status:', error);
                setError('Failed to check like status');
            }
        };

        const fetchLikeCount = async () => {
            try {
                const count = await getLikeCount(postId);
                setLikeCount(count);
            } catch (error) {
                console.error('Error fetching like count:', error);
                setError('Failed to fetch like count');
            }
        };

        checkLikeStatus();
        fetchLikeCount();
    }, [postId]);

    const handleLike = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);
        
        // Optimistically update UI
        const newLikeState = !isLiked;
        setIsLiked(newLikeState);
        setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
        
        try {
            const response = await toggleLike(postId);
            
            // If the response is null, it means the like was removed
            if (response === null) {
                setIsLiked(false);
            } else {
                setIsLiked(true);
            }
            
            // Fetch the actual like count from the server
            const updatedCount = await getLikeCount(postId);
            setLikeCount(updatedCount);
        } catch (error) {
            console.error('Error toggling like:', error);
            setError('Failed to update like');
            
            // Revert optimistic update on error
            setIsLiked(!newLikeState);
            setLikeCount(prev => !newLikeState ? prev + 1 : Math.max(0, prev - 1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center space-x-1 transition-colors ${
                    isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-red-500'
                }`}
                title={isLiked ? 'Unlike' : 'Like'}
            >
                {isLiked ? (
                    <FaHeart className="text-xl" />
                ) : (
                    <FaRegHeart className="text-xl" />
                )}
                <span className="ml-1">{likeCount}</span>
            </button>
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
};

export default LikeButton; 