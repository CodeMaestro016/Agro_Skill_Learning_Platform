// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUserProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Fetch complete user profile when token is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const userData = await getCurrentUserProfile();
          updateUser(userData);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [token]);

  const login = (userData, token) => {
    // Store only essential data in localStorage
    const essentialUserData = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roles: userData.roles
    };
    // Store complete user data in state
    setUser(userData);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(essentialUserData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  const updateUser = (newUser) => {
    // Store only essential data in localStorage
    const essentialUserData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      roles: newUser.roles
    };
    // Store complete user data in state
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(essentialUserData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);