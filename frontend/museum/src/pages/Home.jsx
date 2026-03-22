import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Houston Museum of Fine Arts</h1>
        <p>Welcome! Explore artists and collections.</p>
      </header>

      <section className="home-links">
        <Link to="/artists" className="home-link">
          Manage Artists
        </Link>
        <Link to="/exhibits" className="home-link">
          View Exhibits
        </Link>
      </section>

      <footer className="home-footer">
        <p>&copy; 2026 Houston Museum of Fine Arts</p>
      </footer>
    </div>
  );
}