import { Link } from 'react-router-dom';

export default function Navbar({ searchQuery, onSearchQueryChange, onSearch, searchAllowed = false }) {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <header className="app-navbar">
      <div className="nav-left">

        <Link to="/" className="app-name">
            AeroTech
        </Link>
        
        {searchAllowed && (
          <section className="search-container">
            <input
              type="text"
              placeholder="Search Location"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            <button onClick={onSearch} className="search-button">🔍</button>
          </section>
        )}
        
      </div>

      <aside className="nav-right">
        <Link to="/settings">
          <button className="settings-button">⚙️</button>
        </Link>
      </aside>
      
    </header>
  );
}