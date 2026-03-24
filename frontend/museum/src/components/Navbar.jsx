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
    <nav className="navbar">
      <Link to="/" className="logo">🎨 MFAH Museum</Link>
      
      <div className="nav-links">
        <Link to="/artists">Artists</Link>
        <Link to="/artworks">Artworks</Link>
        <Link to="/exhibitions">Exhibitions</Link>
        
        {/* Show Admin Dashboard link ONLY when logged in as admin */}
        {isLoggedIn && isAdmin && (
          <Link to="/admin" className="admin-link">
            ⚙️ Admin Dashboard
          </Link>
        )}
        
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        ) : (
          <Link to="/login" className="login-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}