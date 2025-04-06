import axios from 'axios';

// Create API client with proper error handling
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8 second timeout - give MongoDB more time to connect
});

// Check if we're manually forced into development mode
const isDevelopmentMode = () => {
  return typeof window !== 'undefined' && localStorage.getItem('dev_mode_forced') === 'true';
};

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API error intercepted:', error.message);
    
    // Log meaningful errors but don't auto-enable dev mode
    if (error.response) {
      console.error(`API error status: ${error.response.status}`);
      console.error('API error data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    // Check if dev mode is manually forced
    const useMockData = isDevelopmentMode();
    
    if (useMockData) {
      console.log('Using mock login in development mode');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store the mock token
      localStorage.setItem('auth_token', 'mock-jwt-token');
      
      // Store basic user data
      localStorage.setItem('user_preferences', JSON.stringify({
        name: email.split('@')[0],
        email: email,
        foodPreferences: {
          foodTypes: ['Fast Food', 'Mexican'],
          favoriteChains: ['Taco Bell', 'McDonald\'s'],
          dietaryRestrictions: []
        }
      }));
      
      return {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          name: email.split('@')[0],
          email: email,
        }
      };
    }
    
    // Real API call
    const response = await api.post('/auth/login', { email, password });
    
    // Store the token
    if (response.data && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    // Log for debugging
    console.error('Login error details:', error);
    
    // Throw a more detailed error
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    const errorObj = new Error(errorMessage);
    errorObj.response = error.response;
    errorObj.request = error.request;
    throw errorObj;
  }
};

export const signup = async (name, email, password) => {
  try {
    // Check if dev mode is manually forced
    const useMockData = isDevelopmentMode();
    
    if (useMockData) {
      console.log('Using mock signup in development mode');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store the mock token
      localStorage.setItem('auth_token', 'mock-jwt-token');
      
      // Store basic user data
      localStorage.setItem('user_preferences', JSON.stringify({
        name: name,
        email: email,
        foodPreferences: {
          foodTypes: [],
          favoriteChains: [],
          dietaryRestrictions: []
        }
      }));
      
      return {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          name: name,
          email: email,
        }
      };
    }
    
    // Real API call
    const response = await api.post('/auth/signup', { name, email, password });
    
    // Store the token
    if (response.data && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    // Log for debugging
    console.error('Signup error details:', error);
    
    // Check for email already exists error
    if (error.response?.status === 400 && 
        error.response.data.message.includes('already exists')) {
      const errorObj = new Error('This email is already registered');
      errorObj.response = error.response;
      errorObj.request = error.request;
      throw errorObj;
    }
    
    // Throw a more detailed error
    const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
    const errorObj = new Error(errorMessage);
    errorObj.response = error.response;
    errorObj.request = error.request;
    throw errorObj;
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('dev_mode_forced');
    localStorage.removeItem('user_preferences');
  }
};

export const getCurrentUser = async () => {
  try {
    // Check if dev mode is manually forced 
    const useMockData = isDevelopmentMode();
    
    if (useMockData) {
      console.log('Using mock user data in development mode');
      
      // Get stored user preferences or create default
      const userData = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('user_preferences') || '{}') : {};
      
      return {
        id: '123',
        name: userData.name || 'Test User',
        email: userData.email || 'test@example.com',
        preferences: userData.foodPreferences || {
          foodTypes: [],
          favoriteChains: [],
          dietaryRestrictions: []
        }
      };
    }
    
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}; 