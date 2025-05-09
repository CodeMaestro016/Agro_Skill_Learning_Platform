import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { FaBell, FaCheck, FaSpinner } from 'react-icons/fa';

const NotificationCenter = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedNotifications = await getNotifications();
            setNotifications(fetchedNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            setError('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev => prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            setError('Failed to mark notification as read');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            await markAllNotificationsAsRead();
            // Update all notifications to be marked as read
            setNotifications(prev => prev.map(notification => ({
                ...notification,
                isRead: true
            })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            setError('Failed to mark all notifications as read');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.postId) {
            // Mark as read and navigate to the post
            handleMarkAsRead(notification.id);
            navigate(`/home?postId=${notification.postId}`);
            setIsOpen(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-[#22C55E] transition-colors"
                disabled={isLoading}
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#22C55E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={isLoading}
                                    className="text-sm text-[#22C55E] hover:text-[#1a9d4a] flex items-center transition-colors"
                                >
                                    {isLoading ? (
                                        <FaSpinner className="animate-spin mr-1" />
                                    ) : null}
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-2 bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <div className="flex justify-center items-center py-4">
                                <FaSpinner className="animate-spin text-[#22C55E] text-xl" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <p className="p-4 text-gray-500 text-center">No notifications</p>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-200 ${
                                        !notification.isRead ? 'bg-[#22C55E]/5' : ''
                                    } hover:bg-gray-50 cursor-pointer transition-colors`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800">{notification.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notification.id);
                                                }}
                                                disabled={isLoading}
                                                className="ml-2 text-gray-400 hover:text-[#22C55E] transition-colors"
                                            >
                                                {isLoading ? (
                                                    <FaSpinner className="animate-spin" />
                                                ) : (
                                                    <FaCheck />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter; 