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

export default api;

export const getRecommendations = async (tripData) => {
  try {
    // Set a short timeout for the API request to avoid long waiting
    const res = await api.post('/getRecommendations', tripData, {
      timeout: 3000 // 3 seconds timeout
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    
    // Create fallback data for any error (network, timeout, etc.)
    console.log('Using fallback recommendations data');
    
    // Get coordinates using the Geocoding API if available
    let startCoords = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
    let destCoords = { lat: 39.9526, lng: -75.1652 };  // Default to Philadelphia
    
    // Try to geocode the addresses if Google Maps is available
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      
      try {
        // Try to geocode start location
        const startResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: tripData.start }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(status);
            }
          });
        });
        
        // If successful, update the start coordinates
        startCoords = {
          lat: startResult.geometry.location.lat(),
          lng: startResult.geometry.location.lng()
        };
        
        // Try to geocode destination
        const destResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: tripData.destination }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(status);
            }
          });
        });
        
        // If successful, update the destination coordinates
        destCoords = {
          lat: destResult.geometry.location.lat(),
          lng: destResult.geometry.location.lng()
        };
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue with default coordinates if geocoding fails
      }
    }
    
    // Calculate a midpoint for a restaurant stop
    const midLat = (startCoords.lat + destCoords.lat) / 2;
    const midLng = (startCoords.lng + destCoords.lng) / 2;
    
    // Create a mock route response
    return {
      route: {
        stops: [
          { location: startCoords, type: 'start', name: tripData.start },
          { 
            location: { 
              lat: midLat + (Math.random() * 0.05 - 0.025),
              lng: midLng + (Math.random() * 0.05 - 0.025)
            }, 
            type: 'restaurant', 
            name: 'Sample Restaurant' 
          },
          { 
            location: { 
              lat: midLat + (Math.random() * 0.05 - 0.025),
              lng: midLng + (Math.random() * 0.05 - 0.025)
            }, 
            type: 'gas', 
            name: 'Sample Gas Station' 
          },
          { location: destCoords, type: 'destination', name: tripData.destination }
        ],
        googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(tripData.start)}/${encodeURIComponent(tripData.destination)}/`
      }
    };
  }
};
