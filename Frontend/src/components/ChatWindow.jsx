import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from './NavBar';

const ChatWindow = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8081/api/messages/conversation/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        if (data.userDetails && data.userDetails[userId]) {
          setOtherUser(data.userDetails[userId]);
        }
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      setError('Error fetching messages');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8081/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOtherUser(data);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchMessages();
    fetchUserDetails();
  }, [userId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    setError(null);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempMessage = {
      id: Date.now(),
      content: messageContent,
      senderId: user.id,
      receiverId: userId,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    setMessages(prevMessages => [...prevMessages, tempMessage]);

    try {
      const response = await fetch('http://localhost:8081/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: userId,
          content: messageContent,
        }),
      });

      if (response.ok) {
        // Refetch messages to ensure sync with server
        await fetchMessages();
      } else {
        setError('Failed to send message. Please try again.');
        setMessages(prevMessages => prevMessages.filter(msg => !msg.isTemp));
        setNewMessage(messageContent);
      }
    } catch (error) {
      setError('Error sending message. Please try again.');
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isTemp));
      setNewMessage(messageContent);
      console.error('Error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await fetch(`http://localhost:8081/api/messages/update/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newContent,
        }),
      });

      if (response.ok) {
        // Refetch messages to ensure sync with server
        await fetchMessages();
        setEditingMessage(null);
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to update message');
        } catch (jsonError) {
          setError('Failed to update message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
      setError('Error updating message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/messages/delete/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refetch messages to ensure sync with server
        await fetchMessages();
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to delete message');
        } catch (jsonError) {
          setError('Failed to delete message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Error deleting message. Please try again.');
    }
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-16">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col h-[calc(100vh-5rem)] bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/chat')}
                  className="text-gray-500 hover:text-[#22c55e] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-[#22c55e] ring-opacity-20">
                  {otherUser?.profilePhoto ? (
                    <img
                      src={otherUser.profilePhoto}
                      alt={otherUser.firstName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-lg">👤</span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'User'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                const isFromCurrentUser = message.senderId === user.id;
                const messageUser = isFromCurrentUser ? user : otherUser;
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${
                        isFromCurrentUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="relative group">
                        <div className={`mb-1 text-xs font-semibold ${isFromCurrentUser ? 'text-[#22c55e] text-right' : 'text-gray-700 text-left'}`}>
                          {isFromCurrentUser ? 'You' : messageUser ? `${messageUser.firstName} ${messageUser.lastName}` : 'User'}
                        </div>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromCurrentUser
                              ? 'bg-[#22c55e] text-white'
                              : 'bg-white text-gray-800 shadow-sm'
                          }`}
                        >
                          {editingMessage?.id === message.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleEditMessage(message.id, editingMessage.content);
                              }}
                              className="flex space-x-2"
                            >
                              <input
                                type="text"
                                value={editingMessage.content}
                                onChange={(e) =>
                                  setEditingMessage({ ...editingMessage, content: e.target.value })
                                }
                                className="flex-1 bg-transparent border-b border-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="text-sm hover:text-blue-200"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMessage(null)}
                                className="text-sm hover:text-blue-200"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <p>{message.content}</p>
                              <p className="text-xs mt-1 opacity-75">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {isFromCurrentUser && !editingMessage && (
                          <div className="absolute right-0 top-0 hidden group-hover:flex space-x-2 bg-white rounded-lg shadow-lg p-1">
                            <button
                              onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                              className="text-gray-600 hover:text-[#22c55e] p-1 transition-colors"
                              title="Edit message"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-gray-600 hover:text-red-600 p-1 transition-colors"
                              title="Delete message"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-[#22c55e] text-white px-6 py-2 rounded-lg hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {sendingMessage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;