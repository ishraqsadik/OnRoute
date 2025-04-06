'use client';
import { useState, useEffect } from 'react';
import TripForm from '@/components/TripForm';
import MapView from '@/components/MapView';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import Results from '@/components/Results';
import UserPreferences from '@/components/UserPreferences';
import ScriptLoader from '@/components/ScriptLoader';
import { getRecommendations } from '@/lib/api';
import { isAuthenticated, logout } from '@/lib/auth';
import AuthSuccess from '@/components/AuthSuccess';

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

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    
    // Show success message briefly
    setCurrentView('authSuccess');
    
    // Then redirect to form after 1.5 seconds
    setTimeout(() => {
      handleViewChange('form');
    }, 1500);
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Include ScriptLoader for debugging Google Maps */}
      <ScriptLoader />
      
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
          <div className="mt-8 w-full max-w-md">
            <button 
              onClick={resetToHome} 
              className="text-white hover:text-gray-200 flex items-center mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              ← Back to Home
            </button>
            <LoginForm onLogin={handleAuthSuccess} onSignupClick={() => handleViewChange('signup')} />
          </div>
        )}

        {currentView === 'signup' && (
          <div className="mt-8 w-full max-w-md">
            <button 
              onClick={resetToHome} 
              className="text-white hover:text-gray-200 flex items-center mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              ← Back to Home
            </button>
            <SignupForm onSignup={handleAuthSuccess} onLoginClick={() => handleViewChange('login')} />
          </div>
        )}

        {currentView === 'results' && route && (
          <Results 
            route={route} 
            tripData={tripData} 
            onBackToForm={() => handleViewChange('form')} 
          />
        )}

        {currentView === 'authSuccess' && (
          <div className="w-full max-w-md">
            <AuthSuccess />
          </div>
        )}
      </div>
    </main>
  );
}
