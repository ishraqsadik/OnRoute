# Troubleshooting Guide

## Google Maps API Issues

### 1. Error: "Event handlers cannot be passed to Client Component props"

This error occurs when trying to use client-side event handlers like `onError` or `onLoad` in a Server Component (like `layout.js`).

**Solution:** 
- We've removed these event handlers from the `Script` component in `layout.js`.
- Added a separate `ScriptLoader.js` Client Component to handle debugging.

### 2. Autocomplete Not Working

If the autocomplete suggestions aren't appearing when typing locations:

**Solutions:**

1. **Check if the Google Maps script is loading correctly:**
   - Open browser DevTools (F12)
   - Look for console messages from `ScriptLoader.js`
   - It should say "Google Maps libraries detected on page load"

2. **Check your API key:**
   - Make sure your `.env.local` file has the correct API key in `GOOGLE_API_KEY`
   - Verify the API key is valid and not restricted
   - Make sure Places API is enabled for this key in Google Cloud Console

3. **Force a refresh and clear cache:**
   - Try hard-refreshing your browser (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache and retry

### 3. Network Error in API Calls

If you see "AxiosError: Network Error" in the console:

**Solution:**
- This is normal when not running the backend server
- The app includes fallback mechanisms to work without the backend
- To eliminate this error, start the backend server with `npm run backend`

## API Key Setup

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Create or select a project**

3. **Enable required APIs:**
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

4. **Create an API key:**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"

5. **Place the key in your .env.local file:**
   ```
   GOOGLE_API_KEY=your_new_api_key_here
   API_URL=http://localhost:3001/api
   ```

6. **Restart your development server after any changes to .env files** 