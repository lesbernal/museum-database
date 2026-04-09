// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch real events from the database
  useEffect(() => {
    fetch("http://localhost:5001/events")
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  // Pick an emoji based on event name keywords
  function getEventIcon(name = "") {
    const lower = name.toLowerCase();
    if (lower.includes("photo")) return "📷";
    if (lower.includes("sculpt")) return "🗿";
    if (lower.includes("workshop")) return "🎨";
    if (lower.includes("lecture") || lower.includes("talk") || lower.includes("panel")) return "🎤";
    if (lower.includes("family") || lower.includes("kids")) return "👨‍👩‍👧";
    if (lower.includes("member")) return "⭐";
    if (lower.includes("latin") || lower.includes("african") || lower.includes("egypt")) return "🏺";
    if (lower.includes("tour")) return "🗺️";
    if (lower.includes("contemporary") || lower.includes("modern")) return "🖼️";
    if (lower.includes("music") || lower.includes("evening") || lower.includes("solstice")) return "🎶";
    return "🎭";
  }

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Museum of Fine Arts,
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
                <div className="event-card" key={event.event_id}>
                  <div className="event-card-image">
                    <div className="event-icon">{getEventIcon(event.event_name)}</div>
                  </div>
                  <div className="event-card-content">
                    <h3>{event.event_name}</h3>
                    <p className="event-date">{event.event_date?.split("T")[0] ?? event.event_date}</p>
                    <p className="event-description">{event.description}</p>
                    <p className="event-location">
                      Capacity: {event.capacity}
                      {event.member_only ? " · Members Only ⭐" : ""}
                    </p>
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
                className={`dot ${currentSlide === idx ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <section className="events-section">
          <div className="section-header">
            <h2>Current & Upcoming Events</h2>
            <p>Loading events...</p>
          </div>
        </section>
      )}

      {/* No events fallback */}
      {!loading && events.length === 0 && (
        <section className="events-section">
          <div className="section-header">
            <h2>Current & Upcoming Events</h2>
            <p>No upcoming events at this time. Check back soon!</p>
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
          <Link to="/tickets" className="link-card">
            {/*<d<div className="link-icon">📍</div>*/}
            <h3>Hours & Admission</h3>
            <p>Plan your visit with hours, tickets, and directions</p>
            <span className="extras-link">Book Now →</span>
          </Link>

          <Link to="/membership" className="link-card">
            {/*<d<div className="link-icon">⭐</div>*/}
            <h3>Memberships</h3>
            <p>Become a member for exclusive benefits and support the arts</p>
            <span className="extras-link">View Memberships →</span>
          </Link>

          <Link to="/events" className="link-card">
            {/*<d<div className="link-icon">🎉</div>*/}
            <h3>Events</h3>
            <p>Special exhibitions, lectures, workshops, and family programs</p>
            <span className="extras-link">View Itenerary →</span>
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
            {/*<div className="extras-icon">🛍️</div>*/}
            <h3>MFAH Gift Shop</h3>
            <p>Unique art-inspired gifts, books, jewelry, and museum merchandise</p>
            <span className="extras-link">Shop Now →</span>
          </Link>

          <Link to="/cafe" className="extras-card">
            {/*<d<div className="extras-icon">☕</div>*/}
            <h3>Café Leonelli</h3>
            <p>Place an order in advance and avoid the line at our cafe </p>
            <span className="extras-link">View Menu →</span>
          </Link>

          <Link to="/donations" className="extras-card">
            {/*<div className="extras-icon">💝</div>*/}
            <h3>Make a Donation</h3>
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
        </div>
      </footer>
    </div>
  );
}