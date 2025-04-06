import mongoose from 'mongoose';

// Track connection status to avoid reconnecting
const connectionState = {
  isConnected: false,
};

/**
 * Connect to MongoDB
 */
export async function connectToDatabase() {
  // If already connected, return existing connection
  if (connectionState.isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    // Get MongoDB connection string from environment variables
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      throw new Error('MONGODB_URI not found');
    }
    
    console.log('Connecting to MongoDB...');
    
    // Set strictQuery to false to prevent errors with unknown fields
    mongoose.set('strictQuery', false);
    
    // Configure connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(uri, options);
    
    connectionState.isConnected = !!connection.connections[0].readyState;
    
    console.log('MongoDB connected successfully with readyState:', connection.connections[0].readyState);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // Reset connection state so that we can try again
    connectionState.isConnected = false;
    throw error;
  }
}

// Define User Schema
export const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferences: {
    foodPreferences: { type: Array, default: [] },
    favoriteChains: { type: Array, default: [] },
    dietaryRestrictions: { type: Array, default: [] }
  },
  trips: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip' 
  }],
  createdAt: { type: Date, default: Date.now }
});

// Define Trip Schema to store past trips
export const TripSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  start: { type: String, required: true },
  destination: { type: String, required: true },
  startCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  stops: [{
    name: { type: String, required: true },
    type: { type: String, required: true }, // 'restaurant', 'gas', etc.
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: { type: String },
    rating: { type: Number },
    priceLevel: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

// Store users in memory as fallback if MongoDB connection fails
export let inMemoryUsers = [];
export let inMemoryTrips = []; 