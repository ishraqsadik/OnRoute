import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development') {
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
    
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const signup = async (name, email, password) => {
  try {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  } catch (error) {
    console.error('Signup failed:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development') {
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
    
    throw new Error(error.response?.data?.message || 'Signup failed');
  }
};

export const logout = () => {
  localStorage.removeItem('auth_token');
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user failed:', error);
    
    // Create mock response for development
    if (process.env.NODE_ENV === 'development') {
      const userData = JSON.parse(localStorage.getItem('user_preferences') || '{}');
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
  return !!localStorage.getItem('auth_token');
}; 