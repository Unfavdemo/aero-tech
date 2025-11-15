import { useState, useEffect } from 'react';
import {
  getWeatherType,
  getCurrentWeather,
  generateTaskRecommendations,
  detectWeatherAnomalies
} from '../utils/weatherUtils';

// Renders the hour-by-hour forecast cards, handles task persistence, and bubbles insight summaries.
export default function WeatherCards({
  location, // `{ name, latitude, longitude }` object used to drive the forecast query
  onWeatherChange, // Callback used to update the parent's background based on current conditions
}) {
  // Component State
  const [weatherData, setWeatherData] = useState([]);
  const [forecastDate, setForecastDate] = useState(''); // Friendly string such as "Tuesday, March 12"
  const [loading, setLoading] = useState(true); // Governs the animated skeleton/spinner state
  const [error, setError] = useState(null); // Captures any fetch or validation errors so we can short-circuit rendering

  const [filters, setFilters] = useState({
    good: true,
    bad: true,
    unsuitable: false,
  }); // Mirrors the three toggle checkboxes so we can quickly filter the cards

  const [taskRecommendations, setTaskRecommendations] = useState([]); // Curated "pro tip" slots derived from the forecast
  const [weatherAnomalies, setWeatherAnomalies] = useState([]); // Alerts for drastic swings or extreme conditions

  // Fetch weather data whenever location changes
  useEffect(() => {
    // Bail out early if we don't have a usable location payload
    if (!location) {
      setError('No location provided');
      setLoading(false);
      return;
    }

    const { latitude, longitude, name } = location;

    if (!latitude || !longitude) {
      setError('Invalid location: missing latitude or longitude');
      setLoading(false);
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Invalid location: latitude and longitude must be numbers');
      setLoading(false);
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid location: coordinates out of range');
      setLoading(false);
      return;
    }

    const fetchWeatherData = async () => {
      // Build the Open-Meteo URL each time the location changes
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
          throw new Error(data.reason || 'API returned an error');
        }

        if (!data.hourly || !data.hourly.time || !data.hourly.temperature_2m || !data.hourly.weather_code) {
          throw new Error('Invalid API response: missing required data');
        }

        // Set date header
        if (data.hourly.time.length > 0) {
          const date = new Date(data.hourly.time[0]);
          setForecastDate(date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }));
        }

        // Transform API data
        const transformedData = data.hourly.time.map((time, index) => {
          const weatherCode = data.hourly.weather_code[index];
          const temp = data.hourly.temperature_2m[index];

          let cardClass = 'good';
          let condition = 'Good Conditions';
          let icon = '☀️';

          if (weatherCode >= 95) {
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = '⚡';
          } else if (temp > 95 || temp < 32) {
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = temp > 95 ? '🔥' : '❄️';
          } else if (weatherCode >= 51 && weatherCode <= 67) {
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';
          } else if (weatherCode >= 71 && weatherCode <= 77) {
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '❄️';
          } else if (weatherCode >= 80) {
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';
          } else {
            if (weatherCode === 0) icon = '☀️';
            else if (weatherCode >= 1 && weatherCode <= 3) icon = '☁️';
          }

          // 🔑 Create a unique key for each location + hour
          const uniqueKey = `${name}-${lat}-${lon}-${time}`;
          const storedTasks = localStorage.getItem(`tasks-${uniqueKey}`);

          return {
            id: time,
            uniqueKey,
            time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
            temp: `${Math.round(temp)}°`,
            tempValue: temp,
            weatherCode,
            icon,
            condition,
            tasks: storedTasks ? JSON.parse(storedTasks) : [],
            cardClass,
          };
        });

        setWeatherData(transformedData);
        setTaskRecommendations(generateTaskRecommendations(transformedData));
        setWeatherAnomalies(detectWeatherAnomalies(transformedData));

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
  }, [location]);

  // Filters
  const handleFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
  };

  // Add Task
  const handleAddTask = (id) => {
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id && item.newTaskInput?.trim()) {
          const allowUnsuitableTasks = localStorage.getItem('allowUnsuitableTasks') === 'true';
          if (item.cardClass === 'unsuitable' && !allowUnsuitableTasks) return item;

          const updatedTasks = [...item.tasks, item.newTaskInput];
          localStorage.setItem(`tasks-${item.uniqueKey}`, JSON.stringify(updatedTasks));

          return { ...item, tasks: updatedTasks, newTaskInput: '' };
        }
        return item;
      })
    );
  };

  // Delete Task
  const handleDeleteTask = (id, taskIndex) => {
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id) {
          const updatedTasks = item.tasks.filter((_, index) => index !== taskIndex);
          localStorage.setItem(`tasks-${item.uniqueKey}`, JSON.stringify(updatedTasks));
          return { ...item, tasks: updatedTasks };
        }
        return item;
      })
    );
  };

  // Task Input Change
  const handleTaskInputChange = (id, value) => {
    setWeatherData(currentData =>
      currentData.map(item =>
        item.id === id ? { ...item, newTaskInput: value } : item
      )
    );
  };

  const filteredWeatherData = weatherData.filter(w => filters[w.cardClass]);

  const marqueeMessages = [...weatherAnomalies, ...taskRecommendations];
  // Doubling the array lets the marquee animation loop seamlessly without abrupt jumps.
  const marqueeLoop = marqueeMessages.length > 0 ? [...marqueeMessages, ...marqueeMessages] : [];

  if (error) {
    return <div className="weather-section"><div className="error-message">Error: {error}</div></div>;
  }

  return (
    <section className="weather-section" aria-labelledby="location-heading">
      <div className="location-header">
        <h2 id="location-heading">
          {location?.name ? `${location.name} - ${forecastDate}` : 'Select a location'}
        </h2>
      </div>

      <div className="condition-filters">
        <label className="filter-checkbox good-check">
          <input type="checkbox" name="good" checked={filters.good} onChange={handleFilterChange} />
          <span>Good Conditions</span>
        </label>

        <label className="filter-checkbox bad-check">
          <input type="checkbox" name="bad" checked={filters.bad} onChange={handleFilterChange} />
          <span>Bad Conditions</span>
        </label>

        <label className="filter-checkbox unsuitable-check">
          <input type="checkbox" name="unsuitable" checked={filters.unsuitable} onChange={handleFilterChange} />
          <span>Unsuitable Conditions</span>
        </label>
      </div>

      <div role="status" className="weather-cards">
        {loading ? (
          <div className="loading-spinner">Loading weather...</div>
        ) : filteredWeatherData.length === 0 ? (
          <div className="no-results">No weather data matches the selected filters.</div>
        ) : (
          filteredWeatherData.map(weather => (
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
                            <button
                              onClick={() => handleDeleteTask(weather.id, index)}
                              className="delete-task-button"
                              aria-label={`Delete task: ${task}`}
                            >
                              ❌
                            </button>
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
                      <button className="create-task-button" onClick={() => handleAddTask(weather.id)}>
                        Create Task
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </article>
          ))
        )}
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
