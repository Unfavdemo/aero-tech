import { useState } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-name">App Name</span>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>
        <button className="settings-button">⚙️</button>
      </header>

      <main className="main-content">
        <SearchResults />
        <WeatherCards />
      </main>
    </div>
  );
}