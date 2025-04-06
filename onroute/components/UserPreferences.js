import React, { useState, useEffect } from 'react';

const UserPreferences = ({ onSave, onCancel }) => {
  const [preferences, setPreferences] = useState({
    foodTypes: [],
    favoriteChains: [],
    dietaryRestrictions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Food type options
  const foodTypeOptions = [
    'Fast Food', 'American', 'Italian', 'Mexican', 'Asian', 
    'Indian', 'Mediterranean', 'Breakfast', 'BBQ', 'Vegetarian'
  ];

  // Chain restaurant options
  const chainOptions = [
    'McDonald\'s', 'Burger King', 'Wendy\'s', 'Taco Bell', 
    'Chipotle', 'Subway', 'Starbucks', 'Dunkin\'', 'Panera Bread',
    'Chick-fil-A', 'KFC', 'Pizza Hut', 'Domino\'s', 'Papa John\'s'
  ];

  // Dietary restriction options
  const dietaryRestrictionOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
    'Nut-Free', 'Kosher', 'Halal', 'Pescatarian', 'Low-Carb', 'Keto'
  ];

  useEffect(() => {
    // Load saved preferences from localStorage
    try {
      const savedPrefs = localStorage.getItem('user_preferences');
      if (savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs);
        if (parsedPrefs.foodPreferences) {
          setPreferences({
            foodTypes: parsedPrefs.foodPreferences.foodTypes || [],
            favoriteChains: parsedPrefs.foodPreferences.favoriteChains || [],
            dietaryRestrictions: parsedPrefs.foodPreferences.dietaryRestrictions || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  const handleToggleOption = (category, option) => {
    setPreferences(prev => {
      const newArray = [...prev[category]];
      if (newArray.includes(option)) {
        return {
          ...prev,
          [category]: newArray.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          [category]: [...newArray, option]
        };
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Save to localStorage for now
      const currentPrefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      const updatedPrefs = {
        ...currentPrefs,
        foodPreferences: {
          foodTypes: preferences.foodTypes,
          favoriteChains: preferences.favoriteChains,
          dietaryRestrictions: preferences.dietaryRestrictions
        }
      };
      
      localStorage.setItem('user_preferences', JSON.stringify(updatedPrefs));
      
      // In a real app, you would send this to your backend API
      // await api.post('/user/preferences', preferences);
      
      setMessage('Preferences saved successfully!');
      if (onSave) onSave(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Food Preferences</h2>
      
      {message && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Favorite Food Types</h3>
        <div className="flex flex-wrap gap-2">
          {foodTypeOptions.map(option => (
            <button
              key={option}
              onClick={() => handleToggleOption('foodTypes', option)}
              className={`px-3 py-1 rounded-full text-sm ${
                preferences.foodTypes.includes(option)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Favorite Restaurants/Chains</h3>
        <div className="flex flex-wrap gap-2">
          {chainOptions.map(option => (
            <button
              key={option}
              onClick={() => handleToggleOption('favoriteChains', option)}
              className={`px-3 py-1 rounded-full text-sm ${
                preferences.favoriteChains.includes(option)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Dietary Restrictions</h3>
        <div className="flex flex-wrap gap-2">
          {dietaryRestrictionOptions.map(option => (
            <button
              key={option}
              onClick={() => handleToggleOption('dietaryRestrictions', option)}
              className={`px-3 py-1 rounded-full text-sm ${
                preferences.dietaryRestrictions.includes(option)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default UserPreferences; 