require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User Schema
const UserSchema = new mongoose.Schema({
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

const User = mongoose.model('User', UserSchema);

// Define Trip Schema to store past trips
const TripSchema = new mongoose.Schema({
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

const Trip = mongoose.model('Trip', TripSchema);

// Store users in memory as fallback if MongoDB connection fails
let inMemoryUsers = [];

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Fallback to in-memory if database fails
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      try {
        const { name, email, password } = req.body;
        
        // Check if user exists in memory
        const existingUser = inMemoryUsers.find(user => user.email === email);
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user in memory
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password: hashedPassword,
          preferences: {}
        };
        
        inMemoryUsers.push(newUser);
        
        // Generate JWT
        const token = jwt.sign(
          { id: newUser.id, email: newUser.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.status(201).json({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          }
        });
      } catch (fallbackError) {
        console.error('Fallback signup error:', fallbackError);
        res.status(500).json({ message: 'Server error' });
      }
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Fallback to in-memory if database fails
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      try {
        const { email, password } = req.body;
        
        // Find user in memory
        const user = inMemoryUsers.find(user => user.email === email);
        if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      } catch (fallbackError) {
        console.error('Fallback login error:', fallbackError);
        res.status(500).json({ message: 'Server error' });
      }
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Protected route to get user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // Find user in database
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    
    // Fallback to in-memory if database fails
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      const user = inMemoryUsers.find(user => user.id === req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update user preferences
app.put('/api/user/preferences', authenticateToken, async (req, res) => {
  try {
    const { foodPreferences, favoriteChains, dietaryRestrictions } = req.body;
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
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
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a trip
app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const { start, destination, startCoords, destCoords, stops } = req.body;
    
    // Create new trip
    const newTrip = new Trip({
      user: req.user.id,
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
      req.user.id,
      { $push: { trips: newTrip._id } }
    );
    
    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Save trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's trips
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    // Find all trips for this user
    const trips = await Trip.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API route for trip recommendations
app.post('/api/getRecommendations', authenticateToken, async (req, res) => {
  try {
    const { start, destination, fuelStatus } = req.body;
    
    // Get user preferences from database
    const user = await User.findById(req.user.id);
    const userPreferences = user ? user.preferences : {};
    
    // This would normally call into your AI recommendation system
    // For now, return mock data
    
    // Simply mock some stops based on the route
    const mockRoute = {
      route: {
        stops: [
          { 
            location: { lat: 40.7128, lng: -74.0060 }, 
            type: 'start', 
            name: start 
          },
          { 
            location: { lat: 40.5, lng: -75.2 }, 
            type: 'restaurant', 
            name: 'Good Eats Restaurant',
            rating: 4.5,
            priceLevel: 2,
            address: '123 Main St, Anytown, USA'
          },
          { 
            location: { lat: 40.2, lng: -76.5 }, 
            type: 'gas', 
            name: 'Quick Fill Gas Station',
            rating: 4.0,
            address: '456 Fuel Ave, Anytown, USA'
          },
          { 
            location: { lat: 39.9526, lng: -75.1652 }, 
            type: 'destination', 
            name: destination 
          }
        ],
        googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(start)}/${encodeURIComponent(destination)}/`
      }
    };
    
    // Simulate API latency
    setTimeout(() => {
      res.json(mockRoute);
    }, 1500);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public route for recommendations (no auth required)
app.post('/api/public/getRecommendations', (req, res) => {
  try {
    const { start, destination, fuelStatus } = req.body;
    
    // This would normally call into your AI recommendation system
    // For now, return mock data
    
    // Simply mock some stops based on the route
    const mockRoute = {
      route: {
        stops: [
          { 
            location: { lat: 40.7128, lng: -74.0060 }, 
            type: 'start', 
            name: start 
          },
          { 
            location: { lat: 40.5, lng: -75.2 }, 
            type: 'restaurant', 
            name: 'Good Eats Restaurant' 
          },
          { 
            location: { lat: 40.2, lng: -76.5 }, 
            type: 'gas', 
            name: 'Quick Fill Gas Station' 
          },
          { 
            location: { lat: 39.9526, lng: -75.1652 }, 
            type: 'destination', 
            name: destination 
          }
        ],
        googleMapsLink: `https://www.google.com/maps/dir/${encodeURIComponent(start)}/${encodeURIComponent(destination)}/`
      }
    };
    
    // Simulate API latency
    setTimeout(() => {
      res.json(mockRoute);
    }, 1500);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 