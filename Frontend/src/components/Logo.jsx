import React from 'react';

const Logo = ({ className = '', onClick }) => {
  return (
    <div 
      className={`flex items-center space-x-3 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-green-500 rounded-lg transform rotate-45 flex items-center justify-center">
          <span className="text-white text-3xl font-bold transform -rotate-45">A</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-600 rounded-full"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-green-600 leading-none">AgroSkill</span>
        <span className="text-sm text-gray-500">Learn & Grow</span>
      </div>
    </div>
  );
};

export default Logo; 