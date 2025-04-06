import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, inMemoryUsers } from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Hash a password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a password with a hashed password
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Get user from request
 */
export async function getUserFromRequest(req) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }
    
    // Get user from database
    try {
      const user = await User.findById(decoded.id).select('-password');
      return user;
    } catch (dbError) {
      // Fallback to in-memory if database fails
      const memoryUser = inMemoryUsers.find(user => user.id === decoded.id);
      if (memoryUser) {
        const { password, ...userWithoutPassword } = memoryUser;
        return userWithoutPassword;
      }
      return null;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Middleware to authenticate request
 * Use with Next.js route handlers
 */
export async function authenticate(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { status: 401, body: { message: 'Unauthorized' }};
  }
  return { status: 200, user };
} 