// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists } from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    async function loadArtists() {
      try {
        const data = await getArtists();
        setArtists(data.slice(0, 5)); // show first 5 as featured
      } catch (err) {
        console.error("Failed to load artists:", err);
      }
    }
    loadArtists();
  }, []);

  return (
    <div className="home-container">
      {/* Banner */}
      <div className="home-banner">
        <h1>Houston Museum of Fine Arts</h1>
        <p>Discover artists, exhibits, and collections</p>
      </div>

      {/* Featured Artists Carousel */}
      {artists.length > 0 && (
        <section className="home-featured-artists">
          <h2>Featured Artists</h2>
          <div className="carousel">
            {artists.map((artist) => (
              <div className="carousel-card" key={artist.artist_id}>
                <h3>{artist.first_name} {artist.last_name}</h3>
                <p>{artist.nationality}</p>
                {artist.biography && <p className="biography">{artist.biography.substring(0, 100)}...</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Links */}
      <section className="home-cards">
        <Link to="/artists" className="home-card">
          <h2>Manage Artists</h2>
          <p>Add, edit, or delete artist information.</p>
        </Link>

        <Link to="/exhibits" className="home-card">
          <h2>View Exhibits</h2>
          <p>Explore current and past exhibits.</p>
        </Link>

        <Link to="/collections" className="home-card">
          <h2>Collections</h2>
          <p>Browse the museum's art collections.</p>
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; 2026 Houston Museum of Fine Arts</p>
      </footer>
    </div>
  );
}