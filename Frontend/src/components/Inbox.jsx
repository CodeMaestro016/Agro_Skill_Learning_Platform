import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';

const Inbox = () => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [userDetailsLoading, setUserDetailsLoading] = useState({});
  const [userDetailsError, setUserDetailsError] = useState({});

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/messages/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const uniqueConversations = processConversations(data);
          setConversations(uniqueConversations);
          
          // Store user details from the response
          if (data.userDetails) {
            setUserDetails(data.userDetails);
          }
        } else {
          setError('Failed to fetch conversations');
        }
      } catch (error) {
        setError('Error fetching conversations');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserDetails = async (userId) => {
      if (userDetails[userId] || userDetailsLoading[userId]) return;
      setUserDetailsLoading(prev => ({ ...prev, [userId]: true }));
      setUserDetailsError(prev => ({ ...prev, [userId]: false }));
      try {
        console.log('Fetching user details for:', userId);
        const response = await fetch(`http://localhost:8081/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserDetails(prev => ({ ...prev, [userId]: data }));
        } else {
          setUserDetailsError(prev => ({ ...prev, [userId]: true }));
          console.error('Failed to fetch user details for:', userId);
        }
      } catch (error) {
        setUserDetailsError(prev => ({ ...prev, [userId]: true }));
        console.error('Error fetching user details:', error);
      } finally {
        setUserDetailsLoading(prev => ({ ...prev, [userId]: false }));
      }
    };

    fetchConversations();
  }, [token]);

  const processConversations = (data) => {
    const { sentMessages, receivedMessages } = data;
    const conversationMap = new Map();

    // Process sent messages
    sentMessages.forEach((message) => {
      const otherUserId = message.receiverId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message,
          unread: false,
          messageCount: 1,
          isSent: true
        });
      } else if (new Date(message.timestamp) > new Date(conversationMap.get(otherUserId).lastMessage.timestamp)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message,
          unread: false,
          messageCount: conversationMap.get(otherUserId).messageCount + 1,
          isSent: true
        });
      } else {
        conversationMap.get(otherUserId).messageCount++;
      }
    });

    // Process received messages
    receivedMessages.forEach((message) => {
      const otherUserId = message.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message,
          unread: !message.read,
          messageCount: 1,
          isSent: false
        });
      } else if (new Date(message.timestamp) > new Date(conversationMap.get(otherUserId).lastMessage.timestamp)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message,
          unread: !message.read,
          messageCount: conversationMap.get(otherUserId).messageCount + 1,
          isSent: false
        });
      } else {
        conversationMap.get(otherUserId).messageCount++;
      }
    });

    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8081/api/user/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out the current user from search results
        const filteredResults = data.filter(result => result.id !== user.id);
        setSearchResults(filteredResults);

        // Fetch user details for each search result
        await Promise.all(filteredResults.map(result => fetchUserDetails(result.id)));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-[#22c55e] text-white px-4 py-2 rounded-lg hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">New Conversations</h3>
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        to={`/chat/${result.id}`}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-[#22c55e] ring-opacity-20">
                          {result.profilePhoto ? (
                            <img
                              src={result.profilePhoto}
                              alt={result.firstName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-lg">👤</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.firstName} {result.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{result.email}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversations List */}
            <div className="overflow-y-auto h-[calc(100vh-16rem)]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => {
                    const otherUser = userDetails[conversation.userId];
                    return (
                      <Link
                        key={conversation.userId}
                        to={`/chat/${conversation.userId}`}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
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
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {conversation.isSent ? 'You: ' : ''}{conversation.lastMessage.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {conversation.messageCount} messages
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500">
                                {new Date(conversation.lastMessage.timestamp).toLocaleTimeString()}
                              </span>
                              {conversation.unread && (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#22c55e] bg-opacity-10 text-[#22c55e]">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox; 