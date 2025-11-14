import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Navbar from "../components/Navbar";
import logo from "../assets/logo.png";
import { getWeatherType, getCurrentWeather } from "../utils/weatherUtils";

// Landing page hero experience that previews the current conditions at the saved default location.
export default function Home() {
  const navigate = useNavigate();
  const [weatherType, setWeatherType] = useState('default'); // Controls the global backdrop theme applied to <body>
  const [currentWeather, setCurrentWeather] = useState(null); // Stores the best matching hour from the fetched forecast
  const [loading, setLoading] = useState(true); // Tracks whether the hero weather preview should show the loading state
  const [location, setLocation] = useState(() => {
    // Pull the saved default location (if any) that was configured in Settings.
    // The structure is the full payload saved by the Dashboard after a location search.
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        if (parsed.name && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse default location data:', e);
      }
    }
    // If nothing is stored yet, fall back to a baked-in location so the UI always has data to show.
    return {
      name: 'Olney, Philadelphia',
      latitude: 40.03,
      longitude: -75.13,
    };
  });

  // Helper function to get weather icon
  const getWeatherIcon = (weatherCode, temp) => {
    // Map the raw WMO weather code + temperature to the emoji used in the hero card.
    // While simplistic, this keeps the landing experience playful and easy to parse.
    if (weatherCode >= 95) return '⚡';
    if (temp > 95) return '🔥';
    if (temp < 32) return '❄️';
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80) return '🌧️';
    if (weatherCode === 0) return '☀️';
    if (weatherCode >= 1 && weatherCode <= 3) return '☁️';
    return '🌤️';
  };

  // Fetch current weather every time the location changes.
  useEffect(() => {
    const fetchCurrentWeather = async () => {
      try {
        setLoading(true); // Show the spinner while we wait for the API
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.reason || 'API returned an error');
        }

        if (data.hourly && data.hourly.time && data.hourly.temperature_2m && data.hourly.weather_code) {
          // Normalize the hourly arrays into a single list the UI can work with easily.
          const transformedData = data.hourly.time.map((time, index) => ({
            id: time,
            time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
            temp: `${Math.round(data.hourly.temperature_2m[index])}°`,
            tempValue: data.hourly.temperature_2m[index],
            weatherCode: data.hourly.weather_code[index],
            icon: getWeatherIcon(data.hourly.weather_code[index], data.hourly.temperature_2m[index]),
          }));

          // Pick the entry closest to the current time for the preview badge and also
          // derive the `weatherType` we use to theme the page background.
          const current = getCurrentWeather(transformedData);
          if (current) {
            setCurrentWeather(current);
            const type = getWeatherType(current.weatherCode, current.tempValue);
            setWeatherType(type);
          }
        }
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
        setWeatherType('default');
      } finally {
        setLoading(false); // Restore the regular UI, regardless of success or failure
      }
    };

    fetchCurrentWeather();
  }, [location]); // Refresh when the stored location changes

  // Apply weather-based background
  useEffect(() => {
    // Keep the body classes aligned with the current weather theme
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
      // Cleanup protects against stale classes if the component unmounts or the theme changes.
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

  const handleNavigate = (path) => {
    // Main CTA buttons pass their destination here so we keep navigation logic centralized.
    navigate(path);
  };

  return (
    <>
      <Navbar searchAllowed={false} />

      {/* Main Content */}
      <main className="main-content">
        <div className="logo-circle">
          <img src={logo} alt="AeroTech" />
        </div>

        <div className="app-info">
          <h1 className="app-name">AeroTech</h1>
          <p className="app-description">
            An hour-by-hour weather calendar that shows ideal conditions
            and time slots for outdoor tasks.
          </p>

          {/* Current Weather Preview - Cartoonish Style */}
          {!loading && currentWeather && (
            <div className="weather-preview">
              <div className="weather-preview-icon">{currentWeather.icon}</div>
              <div className="weather-preview-info">
                <div className="weather-preview-location">📍 {location.name}</div>
                <div className="weather-preview-temp">{currentWeather.temp}</div>
                <div className="weather-preview-time">{currentWeather.time}</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="weather-preview-loading">
              <div className="loading-emoji">🌤️</div>
              <p>Loading weather...</p>
            </div>
          )}

          <button
            className="navigate-button"
            onClick={() => handleNavigate("/dashboard")}
          >
            View Full Weather Forecast
          </button>
        </div>
      </main>
    </>
  );
}
