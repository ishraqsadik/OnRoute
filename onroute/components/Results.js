import { useState, useEffect } from 'react';
import MapView from './MapView';

const Results = ({ route, tripData, onBackToForm }) => {
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [finalStops, setFinalStops] = useState(route?.stops || []);
  const [parsedSuggestions, setParsedSuggestions] = useState([]);

  // Function to get coordinates from an address using Google Maps Geocoding API
  const getCoordinatesFromAddress = async (address) => {
    try {
      if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
        console.error('Google Maps Geocoder not available');
        return { lat: 0, lng: 0 };
      }

      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve({
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            });
          } else {
            console.error(`Geocoding failed: ${status}`);
            // Use an approximation from the route if available
            if (route.stops && route.stops.length > 1) {
              resolve({
                lat: route.stops[1].location.lat,
                lng: route.stops[1].location.lng
              });
            } else {
              resolve({ lat: 0, lng: 0 });
            }
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      return { lat: 0, lng: 0 };
    }
  };

  // Function to handle restaurant selection
  const handleRestaurantSelect = (restaurantInfo) => {
    // Check if restaurant is already selected
    const alreadySelected = selectedRestaurants.some(r => r.name === restaurantInfo.name);
    
    if (alreadySelected) {
      // Remove from selection
      setSelectedRestaurants(prev => prev.filter(r => r.name !== restaurantInfo.name));
    } else {
      // Add to selection
      setSelectedRestaurants(prev => [...prev, restaurantInfo]);
    }
  };

  // Function to finalize the route with selected restaurants
  const finalizeRoute = () => {
    if (selectedRestaurants.length === 0) return;

    // Get the start and destination from the original stops
    const startStop = finalStops.find(stop => stop.type === 'start');
    const destStop = finalStops.find(stop => stop.type === 'destination');
    
    // Create a new stops array with start, selected restaurants, and destination
    const newStops = [
      startStop,
      ...selectedRestaurants.map(restaurant => ({
        location: {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        },
        type: 'restaurant',
        name: restaurant.name,
        address: restaurant.address,
        rating: restaurant.rating
      })),
      destStop
    ];
    
    setFinalStops(newStops);
  };

  // Parse restaurant suggestions if present
  const parseRestaurantSuggestions = async () => {
    if (!route.restaurantSuggestions) return [];
    
    // Parse the actual data from the Llama model response
    const suggestions = route.restaurantSuggestions;
    
    try {
      // If restaurantSuggestions is already an array of objects, use it directly
      if (Array.isArray(suggestions)) {
        return suggestions;
      }
      
      // If restaurantSuggestions is a string (text from Llama model), parse it
      if (typeof suggestions === 'string') {
        // Extract restaurant information from the text response
        const restaurants = [];
        
        // Split by double newlines to separate each restaurant suggestion
        const suggestionBlocks = suggestions.split('\n\n');
        
        for (const block of suggestionBlocks) {
          if (!block.trim()) continue;
          
          // Parse restaurant details
          const nameMatch = block.match(/stop at ([^(]+)/i);
          const ratingMatch = block.match(/rating of ([0-9.]+)/i);
          const timeMatch = block.match(/at ([0-9]+:[0-9]+ [AP]M)/i);
          const typeMatch = block.match(/your ([^(]+) at/i);
          const addressMatch = block.match(/located at ([^.]+)/i);
          
          if (nameMatch) {
            // Create a restaurant object with extracted information
            const restaurant = {
              name: nameMatch[1].trim(),
              rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
              type: 'restaurant',
              // Get coordinates from the address using Google Geocoding
              location: addressMatch ? await getCoordinatesFromAddress(addressMatch[1].trim()) : { lat: 0, lng: 0 },
              time: timeMatch ? timeMatch[1] : '',
              stopType: typeMatch ? typeMatch[1].trim().toLowerCase() : 'stop',
              address: addressMatch ? addressMatch[1].trim() : '',
              description: block.trim()
            };
            
            restaurants.push(restaurant);
          }
        }
        
        return restaurants;
      }
      
      // If it's an object with nested data, try to extract the restaurant data
      if (typeof suggestions === 'object') {
        if (suggestions.places) {
          // If it has a places array, map it to our format
          const placesWithCoordinates = [];
          
          for (const place of suggestions.places) {
            const coords = place.location || place.coordinates || null;
            let location = { lat: 0, lng: 0 };
            
            if (coords) {
              location = coords;
            } else if (place.address) {
              location = await getCoordinatesFromAddress(place.address);
            }
            
            placesWithCoordinates.push({
              name: place.name || 'Unknown Restaurant',
              rating: place.rating || null,
              location,
              address: place.address || place.vicinity || '',
              type: 'restaurant',
              description: place.description || `${place.name} - ${place.address || ''}`
            });
          }
          
          return placesWithCoordinates;
        }
      }
      
      console.error('Could not parse restaurant suggestions format:', suggestions);
      return [];
    } catch (error) {
      console.error('Error parsing restaurant suggestions:', error);
      return [];
    }
  };

  // Use useEffect to parse suggestions when component mounts
  useEffect(() => {
    if (route.restaurantSuggestions) {
      const fetchData = async () => {
        const suggestions = await parseRestaurantSuggestions();
        setParsedSuggestions(suggestions);
      };
      
      fetchData();
    }
  }, [route.restaurantSuggestions]);

  const showSuggestionSelector = tripData?.useCustomPrompt && parsedSuggestions.length > 0;

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Your Recommended Stops</h2>
      <button 
        onClick={onBackToForm}
        className="mb-4 text-blue-600 hover:underline flex items-center"
      >
        ← Back to Form
      </button>
      <div className="mb-6">
        <p className="font-semibold">Trip Details:</p>
        <p>From: {tripData?.start}</p>
        <p>To: {tripData?.destination}</p>
        <p>Fuel Status: {tripData?.fuelStatus} miles</p>
        {tripData?.useCustomPrompt && <p>Your Prompt: "{tripData.customPrompt}"</p>}
      </div>

      {/* Restaurant Recommendation Selector */}
      {showSuggestionSelector && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">AI Restaurant Recommendations</h3>
          <p className="mb-4">Select restaurants to add to your route:</p>
          
          <div className="grid gap-4 md:grid-cols-3">
            {parsedSuggestions.map((restaurant, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedRestaurants.some(r => r.name === restaurant.name) 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => handleRestaurantSelect(restaurant)}
              >
                <h4 className="font-medium">{restaurant.name}</h4>
                {restaurant.rating && (
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <span className="mr-1">⭐</span>
                    <span>{restaurant.rating}/5</span>
                  </div>
                )}
                {restaurant.address && (
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                )}
                {restaurant.time && (
                  <p className="text-sm text-gray-500">Stop time: {restaurant.time}</p>
                )}
                <p className="text-sm mt-2">{restaurant.description}</p>
              </div>
            ))}
          </div>
          
          {parsedSuggestions.length === 0 && (
            <p className="text-gray-500">No restaurant suggestions were found for your query.</p>
          )}
          
          <button
            onClick={finalizeRoute}
            disabled={selectedRestaurants.length === 0}
            className={`mt-4 px-4 py-2 rounded-lg ${
              selectedRestaurants.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add {selectedRestaurants.length} Restaurant{selectedRestaurants.length !== 1 ? 's' : ''} to Route
          </button>
        </div>
      )}

      {finalStops && <MapView stops={finalStops} />}
      {route?.googleMapsLink && (
        <button
          onClick={() => window.open(route.googleMapsLink)}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Open in Google Maps
        </button>
      )}
    </div>
  );
};

export default Results; 