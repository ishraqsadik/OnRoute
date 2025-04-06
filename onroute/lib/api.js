import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000 // 5 second timeout
});

// Create a second API client for external requests (Llama model on Render)
const llamaApi = axios.create({
  // This should be configured in your .env.local file
  baseURL: process.env.NEXT_PUBLIC_LLAMA_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 second timeout for ML model
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
    
    // Check if we should use the Llama model
    if (process.env.NEXT_PUBLIC_USE_LLAMA_MODEL === 'true') {
      try {
        // Format the data for the Llama model based on the endpoint
        let llamaEndpoint = '/api/travel-plan';
        let llamaRequestData = {
          source: tripData.start,
          destination: tripData.destination,
          start_time: new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
        };

        // If using custom prompt, use the restaurant search endpoint
        if (tripData.useCustomPrompt && tripData.customPrompt) {
          if (tripData.customPrompt.trim()) {
            llamaEndpoint = '/api/restaurant-search';
            llamaRequestData = {
              query: tripData.customPrompt,
              source: tripData.start,
              destination: tripData.destination,
              start_time: new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
            };
          } else {
            // Fall back to travel plan with restaurants if prompt is empty
            llamaEndpoint = '/api/travel-plan-with-restaurants';
            llamaRequestData = {
              source: tripData.start,
              destination: tripData.destination,
              start_time: new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}),
              restaurant_query: "Where should I stop for food during my trip?"
            };
          }
        }

        // Call Llama model API
        console.log(`Calling Llama model API endpoint: ${llamaEndpoint} with data:`, llamaRequestData);
        const llamaResponse = await llamaApi.post(llamaEndpoint, llamaRequestData);

        // Process Llama model response
        if (llamaResponse.data && llamaResponse.data.status === 'success') {
          console.log('Received successful response from Llama model:', llamaResponse.data);
          // Convert Llama model response to the format expected by the frontend
          return transformLlamaResponse(llamaResponse.data.data, tripData, geoData);
        } else {
          console.error('Invalid response from Llama model:', llamaResponse.data);
          throw new Error('Invalid response from Llama model');
        }
      } catch (llamaError) {
        console.error('Error from Llama model API:', llamaError);
        console.log('Falling back to regular API');
        // Fall back to regular API if Llama model fails
      }
    }
    
    // Make regular API request if Llama model is not used or failed
    const res = await api.post(endpoint, enrichedTripData);
    console.log('API response data:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error; // No fallback, propagate error
  }
};

// Function to transform the Llama model response to the format expected by the frontend
function transformLlamaResponse(llamaData, tripData, geoData) {
  // If using custom prompt and got restaurant suggestions from restaurant-search endpoint
  if (tripData.useCustomPrompt) {
    // For restaurant-search endpoint responses
    if (typeof llamaData === 'string') {
      // The response might be a text response directly from the model
      const stops = [
        { 
          location: geoData.startCoords, 
          type: 'start', 
          name: tripData.start 
        },
        { 
          location: geoData.destCoords,
          type: 'destination',
          name: tripData.destination
        }
      ];

      return {
        route: {
          stops,
          googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(tripData.start)}/${encodeURIComponent(tripData.destination)}/`,
          restaurantSuggestions: llamaData // Pass the text response for parsing in the Results component
        }
      };
    }
    
    // For travel-plan-with-restaurants endpoint responses
    if (llamaData.travel_plan || llamaData.restaurant_suggestions) {
      const restaurantSuggestions = llamaData.restaurant_suggestions;
      
      // For the results page, format the stops array
      const stops = [
        { 
          location: geoData.startCoords, 
          type: 'start', 
          name: tripData.start 
        }
      ];

      // Add all the stops from Llama model if available
      if (llamaData.travel_plan && llamaData.travel_plan.stops_with_restaurants) {
        for (const stopData of llamaData.travel_plan.stops_with_restaurants) {
          const stopInfo = stopData.stop_info;
          
          if (stopData.places && stopData.places.length > 0) {
            // For now just add the top rated place
            const topPlace = [...stopData.places].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
            if (topPlace) {
              stops.push({
                location: {
                  lat: topPlace.location?.lat || (topPlace.coordinates?.latitude || 0),
                  lng: topPlace.location?.lng || (topPlace.coordinates?.longitude || 0)
                },
                type: stopInfo.type.toLowerCase(),
                name: topPlace.name,
                address: topPlace.address || topPlace.vicinity,
                rating: topPlace.rating
              });
            }
          }
        }
      }

      // Add destination
      stops.push({
        location: geoData.destCoords,
        type: 'destination',
        name: tripData.destination
      });

      return {
        route: {
          stops,
          googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(tripData.start)}/${encodeURIComponent(tripData.destination)}/`,
          restaurantSuggestions // Include the restaurant suggestions for display
        }
      };
    }
  }
  
  // For travel-plan endpoint responses (standard stops)
  const stops = [
    { 
      location: geoData.startCoords, 
      type: 'start', 
      name: tripData.start 
    }
  ];

  // Add stops from the Llama model
  if (llamaData.stops_with_restaurants || (llamaData.travel_plan && llamaData.travel_plan.stops_with_restaurants)) {
    const stopsData = llamaData.stops_with_restaurants || llamaData.travel_plan.stops_with_restaurants;
    
    for (const stopData of stopsData) {
      const stopInfo = stopData.stop_info;
      // Add top place as stop
      if (stopData.places && stopData.places.length > 0) {
        const topPlace = [...stopData.places].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
        if (topPlace) {
          stops.push({
            location: {
              lat: topPlace.location?.lat || (topPlace.coordinates?.latitude || 0),
              lng: topPlace.location?.lng || (topPlace.coordinates?.longitude || 0)
            },
            type: stopInfo.type.toLowerCase(),
            name: topPlace.name,
            address: topPlace.address || topPlace.vicinity,
            rating: topPlace.rating
          });
        }
      }
    }
  } else if (llamaData.suggested_stops) {
    // Handle the simple format from travel-plan endpoint
    for (const stop of llamaData.suggested_stops) {
      stops.push({
        location: {
          lat: stop.coordinates?.latitude || 0,
          lng: stop.coordinates?.longitude || 0
        },
        type: stop.type.toLowerCase(),
        name: stop.reason,
        time: stop.time
      });
    }
  }

  // Add destination
  stops.push({
    location: geoData.destCoords,
    type: 'destination',
    name: tripData.destination
  });

  return {
    route: {
      stops,
      googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(tripData.start)}/${encodeURIComponent(tripData.destination)}/`,
      summary: llamaData.route_summary || (llamaData.travel_plan && llamaData.travel_plan.route_summary)
    }
  };
}

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
