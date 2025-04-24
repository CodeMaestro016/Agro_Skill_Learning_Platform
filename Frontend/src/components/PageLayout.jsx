import React from 'react';
import Header from './Header';

const PageLayout = ({ children, withPattern = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className={`flex-grow flex items-center justify-center ${withPattern ? 'bg-pattern' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;