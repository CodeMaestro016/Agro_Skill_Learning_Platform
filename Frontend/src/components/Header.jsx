import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;

  return (
    <header className="bg-gradient-to-r from-green-700 to-green-800 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sprout className="h-8 w-8 text-green-100" />
          <span className="text-2xl font-bold text-white tracking-tight">Agro</span>
        </div>
        
        {isAuthPage && (
          <div className="hidden sm:flex items-center space-x-6">
            <Link 
              to="/login" 
              className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white' : 'text-green-100 hover:text-white'}`}
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isSignupPage 
                  ? 'bg-white text-green-700' 
                  : 'bg-green-600 text-white hover:bg-green-500'
              }`}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;