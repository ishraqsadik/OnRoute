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
    const res = await api.post('/getRecommendations', tripData, {
      timeout: 3000,
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    console.log('Attempting fallback with geocoded locations...');

    if (
      !(window.google && window.google.maps && window.google.maps.Geocoder)
    ) {
      throw new Error('Google Maps Geocoder not available');
    }

    const geocoder = new window.google.maps.Geocoder();

    try {
      // Geocode start location
      const startResult = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: tripData.start }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(`Start location geocoding failed: ${status}`);
          }
        });
      });

      const destResult = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: tripData.destination }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(`Destination geocoding failed: ${status}`);
          }
        });
      });

      const startCoords = {
        lat: startResult.geometry.location.lat(),
        lng: startResult.geometry.location.lng(),
      };

      const destCoords = {
        lat: destResult.geometry.location.lat(),
        lng: destResult.geometry.location.lng(),
      };

      const midLat = (startCoords.lat + destCoords.lat) / 2;
      const midLng = (startCoords.lng + destCoords.lng) / 2;

      return {
        route: {
          stops: [
            { location: startCoords, type: 'start', name: tripData.start },
            {
              location: {
                lat: midLat + (Math.random() * 0.05 - 0.025),
                lng: midLng + (Math.random() * 0.05 - 0.025),
              },
              type: 'restaurant',
              name: 'Sample Restaurant',
            },
            {
              location: {
                lat: midLat + (Math.random() * 0.05 - 0.025),
                lng: midLng + (Math.random() * 0.05 - 0.025),
              },
              type: 'gas',
              name: 'Sample Gas Station',
            },
            { location: destCoords, type: 'destination', name: tripData.destination },
          ],
          googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(
            tripData.start
          )}/${encodeURIComponent(tripData.destination)}/`,
        },
      };
    } catch (geocodeError) {
      console.error('Geocoding failed:', geocodeError);
      throw new Error('Failed to get fallback recommendations due to geocoding error');
    }
  }
};
