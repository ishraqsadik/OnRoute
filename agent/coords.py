import googlemaps
import json
import polyline
from datetime import datetime, timedelta
from llama_index.core.tools import FunctionTool
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from llama_index.core import Settings


# Use an environment variable for the API key
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY")) 

def get_travel_suggestions(source: str, destination: str, start_time_str: str) -> str:
    """
    Provides travel suggestions with approximate stop coordinates.
    """
    try:
        start_time = datetime.strptime(start_time_str, "%I:%M %p")
        directions = gmaps.directions(source, destination)
        if not directions:
            return json.dumps({"error": "No route found"})

        leg = directions[0]['legs'][0]
        duration_sec = leg['duration']['value']
        distance_meters = leg['distance']['value']
        polyline_str = directions[0]['overview_polyline']['points']
        decoded_points = polyline.decode(polyline_str)

        total_duration = timedelta(seconds=duration_sec)
        end_time = start_time + total_duration
        stops = []

        def get_coords(seconds_from_start):
            fraction = min(seconds_from_start / duration_sec, 1.0)
            index = int(fraction * (len(decoded_points) - 1))
            return {
                "latitude": round(decoded_points[index][0], 5),
                "longitude": round(decoded_points[index][1], 5)
            }

        # Meal time suggestions
        meal_windows = {
            "Breakfast": (7, 9, 30*60),
            "Lunch": (12, 14, 30*60),
            "Dinner": (18, 20, 30*60)
        }

        current_hour = start_time.hour
        for meal, (start_h, end_h, delay) in meal_windows.items():
            if start_h <= current_hour < end_h:
                stops.append({
                    "type": meal,
                    "reason": f"Recommended {meal} stop",
                    "time": (start_time + timedelta(seconds=delay)).strftime("%I:%M %p"),
                    "duration_from_start": delay,
                    "coordinates": get_coords(delay)
                })
                break

        # Regular driving breaks every 2 hours
        for interval in range(2*3600, duration_sec, 2*3600):
            stops.append({
                "type": "Coffee Break",
                "reason": "Scheduled driving break",
                "time": (start_time + timedelta(seconds=interval)).strftime("%I:%M %p"),
                "duration_from_start": interval,
                "coordinates": get_coords(interval)
            })

        # Fatigue break for long drives
        if duration_sec > 4*3600:
            fatigue_point = duration_sec // 2
            stops.append({
                "type": "Rest Break",
                "reason": "Mid-journey fatigue prevention",
                "time": (start_time + timedelta(seconds=fatigue_point)).strftime("%I:%M %p"),
                "duration_from_start": fatigue_point,
                "coordinates": get_coords(fatigue_point)
            })

        stops.sort(key=lambda x: x["duration_from_start"])

        return json.dumps({
            "route_summary": {
                "total_duration": str(timedelta(seconds=duration_sec)),
                "total_distance": f"{distance_meters/1000:.1f} km",
                "departure": start_time.strftime("%I:%M %p"),
                "estimated_arrival": end_time.strftime("%I:%M %p")
            },
            "suggested_stops": stops,
            "total_stops": len(stops)
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

# Create LlamaIndex Tool (if needed)
travel_suggestions_tool = FunctionTool.from_defaults(
    fn=get_travel_suggestions,
    name="smart_travel_advisor",
    description="""Provides travel plan with stop locations.
    Input: source, destination, start_time (HH:MM AM/PM).
    Output: JSON with timing, coordinates, and stop reasons."""
)

def find_restaurants_near_coordinate(latitude: float, longitude: float, stop_type: str = None) -> str:
    """
    Finds restaurants or cafes near the given coordinates.
    """
    try:
        if stop_type == "Coffee Break" or stop_type == "Rest Break":
            place_type = ['cafe', 'store']
        else:
            place_type = 'restaurant'

        places_result = gmaps.places_nearby(
            location=(latitude, longitude),
            radius=5000,  # 5km radius
            type=place_type,
            open_now=False
        )

        places = []
        for place in places_result.get('results', []):
            if place_type == 'restaurant' and 'cafe' in place.get('types', []):
                continue
            place_info = {
                "name": place.get('name'),
                "address": place.get('vicinity'),
                "location": place.get('geometry', {}).get('location'),
                "rating": place.get('rating'),
                "price_level": place.get('price_level'),
                "types": place.get('types', []),
                "business_status": place.get('business_status')
            }
            if 'place_id' in place:
                place_info["place_id"] = place['place_id']
            places.append(place_info)

        return json.dumps({
            "search_coordinate": {"lat": latitude, "lng": longitude},
            "places_found": len(places),
            "places": places
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

restaurant_finder_tool = FunctionTool.from_defaults(
    fn=find_restaurants_near_coordinate,
    name="coordinate_restaurant_finder",
    description="""Finds restaurants near geographic coordinates.
    Input: latitude and longitude as floats.
    Output: JSON list of restaurants within 2km radius."""
)

def build_travel_plan_with_restaurants(source: str, destination: str, start_time: str):
    """
    Builds the complete travel plan by getting travel suggestions and adding nearby restaurants for each stop.
    """
    travel_result = get_travel_suggestions(source, destination, start_time)
    travel_data = json.loads(travel_result)
    
    final_output = {
        "route_summary": travel_data.get("route_summary"),
        "stops_with_restaurants": []
    }
    for stop in travel_data.get("suggested_stops", []):
        lat = stop["coordinates"]["latitude"]
        lng = stop["coordinates"]["longitude"]
        restaurant_result = find_restaurants_near_coordinate(lat, lng, stop["type"])
        restaurant_data = json.loads(restaurant_result)
        final_output["stops_with_restaurants"].append({
            "stop_info": stop,
            "places": restaurant_data.get("places", [])
        })
    
    return final_output

# Initialize the embedding model once
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def get_restaurant_embeddings(restaurant_data):
    """
    Generate embeddings for restaurant search texts.
    """
    texts = []
    for entry in restaurant_data["stops_with_restaurants"]:
        for place in entry["places"]:
            text = f"{place['name']} {place['address']} {', '.join(place['types'])}"
            texts.append(text)
    embeddings = embedding_model.encode(texts, normalize_embeddings=True)
    return texts, embeddings

def build_faiss_index_for_restaurants(restaurant_data):
    """
    Build a FAISS index for the restaurant embeddings.
    """
    texts, embeddings = get_restaurant_embeddings(restaurant_data)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    
    
    # Save the FAISS index and metadata
    faiss.write_index(index, "restaurant_index.faiss")
    with open("restaurant_metadata.json", "w") as f:
        json.dump({"texts": texts}, f)
        
    return index, texts

def find_similar_restaurants(query_text, index, restaurant_texts, final_output, k=3):
    """
    Finds similar restaurants based on a query using the provided FAISS index.
    """
    query_embedding = embedding_model.encode([query_text], normalize_embeddings=True)
    k = min(k, len(restaurant_texts))
    distances, indices = index.search(query_embedding, k)
    results = []
    for i in range(len(indices[0])):
        idx = indices[0][i]
        if idx < len(restaurant_texts):
            place_info = None
            for stop in final_output["stops_with_restaurants"]:
                for place in stop["places"]:
                    if f"{place['name']} {place['address']}" in restaurant_texts[idx]:
                        place_info = {
                            "name": place["name"],
                            "rating": place["rating"],
                            "stop_time": stop["stop_info"]["time"],
                            "stop_type": stop["stop_info"]["type"],
                            "address": place["address"]
                        }
                        break
                if place_info:
                    break
            if place_info:
                rating_text = f" with a rating of {place_info['rating']}/5" if place_info['rating'] else ""
                response = (f"You can stop at {place_info['name']}{rating_text} "
                            f"during your {place_info['stop_type'].lower()} at {place_info['stop_time']}. "
                            f"It's located at {place_info['address']}.")
                results.append(response)
    if results:
        combined_response = "Here are some suggestions: \n\n" + "\n\n".join(results)
        return combined_response
    else:
        return "I couldn't find any matching places for your query along the route."

index = faiss.read_index("restaurant_index.faiss")
with open("restaurant_metadata.json", "r") as f:
    metadata = json.load(f)
    texts = metadata["texts"]
