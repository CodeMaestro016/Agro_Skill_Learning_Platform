import React, { useState, useEffect } from 'react';
import { interactivityService } from '../services/interactivityService';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const LikeButton = ({ postId, initialLikeCount = 0 }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkLikeStatus = async () => {
            try {
                const hasLiked = await interactivityService.hasUserLiked(postId);
                setIsLiked(hasLiked);
            } catch (error) {
                console.error('Error checking like status:', error);
                setError('Failed to check like status');
            }
        };

        const fetchLikeCount = async () => {
            try {
                const count = await interactivityService.getLikeCount(postId);
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
        try {
            await interactivityService.toggleLike(postId);
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        } catch (error) {
            console.error('Error toggling like:', error);
            setError('Failed to update like');
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