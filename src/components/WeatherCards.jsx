export default function WeatherCards() {
  const weatherData = [
    {
      id: 1,
      time: '9 AM',
      temp: '64°',
      icon: '☀️',
      condition: 'Good Conditions',
      tasks: 'Walk the dog.',
      cardClass: 'good'
    },
    {
      id: 2,
      time: '10 AM',
      temp: '42°',
      icon: '🌧️',
      condition: 'Bad Conditions',
      tasks: 'More',
      cardClass: 'bad'
    },
    {
      id: 3,
      time: '11 AM',
      temp: '32°',
      icon: '⚡',
      condition: 'Unsuitable Conditions',
      tasks: 'Unavailable',
      cardClass: 'unsuitable'
    }
  ];

  return (
    <div className="weather-section">
      <div className="location-header">
        <h2>Olney, Philadelphia</h2>
      </div>
      
      <div className="condition-filters">
        <label className="filter-checkbox good-check">
          <input type="checkbox" defaultChecked />
          <span>Good Conditions</span>
        </label>
        <label className="filter-checkbox bad-check">
          <input type="checkbox" defaultChecked />
          <span>Bad Conditions</span>
        </label>
        <label className="filter-checkbox unsuitable-check">
          <input type="checkbox" />
          <span>Unsuitable Conditions</span>
        </label>
      </div>

      <div className="weather-cards">
        {weatherData.map((weather) => (
          <div key={weather.id} className={`weather-card ${weather.cardClass}`}>
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-time">{weather.time}</div>
            <div className="weather-temp">{weather.temp}</div>
            <div className="weather-tasks">
              <div className="tasks-label">Tasks</div>
              <div className="tasks-content">{weather.tasks}</div>
            </div>
            {weather.cardClass !== 'unsuitable' && (
              <button className="create-task-button">Create Task</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}