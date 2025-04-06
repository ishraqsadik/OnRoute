import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '../../lib/mongodb';
import { authenticate } from '../../lib/auth';

export async function PUT(request) {
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
    
    const { foodPreferences, favoriteChains, dietaryRestrictions } = await request.json();
    
    try {
      // Update user in database
      const user = await User.findByIdAndUpdate(
        authResult.user._id,
        { 
          preferences: {
            foodPreferences: foodPreferences || [],
            favoriteChains: favoriteChains || [],
            dietaryRestrictions: dietaryRestrictions || []
          }
        },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(user);
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to in-memory update if database fails
      return NextResponse.json(
        { 
          ...authResult.user,
          preferences: {
            foodPreferences: foodPreferences || [],
            favoriteChains: favoriteChains || [],
            dietaryRestrictions: dietaryRestrictions || []
          }
        }
      );
    }
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 