'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';

export default function MapView({ stops }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.GOOGLE_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [bounds, setBounds] = useState(null);
  const directionsServiceRef = useRef(null);

  const onLoad = useCallback(map => {
    setMap(map);
    
    // Create bounds that encompass all stops
    if (stops && stops.length > 0) {
      const newBounds = new window.google.maps.LatLngBounds();
      stops.forEach(stop => {
        newBounds.extend(stop.location);
      });
      map.fitBounds(newBounds);
      setBounds(newBounds);
    }
  }, [stops]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate and display route when stops are available
  useEffect(() => {
    if (!isLoaded || !stops || stops.length < 2) return;
    
    try {
      // Initialize the DirectionsService if not already created
      if (!directionsServiceRef.current && window.google) {
        directionsServiceRef.current = new window.google.maps.DirectionsService();
      }
      
      if (!directionsServiceRef.current) {
        setMapError("Google Maps Directions Service is not available");
        return;
      }
      
      // Find start and destination stops
      const startStop = stops.find(stop => stop.type === 'start') || stops[0];
      const destStop = stops.find(stop => stop.type === 'destination') || stops[stops.length - 1];
      
      // Create waypoints from intermediate stops
      const waypoints = stops
        .filter(stop => stop.type !== 'start' && stop.type !== 'destination')
        .map(stop => ({
          location: new window.google.maps.LatLng(stop.location.lat, stop.location.lng),
          stopover: true
        }));

      // Request directions with retries
      const requestDirections = (retryCount = 0) => {
        directionsServiceRef.current.route(
          {
            origin: new window.google.maps.LatLng(startStop.location.lat, startStop.location.lng),
            destination: new window.google.maps.LatLng(destStop.location.lat, destStop.location.lng),
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
              setMapError(null);
            } else {
              console.error(`Directions request failed: ${status}`);
              
              // If we failed because of too many waypoints, try simplifying
              if (status === 'MAX_WAYPOINTS_EXCEEDED' && waypoints.length > 0) {
                directionsServiceRef.current.route(
                  {
                    origin: new window.google.maps.LatLng(startStop.location.lat, startStop.location.lng),
                    destination: new window.google.maps.LatLng(destStop.location.lat, destStop.location.lng),
                    travelMode: window.google.maps.TravelMode.DRIVING,
                  },
                  (simpleResult, simpleStatus) => {
                    if (simpleStatus === window.google.maps.DirectionsStatus.OK) {
                      setDirections(simpleResult);
                      setMapError("Simplified route shown - some stops omitted");
                    } else {
                      setMapError(`Error fetching directions: ${status}`);
                    }
                  }
                );
              } else if (retryCount < 2) {
                // Retry a couple of times with a delay
                setTimeout(() => {
                  requestDirections(retryCount + 1);
                }, 1000);
              } else {
                setMapError(`Error fetching directions: ${status}`);
              }
            }
          }
        );
      };
      
      requestDirections();
    } catch (error) {
      console.error('Error initializing directions:', error);
      setMapError(`Map error: ${error.message}`);
    }
  }, [isLoaded, stops]);

  if (loadError) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-lg p-4">
        <p className="font-bold mb-2">Map Error</p>
        <p className="text-center mb-4">{loadError.message}</p>
        <div className="border border-gray-300 w-full h-64 rounded-lg flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <p className="text-gray-700 mb-2">Map preview unavailable</p>
            <p className="text-gray-500 text-sm">From: {stops[0]?.name || 'Start location'}</p>
            <p className="text-gray-500 text-sm">To: {stops[stops.length-1]?.name || 'Destination'}</p>
          </div>
        </div>
        <a 
          href={`https://www.google.com/maps/dir/${encodeURIComponent(stops[0]?.name || '')}/${encodeURIComponent(stops[stops.length-1]?.name || '')}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-blue-600 underline"
        >
          View on Google Maps website
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">Loading Map...</div>;
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {mapError && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-50 p-2 text-sm text-yellow-700 border-b border-yellow-200">
          {mapError}
        </div>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '600px' }}
        center={stops[0].location}
        zoom={7}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          zoomControl: true,
        }}
      >
        {/* Render the directions if available */}
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }} 
          />
        )}
        
        {/* Render markers for all stops */}
        {stops.map((stop, index) => {
          let iconUrl = '';
          if (stop.type === 'start') {
            iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
          } else if (stop.type === 'destination') {
            iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
          } else if (stop.type === 'restaurant') {
            iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
          } else if (stop.type === 'gas') {
            iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
          }
          
          return (
            <Marker 
              key={index} 
              position={stop.location} 
              title={stop.name || `Stop ${index + 1}`}
              icon={{
                url: iconUrl,
                scaledSize: new window.google.maps.Size(32, 32)
              }}
            />
          );
        })}
      </GoogleMap>
      
      {/* List of stops */}
      <div className="mt-4 border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-2">Your Trip Stops</h3>
        <ul className="space-y-2">
          {stops.map((stop, index) => (
            <li key={index} className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-2">
                {stop.type === 'start' && <span className="text-green-600 text-xl">●</span>}
                {stop.type === 'destination' && <span className="text-red-600 text-xl">●</span>}
                {stop.type === 'restaurant' && <span className="text-xl">🍴</span>}
                {stop.type === 'gas' && <span className="text-xl">⛽</span>}
              </div>
              <div>
                <p className="font-medium">{stop.name}</p>
                <p className="text-xs text-gray-500">
                  {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
