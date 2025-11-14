// Sidebar list that displays geocoding hits and lets the user pick one.
export default function SearchResults({
  results = [],
  onSelectLocation, // Informs the parent which `{ name, latitude, longitude }` item the user picked
}) {
  if (!results || results.length === 0) {
    return (
      <section className="search-results">
        <h2 className="results-title">Search Results</h2>
        <p>No results found. Try another search.</p> {/* Friendly empty state to set expectations */}
      </section>
    );
  }

  return (
    <section className="search-results">
      <h2 className="results-title">Search Results</h2>
      {results.map((result) => (
        // Each result button updates the Dashboard's selected location
        <button key={result.id} className="result-item" onClick={() => onSelectLocation(result)}>
          <div className="result-icon">📍</div>
          <div className="result-info">
            <div className="result-location">{result.name}</div>
            <div className="result-country">{result.country}</div>
          </div>
        </button>
      ))}
    </section>
  );
}
