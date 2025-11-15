import { useState, useCallback, useEffect } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';
import Navbar from '../components/Navbar';

// Main "planner" view: combines search, forecast cards, and background theming.
export default function Dashboard() {
  // Tracks what the user types in the search bar
  const [searchQuery, setSearchQuery] = useState('');

  // Stores the array of results coming back from the geocoding API
  const [searchResults, setSearchResults] = useState([]);

  // The simplified weather category used to update the background
  const [weatherType, setWeatherType] = useState('default');

  // The currently selected location object { name, latitude, longitude }
  const [location, setLocation] = useState(() => {
    // When the Dashboard first mounts, try to hydrate the user's preferred location
    // from Settings. This lets the forecast appear instantly without re-searching.
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        // Make sure the saved object has the required fields
        if (parsed.name && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      } catch (e) {
        console.error('Could not read saved default location', e);
      }
    }
    // Fall back to the same default used on the landing page so the UI has sensible data.
    return {
      name: 'Olney, Philadelphia',
      latitude: 40.03,
      longitude: -75.13,
    };
  });

  /**
   * This effect runs once when the page loads.
   * It checks again for an updated default location in case the user
   * changed it in a different browser tab or window.
   */
  useEffect(() => {
    // Sync with changes another tab might make to the saved default location
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        if (parsed.name && parsed.latitude && parsed.longitude) {
          setLocation(parsed);
        }
      } catch (e) {
        console.error('Could not load updated default location', e);
      }
    }
  }, []);

  /**
   * This effect changes the background of the whole website based on the weather type.
   * Steps:
   * 1. Remove all possible weather classes
   * 2. Add the new class for the current weather type
   * 3. Cleanup when the component unmounts
   */
  useEffect(() => {
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

    if (weatherType) {
      document.body.classList.add(`weather-${weatherType}`);
    }

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

  /**
   * Called when the user presses enter or clicks search in the Navbar.
   * Debounced by the caller (Enter key / button) and memoized to avoid re-renders of children.
   * It:
   * - Sends the searchQuery to the Open-Meteo geocoding API
   * - Filters results to only keep valid ones
   * - Saves them to searchResults
   * - Automatically selects the first valid result for WeatherCards
   */
  const handleSearch = useCallback(async () => {
    // If the search box is empty, clear the results
    if (!searchQuery.trim()) {
      // Treat blank input as "clear the list" so stale data does not linger under the field.
      setSearchResults([]);
      return;
    }

    try {
      // Build the API url
      const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding API error, status: ${response.status}`);
      }

      const data = await response.json();

      // The API sometimes returns an error object instead of results
      if (data.error) {
        throw new Error(data.reason || 'Geocoding API returned an error');
      }

      // Make sure results is an array before using it
      if (Array.isArray(data.results)) {
        // Only keep results that contain the required fields
        const valid = data.results.filter(item =>
          item.name &&
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
        );
        setSearchResults(valid);

        // Automatically select the first valid result for the weather cards
        // so the forecast updates immediately while the user skims the options.
        if (valid.length > 0) {
          setLocation(valid[0]);
        }
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Could not fetch geocoding results', error);
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <>
      {/* Navbar handles the search bar and search button */}
      <Navbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchAllowed={true}
      />

      <main className="main-content">
        {/* Result list lets the user explicitly choose a location; selection updates `location` */}
        <SearchResults
          results={searchResults}
          onSelectLocation={setLocation}
        />
        {/* WeatherCards fetches + renders the hourly forecast and reports the dominant weather back up */}
        <WeatherCards
          location={location}
          onWeatherChange={setWeatherType}
        />
      </main>
    </>
  );
}
