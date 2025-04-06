import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000 // 5 second timeout
});

// Detect if we're in development mode or if development mode is forced
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         (typeof window !== 'undefined' && localStorage.getItem('dev_mode_forced') === 'true');
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

export default api;

export const getRecommendations = async (tripData) => {
  try {
    // First check if user is authenticated
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('auth_token');
    
    // Choose endpoint based on authentication status
    const endpoint = isLoggedIn ? '/getRecommendations' : '/public/getRecommendations';
    console.log(`Using API endpoint: ${endpoint}, authenticated: ${isLoggedIn}`);
    
    // Geocode the locations before sending to API
    const geoData = await geocodeLocations(tripData.start, tripData.destination);
    
    // Add geocoded data to the request
    const enrichedTripData = {
      ...tripData,
      startCoords: geoData.startCoords,
      destCoords: geoData.destCoords
    };
    
    // Make API request with geocoded data
    const res = await api.post(endpoint, enrichedTripData);
    console.log('API response data:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error; // No fallback, propagate error
  }
};

// Geocode start and destination using Google Maps API
const geocodeLocations = async (start, destination) => {
  // Default coordinates in case geocoding fails
  let startCoords = null;
  let destCoords = null;
  
  if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
    throw new Error('Google Maps Geocoder not available. Please check your API key and connection.');
  }
  
  try {
    console.log('Geocoding locations...');
    const geocoder = new window.google.maps.Geocoder();
    
    // Geocode start location
    const startResult = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: start }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0]);
        } else {
          reject(`Start location geocoding failed: ${status}`);
        }
      });
    });
    
    // Geocode destination
    const destResult = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: destination }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0]);
        } else {
          reject(`Destination geocoding failed: ${status}`);
        }
      });
    });
    
    // Set coordinates from geocoding results
    startCoords = {
      lat: startResult.geometry.location.lat(),
      lng: startResult.geometry.location.lng(),
    };
    
    destCoords = {
      lat: destResult.geometry.location.lat(),
      lng: destResult.geometry.location.lng(),
    };
    
    console.log('Successfully geocoded locations:', {
      start: startCoords,
      destination: destCoords
    });
    
    return { startCoords, destCoords };
  } catch (geocodeError) {
    console.error('Geocoding failed:', geocodeError);
    throw new Error('Failed to geocode locations. Please check your addresses and try again.');
  }
};
