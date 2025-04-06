from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
from coords import (
    get_travel_suggestions,
    build_travel_plan_with_restaurants,
    find_similar_restaurants,
    build_faiss_index_for_restaurants
)

app = FastAPI()

# Configure CORS to allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update this URL as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for travel suggestions
class TravelRequest(BaseModel):
    source: str
    destination: str
    start_time: str

# Request model for restaurant search
class RestaurantSearchRequest(BaseModel):
    query: str
    source: Optional[str] = None
    destination: Optional[str] = None
    start_time: Optional[str] = None

# Combined request model for travel plan with restaurants
class CombinedRequest(BaseModel):
    source: str
    destination: str
    start_time: str
    restaurant_query: Optional[str] = None

@app.post("/api/travel-plan")
async def get_travel_plan(request: TravelRequest):
    try:
        result = get_travel_suggestions(
            source=request.source,
            destination=request.destination,
            start_time_str=request.start_time
        )
        travel_data = json.loads(result)
        return {
            "status": "success",
            "data": travel_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/restaurant-search")
async def search_restaurants(request: RestaurantSearchRequest):
    try:
        if request.source and request.destination and request.start_time:
            final_output = build_travel_plan_with_restaurants(request.source, request.destination, request.start_time)
            index, restaurant_texts = build_faiss_index_for_restaurants(final_output)
            results = find_similar_restaurants(request.query, index, restaurant_texts, final_output)
        else:
            raise ValueError("Source, destination, and start_time must be provided for restaurant search.")
        return {
            "status": "success",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/travel-plan-with-restaurants")
async def get_travel_plan_with_restaurants(request: CombinedRequest):
    try:
        final_output = build_travel_plan_with_restaurants(request.source, request.destination, request.start_time)
        restaurant_suggestions = None
        if request.restaurant_query:
            index, restaurant_texts = build_faiss_index_for_restaurants(final_output)
            restaurant_suggestions = find_similar_restaurants(request.restaurant_query, index, restaurant_texts, final_output)
        return {
            "status": "success",
            "data": {
                "travel_plan": final_output,
                "restaurant_suggestions": restaurant_suggestions
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))  # Default to 8000 if PORT is not set
    uvicorn.run(app, host="0.0.0.0", port=port)