// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists } from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadArtists() {
      try {
        const data = await getArtists();
        setArtists(data.slice(0, 8)); // Show first 8 artists
      } catch (err) {
        console.error("Failed to load artists:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(artists.length / 4));
    }, 5000);
    return () => clearInterval(interval);
  }, [artists.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(artists.length / 4)) % Math.ceil(artists.length / 4));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(artists.length / 4));
  };

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Museum of Fine Arts
            <span className="hero-subtitle">Houston</span>
          </h1>
          <p className="hero-description">
            Discover masterpieces from around the world, immerse yourself in art history,
            and experience the vibrant cultural heart of Houston.
          </p>
          <div className="hero-buttons">
            <Link to="/artists" className="btn btn-primary">Explore Artists</Link>
            <Link to="/exhibitions" className="btn btn-secondary">Current Exhibitions</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">15+</span>
            <span className="stat-label">Artists</span>
          </div>
          <div className="stat">
            <span className="stat-number">20+</span>
            <span className="stat-label">Artworks</span>
          </div>
          <div className="stat">
            <span className="stat-number">5</span>
            <span className="stat-label">Galleries</span>
          </div>
        </div>
      </section>

      {/* Featured Artists Carousel */}
      {!loading && artists.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2>Featured Artists</h2>
            <p>Explore works from renowned masters and emerging talents</p>
          </div>
          
          <div className="carousel-container">
            <button className="carousel-btn prev" onClick={handlePrevSlide} aria-label="Previous">
              ‹
            </button>
            
            <div className="carousel-track">
              {artists.slice(currentSlide * 4, (currentSlide + 1) * 4).map((artist) => (
                <div className="artist-card" key={artist.artist_id}>
                  <div className="artist-card-image">
                    <div className="artist-avatar">🎨</div>
                  </div>
                  <div className="artist-card-content">
                    <h3>{artist.first_name} {artist.last_name}</h3>
                    <p className="artist-nationality">{artist.nationality}</p>
                    {artist.birth_year && (
                      <p className="artist-years">
                        {artist.birth_year}{artist.death_year ? ` - ${artist.death_year}` : ' - Present'}
                      </p>
                    )}
                    {artist.biography && (
                      <p className="artist-bio">{artist.biography.substring(0, 80)}...</p>
                    )}
                    <Link to={`/artists/${artist.artist_id}`} className="artist-link">
                      View Works →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="carousel-btn next" onClick={handleNextSlide} aria-label="Next">
              ›
            </button>
          </div>
          
          <div className="carousel-dots">
            {[...Array(Math.ceil(artists.length / 4))].map((_, idx) => (
              <button
                key={idx}
                className={`dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section className="quick-links-section">
        <div className="section-header">
          <h2>Plan Your Visit</h2>
          <p>Everything you need to know about your museum experience</p>
        </div>
        
        <div className="links-grid">
          <Link to="/artists" className="link-card">
            <div className="link-icon">🎨</div>
            <h3>Artists</h3>
            <p>Browse our collection of artists</p>
          </Link>
          
          <Link to="/artworks" className="link-card">
            <div className="link-icon">🖼️</div>
            <h3>Artworks</h3>
            <p>Explore masterpieces and collections</p>
          </Link>
          
          <Link to="/exhibitions" className="link-card">
            <div className="link-icon">🏛️</div>
            <h3>Exhibitions</h3>
            <p>Current and upcoming exhibitions</p>
          </Link>
          
          <Link to="/events" className="link-card">
            <div className="link-icon">📅</div>
            <h3>Events</h3>
            <p>Workshops, talks, and special events</p>
          </Link>
          
          <Link to="/visit" className="link-card">
            <div className="link-icon">📍</div>
            <h3>Visit</h3>
            <p>Hours, tickets, and directions</p>
          </Link>
          
          <Link to="/membership" className="link-card">
            <div className="link-icon">⭐</div>
            <h3>Membership</h3>
            <p>Join today for exclusive benefits</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Museum of Fine Arts</h3>
            <p>Houston, Texas</p>
            <p>© 2026 Museum of Fine Arts, Houston</p>
          </div>
          <div className="footer-section">
            <h4>Hours</h4>
            <p>Tuesday - Sunday: 10am - 6pm</p>
            <p>Thursday: 10am - 9pm</p>
            <p>Closed Mondays</p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📞 (713) 639-7300</p>
            <p>📧 info@mfah.org</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="YouTube">📺</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}