import { NextResponse } from 'next/server';
import { connectToDatabase, User, inMemoryUsers } from '../../lib/mongodb';
import { hashPassword, generateToken } from '../../lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        );
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        preferences: {
          foodPreferences: [],
          favoriteChains: [],
          dietaryRestrictions: []
        }
      });
      
      // Save user to database
      await newUser.save();
      
      // Generate JWT
      const token = generateToken(newUser);
      
      return NextResponse.json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        }
      }, { status: 201 });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to in-memory if database fails
      try {
        // Check if user exists in memory
        const existingUser = inMemoryUsers.find(user => user.email === email);
        if (existingUser) {
          return NextResponse.json(
            { message: 'User already exists' },
            { status: 400 }
          );
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create new user in memory
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password: hashedPassword,
          preferences: {
            foodPreferences: [],
            favoriteChains: [],
            dietaryRestrictions: []
          }
        };
        
        inMemoryUsers.push(newUser);
        
        // Generate JWT
        const token = generateToken(newUser);
        
        return NextResponse.json({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          }
        }, { status: 201 });
      } catch (fallbackError) {
        console.error('Fallback signup error:', fallbackError);
        return NextResponse.json(
          { message: 'Server error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 