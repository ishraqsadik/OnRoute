# OnRoute - AI Road Trip Planner

OnRoute is an AI-powered road trip planning application that helps users find the best restaurants and gas stations along their route.

## Project Structure

This project consists of two main parts:

1. **Frontend**: Next.js application with TailwindCSS for styling
2. **Backend**: Express.js server with authentication and API endpoints

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Google Maps API key

### Environment Variables

#### Frontend

Create a `.env.local` file in the `ai-roadtrip-frontend` directory with:

```
GOOGLE_API_KEY=your_google_maps_api_key
API_URL=http://localhost:3001/api
```

Note: The key must be named `GOOGLE_API_KEY` (not `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).

#### Backend

Create a `.env` file in the `ai-roadtrip-backend` directory with:

```
PORT=3001
JWT_SECRET=your-jwt-secret-key-should-be-long-and-secure
```

### Installation and Running

#### Option 1: Frontend Only (Recommended for initial development)

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

## Troubleshooting

### Google Maps API Issues

If you encounter errors with Google Maps:

1. **Make sure your API key is correct** and has the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Directions API

2. **Check variable names**: The app looks for `GOOGLE_API_KEY` in the environment variables.

3. **API Key Restrictions**: If you set domain restrictions on your API key, make sure `localhost` is included.

### Network Errors

If you see "Network Error" messages:
- This is expected when the backend is not running.
- The app will still work using fallback mock data.
- To remove these errors, start the backend server.

## Development Notes

- The backend currently uses in-memory storage for development. For production, uncomment and configure the MongoDB connection.
- Google Maps integration requires a valid API key with Maps JavaScript API and Places API enabled. 