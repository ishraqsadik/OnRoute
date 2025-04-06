"use client";
import { useState, useEffect, useRef } from "react";

export default function TripForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    start: "",
    destination: "",
    fuelStatus: "", // Empty default value for fuel status
    useCustomPrompt: false, // Whether to use custom prompt or auto recommendations
    customPrompt: "", // Custom prompt for the AI
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const startInputRef = useRef(null);
  const destInputRef = useRef(null);
  const [startAutocomplete, setStartAutocomplete] = useState(null);
  const [destAutocomplete, setDestAutocomplete] = useState(null);
  const [autocompleteError, setAutocompleteError] = useState(null);

  // Initialize Google Places Autocomplete after component mounts
  useEffect(() => {
    // Check if Google Maps loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
      } else {
        // If Google Maps isn't loaded yet, check again in 1 second
        console.log("Google Maps not loaded yet, retrying...");
        setTimeout(checkGoogleMapsLoaded, 1000);
      }
    };

    // Initialize autocomplete once Google Maps is loaded
    const initializeAutocomplete = () => {
      try {
        console.log("Initializing autocomplete...");

        // Initialize autocomplete for start location
        const startAuto = new window.google.maps.places.Autocomplete(
          startInputRef.current,
          {
            types: ["geocode"],
          }
        );

        startAuto.addListener("place_changed", () => {
          try {
            const place = startAuto.getPlace();
            console.log("Start place selected:", place);

            if (place && place.formatted_address) {
              setFormData((prev) => ({
                ...prev,
                start: place.formatted_address,
              }));
            }
          } catch (err) {
            console.error("Error in start place_changed:", err);
          }
        });
        setStartAutocomplete(startAuto);

        // Initialize autocomplete for destination
        const destAuto = new window.google.maps.places.Autocomplete(
          destInputRef.current,
          {
            types: ["geocode"],
          }
        );

        destAuto.addListener("place_changed", () => {
          try {
            const place = destAuto.getPlace();
            console.log("Destination place selected:", place);

            if (place && place.formatted_address) {
              setFormData((prev) => ({
                ...prev,
                destination: place.formatted_address,
              }));
            }
          } catch (err) {
            console.error("Error in destination place_changed:", err);
          }
        });
        setDestAutocomplete(destAuto);

        console.log("Autocomplete initialization complete");
        setAutocompleteError(null);
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
        setAutocompleteError(
          "Failed to initialize location autocomplete: " + error.message
        );
      }
    };

    // Start the check
    checkGoogleMapsLoaded();

    // Cleanup function
    return () => {
      // Clean up listeners if needed
      if (startAutocomplete) {
        // No direct way to remove listeners in Google Maps API
        setStartAutocomplete(null);
      }
      if (destAutocomplete) {
        setDestAutocomplete(null);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error if user is fixing the input
    setError(null);
  };

  const validateForm = () => {
    if (!formData.start || !formData.destination) {
      setError("Please enter both start location and destination");
      return false;
    }

    if (
      !formData.fuelStatus ||
      isNaN(formData.fuelStatus) ||
      parseInt(formData.fuelStatus) < 0
    ) {
      setError("Please enter a valid fuel status (positive number)");
      return false;
    }

    if (formData.useCustomPrompt && !formData.customPrompt.trim()) {
      setError("Please enter your custom prompt");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Fallback for backward compatibility
        localStorage.setItem("tripData", JSON.stringify(formData));
        window.location.href = "/trip/results";
      }
    } catch (error) {
      console.error("Error submitting trip data:", error);
      setError(
        error.message || "Failed to process your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
      {autocompleteError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
          <p className="text-sm">{autocompleteError}</p>
          <p className="text-xs mt-1">Check browser console for more details</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="start"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Start Location
        </label>
        <input
          id="start"
          name="start"
          ref={startInputRef}
          value={formData.start}
          onChange={handleChange}
          placeholder="Enter starting point"
          required
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="destination"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Destination
        </label>
        <input
          id="destination"
          name="destination"
          ref={destInputRef}
          value={formData.destination}
          onChange={handleChange}
          placeholder="Enter destination"
          required
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="fuelStatus"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Fuel Status (miles left)
        </label>
        <input
          id="fuelStatus"
          name="fuelStatus"
          type="number"
          min="0"
          value={formData.fuelStatus}
          onChange={handleChange}
          placeholder="Enter remaining fuel range in miles"
          required
          className="w-full p-2 border rounded-md"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the estimated miles left in your gas tank
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            id="useCustomPrompt"
            name="useCustomPrompt"
            type="checkbox"
            checked={formData.useCustomPrompt}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label
            htmlFor="useCustomPrompt"
            className="ml-2 block text-sm font-medium text-gray-700"
          >
            I want to write my own prompt for recommendations
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          {formData.useCustomPrompt
            ? "Write your own prompt to get customized AI recommendations"
            : "Our AI will recommend the top stops based on your route"}
        </p>

        {formData.useCustomPrompt && (
          <textarea
            id="customPrompt"
            name="customPrompt"
            value={formData.customPrompt}
            onChange={handleChange}
            placeholder="Example: Find me authentic Mexican restaurants with vegetarian options"
            className="w-full p-2 border rounded-md h-24"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 rounded-md transition-colors ${
          isSubmitting
            ? "bg-gray-400 text-gray-100 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isSubmitting ? "Processing..." : "Get Recommendations"}
      </button>
    </form>
  );
}
