import React, { useEffect } from 'react';

const AuthSuccess = ({ message = "Authentication successful!" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4 text-green-500">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
      <p className="text-gray-600 text-center">{message}</p>
      <p className="text-gray-500 text-sm mt-4">Redirecting you to trip planner...</p>
    </div>
  );
};

export default AuthSuccess; 