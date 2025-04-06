import { NextResponse } from 'next/server';
import { connectToDatabase, User, inMemoryUsers } from '../../lib/mongodb';
import { comparePassword, generateToken } from '../../lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing email or password' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    try {
      // Find user in database
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 400 }
        );
      }
      
      // Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 400 }
        );
      }
      
      // Generate JWT
      const token = generateToken(user);
      
      return NextResponse.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to in-memory if database fails
      try {
        // Find user in memory
        const user = inMemoryUsers.find(user => user.email === email);
        if (!user) {
          return NextResponse.json(
            { message: 'Invalid credentials' },
            { status: 400 }
          );
        }
        
        // Check password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { message: 'Invalid credentials' },
            { status: 400 }
          );
        }
        
        // Generate JWT
        const token = generateToken(user);
        
        return NextResponse.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      } catch (fallbackError) {
        console.error('Fallback login error:', fallbackError);
        return NextResponse.json(
          { message: 'Server error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 