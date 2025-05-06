import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="flex items-center gap-2"> {/* Flex container to align progress bar and percentage text */}
      
      {/* Progress bar container */}
      <div className="w-full bg-gray-200 rounded-full h-2.5"> {/* Background of the progress bar */}
        
        {/* Dynamic progress bar */}
        <div
          className="bg-yellow-600 h-2.5 rounded-full transition-all duration-300"  // Blue progress bar with rounded edges
          style={{ width: `${progress}%` }}  // The width is dynamically set based on the 'progress' prop
        ></div>
      </div>
      
      {/* Percentage text */}
      <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
        {progress}% {/* Display the progress percentage */}
      </span>
    </div>
  );
};

export default ProgressBar;
