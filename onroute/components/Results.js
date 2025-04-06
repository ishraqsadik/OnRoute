import React from 'react';
import MapView from './MapView';

const Results = ({ route, tripData, onBackToForm }) => {
  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Your Recommended Stops</h2>
      <button 
        onClick={onBackToForm}
        className="mb-4 text-blue-600 hover:underline flex items-center"
      >
        ← Back to Form
      </button>
      <div className="mb-6">
        <p className="font-semibold">Trip Details:</p>
        <p>From: {tripData?.start}</p>
        <p>To: {tripData?.destination}</p>
        <p>Fuel Status: {tripData?.fuelStatus} miles</p>
      </div>
      {route?.stops && <MapView stops={route.stops} />}
      {route?.googleMapsLink && (
        <button
          onClick={() => window.open(route.googleMapsLink)}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Open in Google Maps
        </button>
      )}
    </div>
  );
};

export default Results; 