// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();

  console.log('ProtectedRoute - token:', token ? 'exists' : 'missing');
  console.log('ProtectedRoute - current path:', window.location.pathname);

  if (!token) {
    console.log('ProtectedRoute - redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('ProtectedRoute - rendering protected content');
  return children;
};

export default ProtectedRoute;
