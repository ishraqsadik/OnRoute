# OnRoute: AI-Powered Road Trip Planner

OnRoute is an intelligent travel companion that uses AI to plan the perfect road trip, recommending personalized stops for restaurants, attractions, and rest areas based on your route and preferences.

## Project Overview

This project integrates two main components:
1. **Next.js Frontend**: A modern web application for planning your trip
2. **Python Llama Agent**: An intelligent AI model that provides stop recommendations

## Quick Setup

Follow these steps to run both the AI agent and the frontend application.

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+ with pip
- Google Maps API Key (for geocoding and maps)

### Step 1: Start the Python Llama Agent

First, set up and start the AI recommendation engine:

```bash
# Clone and navigate to the Python API directory (if separate repo)
# cd llama-api

# Install required packages
pip install fastapi uvicorn googlemaps polyline llama-index-core sentence-transformers faiss-cpu numpy python-dotenv

# Set your Google Maps API key
# On Linux/Mac:
export GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# On Windows:
set GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Start the server
# If using the included main.py:
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or if you're using the code from the original request:
# python -c "from coords import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

The Llama API will run on http://localhost:8000

### Step 2: Start the Next.js Frontend

Next, set up and start the web application:

```bash
# Navigate to the frontend directory
cd onroute

# Install dependencies
npm install

# Create a .env.local file with your API keys
echo "NEXT_PUBLIC_GOOGLE_API_KEY=your_google_maps_api_key_here" > .env.local
echo "NEXT_PUBLIC_LLAMA_API_URL=http://localhost:8000" >> .env.local
echo "NEXT_PUBLIC_USE_LLAMA_MODEL=true" >> .env.local

# Start the development server
npm run dev
```

The web application will run on http://localhost:3000

## How to Use OnRoute

1. **Navigate to the homepage**: Open your browser to http://localhost:3000

2. **Plan Your Trip**:
   - Enter your starting point (with autocomplete)
   - Enter your destination (with autocomplete)
   - Enter your car's current fuel range
   - Optionally, check "I want to write my own prompt for recommendations" to customize your stops

3. **View Your Recommendations**:
   - See your route plotted on the map
   - View recommended stops (restaurants, gas stations, attractions)
   - If using a custom prompt, select from the AI-recommended restaurants to add to your route

4. **Navigate Your Route**:
   - Click "Open in Google Maps" to start navigating with all stops included
   - All your selected stops will appear as waypoints in Google Maps

## API Documentation

### Next.js API Routes

- `GET /api/public/getRecommendations`: Get route recommendations without authentication
- `GET /api/getRecommendations`: Get route recommendations (authenticated)
- `GET /debug`: Check API connection status

### Llama API Endpoints

- `GET /health`: Verify the API is running
- `POST /api/travel-plan`: Get route with recommended stops
- `POST /api/restaurant-search`: Search for restaurants with natural language
- `POST /api/travel-plan-with-restaurants`: Combined endpoint for route planning with restaurant recommendations

#### Example for testing the Llama API directly:

```bash
curl -X POST http://localhost:8000/api/travel-plan \
  -H "Content-Type: application/json" \
  -d '{"source":"Tampa, FL", "destination":"Miami, FL", "start_time":"1:00 PM"}'
```

## Implementation Details

- The frontend uses Next.js with React and Tailwind CSS
- The backend uses FastAPI with the Llama model for intelligent recommendations
- We use Google Maps for geocoding, routing and display
- The UI is responsive and works on mobile devices

Thank you for reviewing our project!
