// components/Navbar.jsx
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token     = localStorage.getItem("token");
  const role      = localStorage.getItem("role");
  const isLoggedIn = !!token;

  // Check if we're on an admin page
  const isAdminPage = location.pathname.startsWith("/admin");

  // Don't render navbar on admin pages
  if (isAdminPage) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Dashboard route and label per role
  const dashboardRoute = {
    admin:    "/admin",
    employee: "/employee-dashboard",
    member:   "/member-dashboard",
    visitor:  "/visitor-dashboard",
  }[role];

  const dashboardLabel = {
    admin:    "Dashboard",
    employee: "Staff Portal",
    member:   "My Dashboard",
    visitor:  "My Account",
  }[role];

  return (
    <div className="navbar-container">
      {/* Main Navbar */}
      <nav className="main-navbar">
        <div className="logo-large">
          <Link to="/">MFAH</Link>
        </div>
        <div className="nav-actions">
          {isLoggedIn && dashboardRoute && (
            <Link to={dashboardRoute} className="nav-btn dashboard-btn">
              {dashboardLabel}
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
          <NavLink to="/artworks" className={({ isActive }) =>
            isActive ? "category-link active" : "category-link"}>
            ARTWORK
          </NavLink>
          <NavLink to="/exhibitions" className={({ isActive }) =>
            isActive ? "category-link active" : "category-link"}>
            EXHIBITIONS
          </NavLink>
          <NavLink to="/buildings" className={({ isActive }) =>
            isActive ? "category-link active" : "category-link"}>
            BUILDINGS
          </NavLink>
        </div>
      </nav>
    </div>
  );
}