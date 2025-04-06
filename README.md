# OnRoute - AI Road Trip Planner

OnRoute is an AI-powered road trip planning application that helps users find the best restaurants and gas stations along their route.

## Project Structure

This project consists of two main parts:

1. **Frontend**: Next.js application with TailwindCSS for styling
2. **Backend**: Express.js server with MongoDB and authentication

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Google Maps API key
- MongoDB (local or MongoDB Atlas)

### Environment Variables

#### Frontend

Create a `.env.local` file in the `ai-roadtrip-frontend` directory with:

```
GOOGLE_API_KEY=your_google_maps_api_key
API_URL=http://localhost:3001/api
```

Note: The key must be named `GOOGLE_API_KEY`.

#### Backend

Create a `.env` file in the `ai-roadtrip-backend` directory with:

```
PORT=3001
JWT_SECRET=your-jwt-secret-key-should-be-long-and-secure
MONGODB_URI=your_mongodb_connection_string
```

### MongoDB Setup

The application uses MongoDB to store user data, preferences, and trip history. You have two options:

#### Option 1: MongoDB Atlas (Cloud)

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (free tier is fine)
3. Set up database access (create a username and password)
4. Configure network access (allow connections from your IP address)
5. Get your connection string and add it to the `.env` file

For detailed instructions, see [ai-roadtrip-backend/MONGODB_SETUP.md](ai-roadtrip-backend/MONGODB_SETUP.md)

#### Option 2: Local MongoDB

1. Install MongoDB Community Edition on your machine
2. Start the MongoDB service
3. Set up a database and user
4. Use a connection string like: `mongodb://username:password@localhost:27017/onroute`

### Installation and Running

#### Option 1: Frontend Only (Development)

If you're just working on the frontend and don't need the backend yet:

```bash
cd ai-roadtrip-frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000. The application includes fallback mocks for API responses, so it will work without the backend running.

#### Option 2: Full Stack

To run both frontend and backend:

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Frontend
npm run frontend

# Terminal 2 - Backend
npm run backend
```

## Current Features

- **Authentication**: User signup, login, and profile management
- **Trip Planning**: Route planning with Google Maps integration
- **Location Autocomplete**: Suggestions when typing start and destination locations
- **Interactive Map**: Display routes with markers for recommended stops
- **Database Storage**: Save user preferences and trip history
- **User Preferences**: Store food preferences for better recommendations

## Troubleshooting

### Google Maps API Issues

If you encounter errors with Google Maps:

1. **Make sure your API key is correct** and has the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Directions API

2. **Check variable names**: The app looks for `GOOGLE_API_KEY` in the environment variables.

3. **API Key Restrictions**: If you set domain restrictions on your API key, make sure `localhost` is included.

### MongoDB Connection Issues

If you see MongoDB connection errors:

1. **Check your connection string** in the `.env` file
2. **Verify network connectivity** and firewall settings
3. **Ensure your IP address** is allowed in MongoDB Atlas Network Access settings
4. **Check database user permissions**

For more detailed MongoDB troubleshooting, see [ai-roadtrip-backend/MONGODB_SETUP.md](ai-roadtrip-backend/MONGODB_SETUP.md)

## Development Notes

- The backend uses MongoDB to store user data, preferences, and trip history
- The application includes fallback to in-memory storage if MongoDB connection fails
- Google Maps integration requires a valid API key with Maps JavaScript API and Places API enabled 