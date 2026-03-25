// components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!token;
  const isAdmin = role === "admin";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="navbar-container">
      {/* Main Navbar */}
      <nav className="main-navbar">
        <div className="logo-large">
          <Link to="/">MFAH</Link>
        </div>
        <div className="nav-actions">
          {isLoggedIn && isAdmin && (
            <Link to="/admin" className="nav-btn dashboard-btn">
              Dashboard
            </Link>
          )}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="nav-btn logout-btn">
              Logout
            </button>
          ) : (
            <Link to="/login" className="nav-btn login-btn">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Secondary Navbar - Categories */}
      <nav className="category-navbar">
        <div className="category-links">
          <Link to="/artworks" className="category-link">ARTWORK</Link>
          <Link to="/exhibitions" className="category-link">EXHIBITIONS</Link>
          <Link to="/events" className="category-link">EVENTS</Link>
        </div>
      </nav>
    </div>
  );
}