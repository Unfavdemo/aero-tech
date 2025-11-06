import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="nav-buttons">
          <button className="nav-arrow">←</button>
          <button className="nav-arrow">→</button>
        </div>

        <input
          type="text"
          className="search-bar"
          placeholder="Search..."
        />

        <div
          className="dashboard-link"
          onClick={() => handleNavigate("/dashboard")}
        >
          App Name / Dashboard
        </div>

        <div
          className="settings-icon"
          onClick={() => handleNavigate("/settings")}
          title="Settings"
        >
          ⚙️
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="logo-circle">App Logo</div>

        <div className="app-info">
          <h1 className="app-name">App Name</h1>
          <p className="app-description">
            An hour-by-hour weather calendar that shows ideal conditions
            and time slots for outdoor tasks.
          </p>
          <button
            className="navigate-button"
            onClick={() => handleNavigate("/weather")}
          >
            Shows  weather of default location
          </button>
        </div>
      </main>
    </div>
  );
}
