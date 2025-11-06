import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Navbar from "../components/Navbar";
import logo from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      <Navbar searchAllowed={false} />

      {/* Main Content */}
      <main className="main-content">
        <div className="logo-circle"><img src={logo} alt="AeroTech" /></div>

        <div className="app-info">
          <h1 className="app-name">AeroTech</h1>
          <p className="app-description">
            An hour-by-hour weather calendar that shows ideal conditions
            and time slots for outdoor tasks.
          </p>
          <button
            className="navigate-button"
            onClick={() => handleNavigate("/dashboard")}
          >
            Shows  weather of default location
          </button>
        </div>
      </main>
    </>
  );
}
