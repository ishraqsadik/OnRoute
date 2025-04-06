'use client';
import { useEffect } from 'react';

export default function ScriptLoader() {
  useEffect(() => {
    // Check if Google Maps script loaded correctly
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google Maps libraries detected on page load');
    } else {
      console.error('Google Maps libraries not detected on page load');
      
      // Attempt to manually load Google Maps if needed
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('Google Maps libraries detected after interval check');
          clearInterval(checkInterval);
        }
      }, 1000);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          console.error('Google Maps Places library still not available after 10 seconds');
        }
      }, 10000);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
} 