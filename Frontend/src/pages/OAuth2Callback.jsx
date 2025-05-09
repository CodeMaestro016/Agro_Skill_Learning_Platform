import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile } from '../services/api';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchTokenAndUser = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!token) {
          throw new Error('No token received');
        }

        const userData = await getCurrentUserProfile();
        if (!userData) {
          throw new Error('Failed to fetch user profile');
        }

        login(userData, token);
        navigate('/home');
      } catch (err) {
        console.error('OAuth2 callback error:', err);
        navigate('/login', { state: { error: err.message || 'Google login failed' } });
      }
    };

    fetchTokenAndUser();
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Processing login...</h2>
      </div>
    </div>
  );
};

export default OAuth2Callback;