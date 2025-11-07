import { useState, useEffect } from 'react';
import {
  getWeatherType,
  getCurrentWeather,
  generateTaskRecommendations,
  detectWeatherAnomalies
} from '../utils/weatherUtils';

export default function WeatherCards({ location, onWeatherChange }) {
  // Component State Management
  const [weatherData, setWeatherData] = useState([]);
  const [forecastDate, setForecastDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    good: true,
    bad: true,
    unsuitable: false,
  });

  const [taskRecommendations, setTaskRecommendations] = useState([]);
  const [weatherAnomalies, setWeatherAnomalies] = useState([]);

  // Fetch and process weather data on component mount
  useEffect(() => {
    if (!location) {
      setError('No location provided');
      setLoading(false);
      return;
    }

    // Validate location has required fields
    if (!location.latitude || !location.longitude) {
      setError('Invalid location: missing latitude or longitude');
      setLoading(false);
      return;
    }

    // Validate latitude and longitude are numbers
    const lat = Number(location.latitude);
    const lon = Number(location.longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      setError('Invalid location: latitude and longitude must be numbers');
      setLoading(false);
      return;
    }

    // Validate latitude and longitude are within valid ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid location: coordinates out of range');
      setLoading(false);
      return;
    }

    const fetchWeatherData = async () => {
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`;

      try {
        setLoading(true);
        setError(null); // Reset error state on new fetch
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Check if API returned an error
        if (data.error) {
          throw new Error(data.reason || 'API returned an error');
        }

        // Validate response has required data
        if (!data.hourly || !data.hourly.time || !data.hourly.temperature_2m || !data.hourly.weather_code) {
          throw new Error('Invalid API response: missing required data');
        }

        // Set the forecast date from the first timestamp in the response
        if (data.hourly?.time?.length > 0) {
          const date = new Date(data.hourly.time[0]);
          setForecastDate(date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }));
        } else {
          setForecastDate('');
        }

        // Transform API data into a structured format for the UI
        const transformedData = data.hourly.time.map((time, index) => {
          const weatherCode = data.hourly.weather_code[index];
          const temp = data.hourly.temperature_2m[index];

          let cardClass = 'good';
          let condition = 'Good Conditions';
          let icon = '☀️'; // Default

          // Determine card style and content based on WMO weather code and temperature
          if (weatherCode >= 95) { // Thunderstorm
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = '⚡';

          } else if (temp > 95 || temp < 32) { // Extreme Temperature
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = temp > 95 ? '🔥' : '❄️';

          } else if (weatherCode >= 51 && weatherCode <= 67) { // Drizzle, Rain
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';

          } else if (weatherCode >= 71 && weatherCode <= 77) { // Snow
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '❄️';

          } else if (weatherCode >= 80) { // Rain showers
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';
            
          } else {
            // Good or neutral conditions
            if (weatherCode === 0) { // Clear sky
              icon = '☀️';
            } else if (weatherCode >= 1 && weatherCode <= 3) { // Mainly clear, partly cloudy, and overcast
              icon = '☁️';
            }
          }

          // Load tasks from localStorage
          const storedTasks = localStorage.getItem(`tasks-${time}`);

          return {
            id: time,
            time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
            temp: `${Math.round(temp)}°`,
            tempValue: temp, // Store numeric temp for background calculation
            weatherCode: weatherCode, // Store weather code for background calculation
            icon: icon,
            condition: condition,
            tasks: storedTasks ? JSON.parse(storedTasks) : [],
            cardClass: cardClass,
          };
        });

        setWeatherData(transformedData);
        setTaskRecommendations(generateTaskRecommendations(transformedData));
        setWeatherAnomalies(detectWeatherAnomalies(transformedData));
        
        // Notify parent component about weather change for background
        if (onWeatherChange && transformedData.length > 0) {
          const currentWeather = getCurrentWeather(transformedData);
          if (currentWeather) {
            const weatherType = getWeatherType(currentWeather.weatherCode, currentWeather.tempValue);
            onWeatherChange(weatherType);
          }
        }
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch weather data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location]); // Re-run effect when location prop changes

  // Handler for updating filter state based on checkbox interaction
  const handleFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: checked }));
  };

  // Handler for new task input changes
  const handleTaskInputChange = (id, value) => {
    setWeatherData(currentData =>
      currentData.map(item =>
        item.id === id ? { ...item, newTaskInput: value } : item
      )
    );
  };

  // Handler for adding a new task
  const handleAddTask = (id) => {
    // Check if unsuitable tasks are allowed
    const allowUnsuitableTasks = localStorage.getItem('allowUnsuitableTasks') === 'true';
    
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id && item.newTaskInput?.trim()) {
          // Check if this is an unsuitable condition and if tasks are not allowed
          if (item.cardClass === 'unsuitable' && !allowUnsuitableTasks) {
            return item; // Don't allow task creation
          }
          // Add the new task and clear the input field
          const updatedTasks = [...item.tasks, item.newTaskInput];
          localStorage.setItem(`tasks-${id}`, JSON.stringify(updatedTasks));
          return { ...item, tasks: updatedTasks, newTaskInput: '' };
        }
        return item;
      })
    );
  };

  // Handler for deleting a task
  const handleDeleteTask = (id, taskIndex) => {
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id) {
          // Filter out the task by its index
          const updatedTasks = item.tasks.filter((_, index) => index !== taskIndex);
          localStorage.setItem(`tasks-${id}`, JSON.stringify(updatedTasks));
          return { ...item, tasks: updatedTasks };
        }
        return item;
      })
    );
  };

  // Apply filters to the weather data before rendering
  const filteredWeatherData = weatherData.filter((weather) => filters[weather.cardClass]);

  const marqueeMessages = [...weatherAnomalies, ...taskRecommendations];
  const marqueeLoop = marqueeMessages.length > 0 ? [...marqueeMessages, ...marqueeMessages] : [];

  // Render error message if data fetching fails
  if (error) {
    return <div className="weather-section"><div className="error-message">Error: {error}</div></div>;
  }

  // Main component render
  return (
    <section className="weather-section" aria-labelledby="location-heading">
      
      <div className="location-header">
        <h2 id="location-heading">{location?.name ? `${location.name} - ${forecastDate}` : 'Select a location'}</h2>
      </div>

      <div className="condition-filters">

        <label className="filter-checkbox good-check">
          <input
            type="checkbox"
            name="good"
            checked={filters.good}
            onChange={handleFilterChange}
          />
          <span>Good Conditions</span>
        </label>
        
        <label className="filter-checkbox bad-check">
          <input
            type="checkbox"
            name="bad"
            checked={filters.bad}
            onChange={handleFilterChange}
          />
          <span>Bad Conditions</span>
        </label>

        <label className="filter-checkbox unsuitable-check">
          <input
            type="checkbox"
            name="unsuitable"
            checked={filters.unsuitable}
            onChange={handleFilterChange}
          />
          <span>Unsuitable Conditions</span>
        </label>

      </div>

      <div role="status" className="weather-cards">

        {loading ? (
          <div className="loading-spinner">Loading weather...</div>
          
        ) : filteredWeatherData.length === 0 ? (
          <div className="no-results">No weather data matches the selected filters.</div>

        ) : (filteredWeatherData.map((weather) => (
          <article key={weather.id} className={`weather-card ${weather.cardClass}`}>

            <figure className="weather-icon" aria-label={weather.condition}>
              {weather.icon}
            </figure>
            
            <p className="weather-time">{weather.time}</p>
            <p className="weather-temp">{weather.temp}</p>

            <section className="weather-tasks">
              <h3 className="tasks-label">Tasks ({weather.tasks.length})</h3>
              {(() => {
                const allowUnsuitableTasks = localStorage.getItem('allowUnsuitableTasks') === 'true';
                const isUnsuitable = weather.cardClass === 'unsuitable';
                const showUnavailable = isUnsuitable && !allowUnsuitableTasks;
                
                if (showUnavailable) {
                  return <p className="tasks-content">Unavailable</p>;
                } else if (weather.tasks.length > 0) {
                  return (
                    <ul className="tasks-list">
                      {weather.tasks.map((task, index) => (
                        <li key={index} className="task-item">
                          <span>{task}</span>
                          <button onClick={() => handleDeleteTask(weather.id, index)} className="delete-task-button" aria-label={`Delete task: ${task}`}>❌</button>
                        </li>
                      ))}
                    </ul>
                  );
                } else {
                  return <p className="tasks-content">No tasks yet.</p>;
                }
              })()}
            </section>

            {(() => {
              const allowUnsuitableTasks = localStorage.getItem('allowUnsuitableTasks') === 'true';
              const isUnsuitable = weather.cardClass === 'unsuitable';
              
              // Show task input if it's not unsuitable OR if unsuitable tasks are allowed
              if (!isUnsuitable || allowUnsuitableTasks) {
                return (
                  <div className="create-task-container">
                    <input
                      type="text"
                      className="task-input"
                      placeholder="Enter a new task..."
                      value={weather.newTaskInput || ''}
                      onChange={(e) => handleTaskInputChange(weather.id, e.target.value)}
                    />
                    <button className="create-task-button" onClick={() => handleAddTask(weather.id)}>Create Task</button>
                  </div>
                );
              }
              return null;
            })()}
            
          </article>
        )))}
        
      </div>

      {marqueeMessages.length > 0 && (
        <div className="insights-marquee" role="status" aria-live="polite">
          <div className="marquee-track">
            {marqueeLoop.map((item, index) => (
              <span key={`${item.message}-${index}`} className={`marquee-item marquee-${item.type}`}>
                <strong>{item.type === 'anomaly' ? 'Heads up' : 'Pro tip'}:</strong> {item.message}
              </span>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
