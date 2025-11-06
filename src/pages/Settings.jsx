import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  
  // Load settings from localStorage or use defaults
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  
  const [allowUnsuitableTasks, setAllowUnsuitableTasks] = useState(() => {
    const saved = localStorage.getItem('allowUnsuitableTasks');
    return saved === 'true';
  });
  
  const [defaultLocation, setDefaultLocation] = useState(() => {
    const saved = localStorage.getItem('defaultLocation');
    return saved || '';
  });
  
  const [selectedLocationData, setSelectedLocationData] = useState(() => {
    const saved = localStorage.getItem('defaultLocationData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('defaultLocation');
    return saved || '';
  });
  const [searchResults, setSearchResults] = useState([]);

  // Apply dark mode to body element
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Load dark mode on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Handle location search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;
      const response = await fetch(geoApiUrl);

      if (!response.ok) {
        throw new Error(`Geocoding API error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch location data:", error);
      setSearchResults([]);
    }
  };

  // Handle location selection
  const handleSelectLocation = (location) => {
    setDefaultLocation(location.name);
    setSearchQuery(location.name);
    setSearchResults([]);
    // Store the full location data
    setSelectedLocationData({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  // Handle save
  const handleSave = () => {
    localStorage.setItem('darkMode', darkMode.toString());
    localStorage.setItem('allowUnsuitableTasks', allowUnsuitableTasks.toString());
    localStorage.setItem('defaultLocation', defaultLocation);
    
    // Save the full location data if available
    if (selectedLocationData) {
      localStorage.setItem('defaultLocationData', JSON.stringify(selectedLocationData));
    } else if (defaultLocation && searchResults.length > 0) {
      // Fallback: try to find the location in search results
      const foundLocation = searchResults.find(r => r.name === defaultLocation);
      if (foundLocation) {
        localStorage.setItem('defaultLocationData', JSON.stringify({
          name: foundLocation.name,
          latitude: foundLocation.latitude,
          longitude: foundLocation.longitude,
        }));
      }
    }
    
    // Navigate back or show success message
    navigate(-1);
  };

  return (
    <>
      <Navbar 
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchAllowed={false}
      />
      
      <main className="settings-main">
        <div className="settings-panel">
          <h2 className="settings-title">Settings</h2>
          
          {/* Dark Mode Toggle */}
          <div className="setting-item">
            <label className="setting-label">Dark Mode</label>
            <div className="toggle-container">
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="toggle-checkbox"
              />
              <label htmlFor="darkMode" className="toggle-switch">
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{darkMode ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          {/* Allow Unsuitable Tasks Toggle */}
          <div className="setting-item">
            <label className="setting-label">Allow Unsuitable Tasks</label>
            <div className="toggle-container">
              <input
                type="checkbox"
                id="allowUnsuitableTasks"
                checked={allowUnsuitableTasks}
                onChange={(e) => setAllowUnsuitableTasks(e.target.checked)}
                className="toggle-checkbox"
              />
              <label htmlFor="allowUnsuitableTasks" className="toggle-switch">
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{allowUnsuitableTasks ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          {/* Default Location Input */}
          <div className="setting-item">
            <label className="setting-label">Default Location</label>
            <div className="location-input-container">
              <input
                type="text"
                className="location-input"
                placeholder="Search Location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="location-results">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="location-result-item"
                      onClick={() => handleSelectLocation(result)}
                    >
                      <span className="location-icon">📍</span>
                      <span className="location-name">{result.name}</span>
                      {result.country && (
                        <span className="location-country">{result.country}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {defaultLocation && (
                <div className="selected-location">
                  Selected: {defaultLocation}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </main>
    </>
  );
}
