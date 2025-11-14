import { useState, useCallback, useEffect } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';
import Navbar from '../components/Navbar';

// Main "planner" view: combines search, forecast cards, and background theming.
export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState(''); // Mirrors the characters typed into the navbar search input
  const [searchResults, setSearchResults] = useState([]); // Backing data for the results rail rendered on the left
  const [weatherType, setWeatherType] = useState('default'); // Drives the background gradient on the page
  const [location, setLocation] = useState(() => {
    // When the Dashboard first mounts, try to hydrate the user's preferred location
    // from Settings. This lets the forecast appear instantly without re-searching.
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        // Ensure we have all required fields
        if (parsed.name && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse default location data:', e);
      }
    }
    // Fall back to the same default used on the landing page so the UI has sensible data.
    return {
      name: 'Olney, Philadelphia',
      latitude: 40.03,
      longitude: -75.13,
    };
  });

  // Load default location on mount (in case it was updated in another tab/window)
  useEffect(() => {
    // Sync with changes another tab might make to the saved default location
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        // Ensure we have all required fields
        if (parsed.name && parsed.latitude && parsed.longitude) {
          setLocation(parsed);
        }
      } catch (e) {
        console.error('Failed to parse default location data:', e);
      }
    }
  }, []);

  // Apply weather-based background
  useEffect(() => {
    // Remove all weather background classes
    document.body.classList.remove(
      'weather-clear',
      'weather-cloudy',
      'weather-rain',
      'weather-snow',
      'weather-thunderstorm',
      'weather-hot',
      'weather-cold',
      'weather-default'
    );
    
    // Add current weather class
    if (weatherType) {
      document.body.classList.add(`weather-${weatherType}`);
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove(
        'weather-clear',
        'weather-cloudy',
        'weather-rain',
        'weather-snow',
        'weather-thunderstorm',
        'weather-hot',
        'weather-cold',
        'weather-default'
      );
    };
  }, [weatherType]);

  // Debounced by the caller (Enter key / button) and memoized to avoid re-renders of children.
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // Treat blank input as "clear the list" so stale data does not linger under the field.
      setSearchResults([]);
      return;
    }

    try {
      // Using Open-Meteo's Geocoding API
      const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;
      const response = await fetch(geoApiUrl);

      if (!response.ok) {
        throw new Error(`Geocoding API error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if API returned an error
      if (data.error) {
        throw new Error(data.reason || 'Geocoding API returned an error');
      }

      if (data.results && Array.isArray(data.results)) {
        // Validate results have required fields
        const validResults = data.results.filter(result => 
          result.name && 
          typeof result.latitude === 'number' && 
          typeof result.longitude === 'number'
        );
        setSearchResults(validResults);
        // Automatically select the first valid result for the weather cards
        // so the forecast updates immediately while the user skims the options.
        if (validResults.length > 0) {
          setLocation(validResults[0]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch location data:", error);
      setSearchResults([]);
      // You could show an error message to the user here if needed
    }
  }, [searchQuery]);

  return (
    <>

      <Navbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchAllowed={true}
      />

      <main className="main-content">
        {/* Result list lets the user explicitly choose a location; selection updates `location` */}
        <SearchResults results={searchResults} onSelectLocation={setLocation} />
        {/* WeatherCards fetches + renders the hourly forecast and reports the dominant weather back up */}
        <WeatherCards location={location} onWeatherChange={setWeatherType} />
      </main>
      
    </>
  );
}