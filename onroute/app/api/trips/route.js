import { NextResponse } from 'next/server';
import { connectToDatabase, User, Trip, inMemoryTrips } from '../lib/mongodb';
import { authenticate } from '../lib/auth';

// Get all trips for the authenticated user
export async function GET(request) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.status !== 200) {
      return NextResponse.json(
        authResult.body,
        { status: authResult.status }
      );
    }
    
    try {
      // Find all trips for this user
      const trips = await Trip.find({ user: authResult.user._id }).sort({ createdAt: -1 });
      
      return NextResponse.json(trips);
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to in-memory if database fails
      const userTrips = inMemoryTrips.filter(trip => 
        trip.user === authResult.user._id || trip.user === authResult.user.id
      );
      
      return NextResponse.json(userTrips);
    }
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// Save a new trip
export async function POST(request) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult.status !== 200) {
      return NextResponse.json(
        authResult.body,
        { status: authResult.status }
      );
    }
    
    const { start, destination, startCoords, destCoords, stops } = await request.json();
    
    // Validate input
    if (!start || !destination || !startCoords || !destCoords || !stops) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    try {
      // Create new trip
      const newTrip = new Trip({
        user: authResult.user._id,
        start,
        destination,
        startCoords,
        destCoords,
        stops
      });
      
      // Save trip to database
      await newTrip.save();
      
      // Add trip to user's trips array
      await User.findByIdAndUpdate(
        authResult.user._id,
        { $push: { trips: newTrip._id } }
      );
      
      return NextResponse.json(newTrip, { status: 201 });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to in-memory if database fails
      const newTrip = {
        id: Date.now().toString(),
        user: authResult.user._id || authResult.user.id,
        start,
        destination,
        startCoords,
        destCoords,
        stops,
        createdAt: new Date()
      };
      
      inMemoryTrips.push(newTrip);
      
      return NextResponse.json(newTrip, { status: 201 });
    }
  } catch (error) {
    console.error('Save trip error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 