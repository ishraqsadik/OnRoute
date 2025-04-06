'use client';
import { useState } from 'react';
import { login } from '@/lib/auth';

export default function LoginForm({ onLogin, onSignupClick }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [specificError, setSpecificError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing again
    if (error) setError('');
    if (specificError) setSpecificError('');
  };

  const validateForm = () => {
    // Email validation
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSpecificError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        // Handle specific HTTP error responses
        const status = err.response.status;
        
        if (status === 400) {
          setSpecificError('Incorrect email or password. Please try again.');
        } else if (status === 404) {
          setSpecificError('User not found. Please check your email or sign up.');
        } else if (status === 429) {
          setSpecificError('Too many login attempts. Please try again later.');
        } else {
          setError(`Login failed: ${err.response.data.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your internet connection.');
      } else {
        // Something else
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {specificError && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
          {specificError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>
        
        <div className="mb-6">
          <button 
            type="submit" 
            className={`w-full ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : 'Login'}
          </button>
        </div>
      </form>
      
      <div className="text-center">
        <p className="text-gray-600">
          Don't have an account? <button onClick={onSignupClick} className="text-blue-600 hover:text-blue-800 font-medium">Sign up</button>
        </p>
      </div>
    </div>
  );
} 