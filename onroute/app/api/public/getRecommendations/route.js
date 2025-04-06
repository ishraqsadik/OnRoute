import { NextResponse } from 'next/server';
import axios from 'axios';

// Create axios instance for Llama API
const llamaApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LLAMA_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 second timeout for ML model
});

export async function POST(request) {
  try {
    const data = await request.json();
    const { start, destination, startCoords, destCoords, useCustomPrompt, customPrompt } = data;

    // Validate required fields
    if (!start || !destination) {
      return NextResponse.json(
        { error: 'Start and destination are required' },
        { status: 400 }
      );
    }

    if (!startCoords || !destCoords) {
      return NextResponse.json(
        { error: 'Start and destination coordinates are required' },
        { status: 400 }
      );
    }

    console.log('Received public recommendation request:', {
      start,
      destination,
      startCoords,
      destCoords,
      useCustomPrompt,
      customPrompt
    });

    // Calculate distance between points (haversine formula)
    const distance = calculateDistance(
      startCoords.lat, startCoords.lng,
      destCoords.lat, destCoords.lng
    );
    
    try {
      // Connect to Llama Model API
      console.log('Connecting to Llama Model API...');
      
      // Prepare the request data based on whether there's a custom prompt
      let llamaEndpoint = '/api/travel-plan';
      let llamaRequestData = {
        source: start,
        destination: destination,
        start_time: new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
      };
      
      // If using custom prompt, use restaurant search endpoint
      if (useCustomPrompt && customPrompt && customPrompt.trim()) {
        llamaEndpoint = '/api/restaurant-search';
        llamaRequestData = {
          query: customPrompt,
          source: start,
          destination: destination,
          start_time: new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
        };
      }
      
      console.log(`Calling Llama API endpoint: ${llamaEndpoint} with data:`, llamaRequestData);
      const llamaResponse = await llamaApi.post(llamaEndpoint, llamaRequestData);
      
      if (llamaResponse.data && llamaResponse.data.status === 'success') {
        console.log('Successfully received Llama API response');
        
        // Process the Llama API response
        const llamaData = llamaResponse.data.data;
        
        // Transform the Llama API response to the format expected by the frontend
        const transformedResponse = transformLlamaResponse(llamaData, startCoords, destCoords, start, destination, distance);
        
        return NextResponse.json(transformedResponse);
      } else {
        throw new Error('Invalid response from Llama API');
      }
    } catch (llamaError) {
      console.error('Error connecting to Llama API:', llamaError);
      
      // Fallback to minimal stops if Llama API fails
      const stops = [
        { 
          location: startCoords, 
          type: 'start', 
          name: start 
        },
        { 
          location: destCoords, 
          type: 'destination', 
          name: destination 
        }
      ];
      
      const googleMapsLink = `https://www.google.com/maps/dir/${encodeURIComponent(
        start
      )}/${encodeURIComponent(destination)}/`;

      // Return minimal recommendations
      return NextResponse.json({
        route: {
          stops,
          googleMapsLink,
          distance: {
            miles: Math.round(distance),
            kilometers: Math.round(distance * 1.60934)
          },
          estimatedTime: {
            hours: Math.floor(distance / 65), // Assuming 65 mph average speed
            minutes: Math.round((distance / 65) * 60) % 60
          }
        },
      });
    }
  } catch (error) {
    console.error('Server error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// Calculate distance between two points using the haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// Transform Llama API response to expected frontend format
function transformLlamaResponse(llamaData, startCoords, destCoords, startName, destName, distance) {
  // Initialize with start and destination stops
  const stops = [
    { 
      location: startCoords, 
      type: 'start', 
      name: startName 
    }
  ];
  
  // Process Llama API response based on its format
  if (typeof llamaData === 'string') {
    // If it's a text response, we can't extract stops directly
    console.log('Received text response from Llama API');
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
  } else if (llamaData.stops_with_restaurants || (llamaData.travel_plan && llamaData.travel_plan.stops_with_restaurants)) {
    const stopsData = llamaData.stops_with_restaurants || (llamaData.travel_plan && llamaData.travel_plan.stops_with_restaurants);
    
    for (const stopData of stopsData) {
      const stopInfo = stopData.stop_info;
      // Add places as stops
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
  }
  
  // Always add destination as the last stop
  stops.push({ 
    location: destCoords, 
    type: 'destination', 
    name: destName 
  });
  
  // Generate Google Maps directions link
  const googleMapsLink = `https://www.google.com/maps/dir/${encodeURIComponent(
    startName
  )}/${encodeURIComponent(destName)}/`;
  
  // If we received restaurant suggestions, include them
  const restaurantSuggestions = llamaData.restaurant_suggestions || null;
  
  return {
    route: {
      stops,
      googleMapsLink,
      distance: {
        miles: Math.round(distance),
        kilometers: Math.round(distance * 1.60934)
      },
      estimatedTime: {
        hours: Math.floor(distance / 65), // Assuming 65 mph average speed
        minutes: Math.round((distance / 65) * 60) % 60
      },
      restaurantSuggestions
    }
  };
}