import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar'; // Import the NavBar component

const ConnectionsPage = () => {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const { token, user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/user/debug/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.filter(u => u.email !== currentUser?.email);
      setUsers(filtered);

      const current = res.data.find(u => u.email === currentUser?.email);
      setFollowing(new Set(current?.following || []));
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, currentUser]);

  const toggleFollow = async (userId, isFollowing) => {
    try {
      await axios.post(
        `http://localhost:8081/api/user/${isFollowing ? 'unfollow' : 'follow'}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // Refresh
    } catch (err) {
      console.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}:`, err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Include NavBar here */}
      <NavBar />

      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Connections</h1>

        {users.length === 0 ? (
          <p className="text-gray-500">No other users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user) => {
              const isFollowing = following.has(user.id);
              return (
                <div key={user.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                  <div className="flex items-center space-x-4">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.firstName}
                        className="w-14 h-14 rounded-full object-cover border border-green-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg font-semibold">
                        {user.firstName?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {user.about && (
                    <p className="mt-2 text-sm text-gray-700">{user.about}</p>
                  )}
                  <button
                    onClick={() => toggleFollow(user.id, isFollowing)}
                    className={`mt-4 w-full py-1.5 rounded text-white font-semibold ${
                      isFollowing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPage;
