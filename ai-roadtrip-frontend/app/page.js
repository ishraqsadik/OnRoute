'use client';
import { useState, useEffect } from 'react';
import TripForm from '@/components/TripForm';
import MapView from '@/components/MapView';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import { getRecommendations } from '@/lib/api';
import { isAuthenticated, logout } from '@/lib/auth';

export default function Home() {
  const [currentView, setCurrentView] = useState('landing');
  const [isAnimating, setIsAnimating] = useState(false);
  const [route, setRoute] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleViewChange = (newView) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentView(newView);
      setIsAnimating(false);
    }, 500); // Animation duration
  };

  const handleFormSubmit = async (formData) => {
    setTripData(formData);
    handleViewChange('loading');
    
    try {
      const response = await getRecommendations(formData);
      setRoute(response.route);
      handleViewChange('results');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // If we have a message to show the user, display it
      handleViewChange('results');
    }
  };

  const resetToHome = () => {
    handleViewChange('landing');
    setRoute(null);
    setTripData(null);
  };

  const handleLogin = () => {
    handleViewChange('login');
  };

  const handleSignup = () => {
    handleViewChange('signup');
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    resetToHome();
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation header */}
      <header className="p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold cursor-pointer" onClick={resetToHome}>OnRoute</h1>
        <div>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-blue-600 hover:underline">Logout</button>
          ) : (
            <div className="space-x-4">
              <button onClick={handleLogin} className="text-blue-600 hover:underline">Login</button>
              <button onClick={handleSignup} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={`transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        {currentView === 'landing' && (
          <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
            <h1 className="text-5xl font-bold mb-6">AI Road Trip Planner</h1>
            <p className="text-xl mb-8 max-w-2xl">Plan your perfect road trip with AI-powered recommendations for restaurants and gas stations along your route.</p>
            <button 
              onClick={() => handleViewChange('form')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors"
            >
              Plan Your Trip
            </button>
          </div>
        )}

        {currentView === 'form' && (
          <div className="py-8 px-4 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Plan Your Road Trip</h2>
            <button 
              onClick={resetToHome}
              className="mb-4 text-blue-600 hover:underline flex items-center"
            >
              ← Back to Home
            </button>
            <TripForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {currentView === 'loading' && (
          <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-xl">Planning your perfect road trip...</p>
          </div>
        )}

        {currentView === 'login' && (
          <div className="py-8 px-4 max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
            <button 
              onClick={resetToHome}
              className="mb-4 text-blue-600 hover:underline flex items-center"
            >
              ← Back to Home
            </button>
            <LoginForm onLogin={() => {
              setIsLoggedIn(true);
              handleViewChange('form');
            }} />
          </div>
        )}

        {currentView === 'signup' && (
          <div className="py-8 px-4 max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Sign Up</h2>
            <button 
              onClick={resetToHome}
              className="mb-4 text-blue-600 hover:underline flex items-center"
            >
              ← Back to Home
            </button>
            <SignupForm onSignup={() => {
              setIsLoggedIn(true);
              handleViewChange('form');
            }} />
          </div>
        )}

        {currentView === 'results' && route && (
          <div className="py-8 px-4 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">Your Recommended Stops</h2>
            <button 
              onClick={() => handleViewChange('form')}
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
            <MapView stops={route.stops} />
            <button
              onClick={() => window.open(route.googleMapsLink)}
              className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Open in Google Maps
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
