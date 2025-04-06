import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { start, destination, startCoords, destCoords } = data;

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

    console.log('Received recommendation request:', {
      start,
      destination,
      startCoords,
      destCoords
    });

    // Calculate midpoint between start and destination for stop recommendations
    const midLat = (startCoords.lat + destCoords.lat) / 2;
    const midLng = (startCoords.lng + destCoords.lng) / 2;

    // Calculate distance between points (haversine formula)
    const distance = calculateDistance(
      startCoords.lat, startCoords.lng,
      destCoords.lat, destCoords.lng
    );
    
    // Only recommend stops if trip is longer than 50 miles
    const shouldRecommendStops = distance > 50;
    
    // Generate recommendations
    const stops = [
      { 
        location: startCoords, 
        type: 'start', 
        name: start 
      }
    ];
    
    // Add midpoint stops if the trip is long enough
    if (shouldRecommendStops) {
      // Slightly offset restaurant and gas station for better display
      stops.push({
        location: {
          lat: midLat + (Math.random() * 0.02 - 0.01),
          lng: midLng + (Math.random() * 0.02 - 0.01),
        },
        type: 'restaurant',
        name: 'Recommended Restaurant',
        description: 'Based on trip route'
      });
      
      stops.push({
        location: {
          lat: midLat + (Math.random() * 0.02 - 0.01),
          lng: midLng + (Math.random() * 0.02 - 0.01),
        },
        type: 'gas',
        name: 'Recommended Gas Station',
        description: 'Based on trip route'
      });
    }
    
    // Add destination
    stops.push({ 
      location: destCoords, 
      type: 'destination', 
      name: destination 
    });

    // Generate Google Maps directions link
    const googleMapsLink = `https://www.google.com/maps/dir/${encodeURIComponent(
      start
    )}/${encodeURIComponent(destination)}/`;

    // Return recommendations
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