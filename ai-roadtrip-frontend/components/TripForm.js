'use client';
import { useState, useEffect, useRef } from 'react';

export default function TripForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    start: '',
    destination: '',
    fuelStatus: ''
  });
  
  const startInputRef = useRef(null);
  const destInputRef = useRef(null);
  const [startAutocomplete, setStartAutocomplete] = useState(null);
  const [destAutocomplete, setDestAutocomplete] = useState(null);

  // Initialize Google Places Autocomplete after component mounts
  useEffect(() => {
    // First verify the API key exists
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key is missing or invalid. Autocomplete will not work.');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      // Initialize autocomplete for start location
      const startAuto = new window.google.maps.places.Autocomplete(startInputRef.current, {
        types: ['geocode']
      });
      startAuto.addListener('place_changed', () => {
        const place = startAuto.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            start: place.formatted_address
          }));
        }
      });
      setStartAutocomplete(startAuto);

      // Initialize autocomplete for destination
      const destAuto = new window.google.maps.places.Autocomplete(destInputRef.current, {
        types: ['geocode']
      });
      destAuto.addListener('place_changed', () => {
        const place = destAuto.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            destination: place.formatted_address
          }));
        }
      });
      setDestAutocomplete(destAuto);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      // Fallback for backward compatibility
      localStorage.setItem('tripData', JSON.stringify(formData));
      window.location.href = '/trip/results';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
      <input 
        name="start"
        ref={startInputRef}
        value={formData.start}
        onChange={handleChange}
        placeholder="Start Location" 
        required 
        className="w-full p-2 border mb-4 rounded-md" 
      />
      <input 
        name="destination"
        ref={destInputRef}
        value={formData.destination}
        onChange={handleChange}
        placeholder="Destination" 
        required 
        className="w-full p-2 border mb-4 rounded-md" 
      />
      <input 
        name="fuelStatus"
        value={formData.fuelStatus}
        onChange={handleChange}
        placeholder="Fuel Status (miles left)" 
        required 
        className="w-full p-2 border mb-4 rounded-md" 
      />
      <button 
        type="submit" 
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        Get Recommendations
      </button>
    </form>
  );
}
