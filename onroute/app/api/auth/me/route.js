import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';
import { authenticate } from '../../lib/auth';

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
    
    return NextResponse.json(authResult.user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 