import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUserProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const userData = await getCurrentUserProfile();
      if (!userData || !userData.id) {
        throw new Error('Invalid user data received');
      }
      updateUser(userData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to fetch user profile');
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = useCallback((userData, authToken) => {
    if (!userData || !authToken) {
      setError('Invalid login data');
      return;
    }

    const essentialUserData = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      roles: userData.roles || ['ROLE_USER'],
    };

    setUser({
      ...essentialUserData,
      about: userData.about || '',
      address: userData.address || '',
      contactNumber: userData.contactNumber || '',
      profilePhoto: userData.profilePhoto || '',
      coverPhoto: userData.coverPhoto || '',
    });
    setToken(authToken);
    setError(null);

    localStorage.setItem('user', JSON.stringify(essentialUserData));
    localStorage.setItem('token', authToken);
  }, []);

  const updateUser = useCallback((newUser) => {
    if (!newUser || !newUser.id) {
      setError('Invalid user data for update');
      return;
    }

    const essentialUserData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      roles: newUser.roles || ['ROLE_USER'],
    };

    setUser({
      ...essentialUserData,
      about: newUser.about || '',
      address: newUser.address || '',
      contactNumber: newUser.contactNumber || '',
      profilePhoto: newUser.profilePhoto || '',
      coverPhoto: newUser.coverPhoto || '',
    });

    localStorage.setItem('user', JSON.stringify(essentialUserData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};