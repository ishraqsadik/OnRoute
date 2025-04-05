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

// Connect to MongoDB (if you have MongoDB setup)
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// Define User Schema (if using MongoDB)
// const UserSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   preferences: { type: Object, default: {} }
// });
// 
// const User = mongoose.model('User', UserSchema);

// For development, store users in memory
const users = [];

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      preferences: {}
    };
    
    users.push(newUser);
    
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
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(user => user.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    preferences: user.preferences
  });
});

// API route for trip recommendations
app.post('/api/getRecommendations', (req, res) => {
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