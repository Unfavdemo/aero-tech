import { Link } from 'react-router-dom';

// Global navigation bar shown on every page. Supports an optional search slot that
// the Dashboard enables to drive geocoding requests.
export default function Navbar({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchAllowed = false, // Toggling this hides the entire search UI for routes that don't need it
}) {
  const handleKeyPress = (event) => {
    // Mirror the button click so keyboard users can trigger a search with Enter.
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <header className="app-navbar">
      <div className="nav-left">

        {/* Brand link always routes back to the hero/landing experience */}
        <Link to="/" className="app-name">
            AeroTech
        </Link>
        
        {searchAllowed && (
          // Render the search controls only on views that opt in
          <section className="search-container">
            <input
              type="text"
              placeholder="Search Location"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            {/* Icon button keeps the whimsical styling consistent with the rest of the app */}
            <button onClick={onSearch} className="search-button">🔍</button>
          </section>
        )}
        
      </div>

      <aside className="nav-right">
        <Link to="/settings">
          {/* Gear button routes to the configuration screen */}
          <button className="settings-button">⚙️</button>
        </Link>
      </aside>
      
    </header>
  );
}