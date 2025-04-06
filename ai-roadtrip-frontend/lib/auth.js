import axios from 'axios';

// Create API client with proper error handling
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') { // Check if running on client side
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add more detailed error information for auth errors
    if (error.response) {
      if (error.response.status === 401) {
        // Clear tokens on auth failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        
        // Add a user-friendly message
        error.userMessage = 'Your session has expired. Please login again.';
      }
      
      if (error.response.status === 400 && error.response.data?.message) {
        // Pass along the server message
        error.userMessage = error.response.data.message;
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    // Log for debugging
    console.error('Login error details:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development' && !api.defaults.baseURL) {
      console.warn('Using mock login response in development');
      // In development, simulate a successful login
      return {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          name: 'Test User',
          email: email,
        }
      };
    }
    
    // Throw a more detailed error
    const errorMessage = error.userMessage || error.response?.data?.message || error.message || 'Login failed';
    const errorObj = new Error(errorMessage);
    errorObj.response = error.response;
    errorObj.request = error.request;
    throw errorObj;
  }
};

export const signup = async (name, email, password) => {
  try {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  } catch (error) {
    // Log for debugging
    console.error('Signup error details:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development' && !api.defaults.baseURL) {
      console.warn('Using mock signup response in development');
      // In development, simulate a successful signup
      return {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          name: name,
          email: email,
        }
      };
    }
    
    // Check for email already exists error
    if (error.response?.status === 400 && 
        error.response.data.message.includes('already exists')) {
      const errorObj = new Error('This email is already registered');
      errorObj.response = error.response;
      errorObj.request = error.request;
      throw errorObj;
    }
    
    // Throw a more detailed error
    const errorMessage = error.userMessage || error.response?.data?.message || error.message || 'Signup failed';
    const errorObj = new Error(errorMessage);
    errorObj.response = error.response;
    errorObj.request = error.request;
    throw errorObj;
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development' && !api.defaults.baseURL) {
      const userData = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('user_preferences') || '{}') : {};
      
      // In development, simulate a successful user fetch
      return {
        id: '123',
        name: userData.name || 'Test User',
        email: userData.email || 'test@example.com',
        preferences: userData.foodPreferences || []
      };
    }
    
    return null;
  }
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}; 