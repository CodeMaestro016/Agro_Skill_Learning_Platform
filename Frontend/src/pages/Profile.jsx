import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUserProfile, getUserProfile } from '../services/api';
import NavBar from '../components/NavBar';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        let userData;
        
        if (!userId) {
          // Fetch current user's profile
          userData = await getCurrentUserProfile();
        } else {
          // Fetch other user's profile
          userData = await getUserProfile(userId);
        }
        
        setProfileUser(userData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <p>{error}</p>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  const isOwnProfile = !userId || userId === currentUser?.id;
  const fullName = profileUser ? `${profileUser.firstName} ${profileUser.lastName}` : 'User';

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      {/* Cover Photo Section */}
      <div className="relative h-64 w-full">
        {profileUser?.coverPhoto ? (
          <img
            src={profileUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300" />
        )}
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Profile Photo and Basic Info */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative -mt-20">
              {profileUser?.profilePhoto ? (
                <img
                  src={profileUser.profilePhoto}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              {fullName}
            </h1>
            <div className="flex space-x-4 mt-4">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/update-profile')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {/* TODO: Implement connection request */}}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">About</h2>
                <p className="text-gray-600 mt-1">
                  {profileUser?.about || 'No about information provided'}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">Email</h2>
                <p className="text-gray-600 mt-1">{profileUser?.email}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">Role</h2>
                <p className="text-gray-600 mt-1">
                  {profileUser?.roles?.join(', ') || 'User'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Address</h2>
                <p className="text-gray-600 mt-1">
                  {profileUser?.address || 'No address provided'}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">Contact</h2>
                <p className="text-gray-600 mt-1">
                  {profileUser?.contactNumber || 'No contact number provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Profile; 