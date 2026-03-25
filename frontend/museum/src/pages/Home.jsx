// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample events data
  const sampleEvents = [
    {
      id: 1,
      title: "Monet: The Water Lilies",
      date: "March 15 - June 30, 2026",
      description: "Experience the iconic water lily paintings in an immersive exhibition.",
      image: "🎨",
      location: "East Gallery"
    },
    {
      id: 2,
      title: "Modern Masters: Picasso to Warhol",
      date: "April 1 - August 15, 2026",
      description: "A journey through 20th century art with works from the world's greatest artists.",
      image: "🖼️",
      location: "West Gallery"
    },
    {
      id: 3,
      title: "Texas Contemporary",
      date: "May 10 - July 20, 2026",
      description: "Celebrating the vibrant contemporary art scene across Texas.",
      image: "🎭",
      location: "Contemporary Wing"
    },
    {
      id: 4,
      title: "Ancient Treasures of Egypt",
      date: "June 5 - September 12, 2026",
      description: "Rare artifacts and artworks from ancient Egyptian civilization.",
      image: "🏺",
      location: "Special Exhibitions Hall"
    },
    {
      id: 5,
      title: "Photography Now",
      date: "July 1 - October 15, 2026",
      description: "Cutting-edge photography from emerging and established artists.",
      image: "📷",
      location: "Photo Gallery"
    },
    {
      id: 6,
      title: "Sculpture Garden Installation",
      date: "August 1 - November 30, 2026",
      description: "Large-scale contemporary sculptures in the museum gardens.",
      image: "🗿",
      location: "Sculpture Garden"
    }
  ];

  useEffect(() => {
    setEvents(sampleEvents);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(events.length / 4));
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(events.length / 4)) % Math.ceil(events.length / 4));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(events.length / 4));
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
        </div>
      </section>

      {/* Events Carousel */}
      {!loading && events.length > 0 && (
        <section className="events-section">
          <div className="section-header">
            <h2>Current & Upcoming Events</h2>
            <p>Explore exhibitions, lectures, and special programs</p>
          </div>
          
          <div className="carousel-container">
            <button className="carousel-btn prev" onClick={handlePrevSlide} aria-label="Previous">
              ‹
            </button>
            
            <div className="carousel-track">
              {events.slice(currentSlide * 4, (currentSlide + 1) * 4).map((event) => (
                <div className="event-card" key={event.id}>
                  <div className="event-card-image">
                    <div className="event-icon">{event.image}</div>
                  </div>
                  <div className="event-card-content">
                    <h3>{event.title}</h3>
                    <p className="event-date">{event.date}</p>
                    <p className="event-location">{event.location}</p>
                    <p className="event-description">{event.description}</p>
                    <Link to={`/events/${event.id}`} className="event-link">
                      Learn More →
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
            {[...Array(Math.ceil(events.length / 4))].map((_, idx) => (
              <button
                key={idx}
                className={`dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Plan Your Visit Section */}
      <section className="quick-links-section">
        <div className="section-header">
          <h2>Plan Your Visit</h2>
          <p>Everything you need to know about your museum experience</p>
        </div>
        
        <div className="links-grid">
          <Link to="/visit" className="link-card">
            <div className="link-icon">📍</div>
            <h3>Hours & Admission</h3>
            <p>Plan your visit with hours, tickets, and directions</p>
          </Link>
          
          <Link to="/membership" className="link-card">
            <div className="link-icon">⭐</div>
            <h3>Membership</h3>
            <p>Join today for exclusive benefits and support the arts</p>
          </Link>
          
          <Link to="/events" className="link-card">
            <div className="link-icon">🎉</div>
            <h3>Events</h3>
            <p>Special exhibitions, lectures, workshops, and family programs</p>
          </Link>
        </div>
      </section>

      {/* More to Explore Section */}
      <section className="extras-section">
        <div className="section-header">
          <h2>More to Explore</h2>
          <p>Enhance your museum experience</p>
        </div>
        
        <div className="extras-grid">
          <Link to="/gift-shop" className="extras-card">
            <div className="extras-icon">🛍️</div>
            <h3>Gift Shop</h3>
            <p>Unique art-inspired gifts, books, jewelry, and museum merchandise</p>
            <span className="extras-link">Shop Now →</span>
          </Link>
          
          <Link to="/cafe" className="extras-card">
            <div className="extras-icon">☕</div>
            <h3>Café</h3>
            <p>Enjoy coffee, pastries, and light meals in a beautiful setting</p>
            <span className="extras-link">View Menu →</span>
          </Link>
          
          <Link to="/donate" className="extras-card">
            <div className="extras-icon">💝</div>
            <h3>Donation</h3>
            <p>Support exhibitions, education programs, and art conservation efforts</p>
            <span className="extras-link">Donate Now →</span>
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