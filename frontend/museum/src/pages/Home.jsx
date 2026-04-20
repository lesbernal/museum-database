// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Home.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TYPE_COLORS = {
  "General":     { bg: "#f3f4f6", color: "#374151" },
  "Lecture":     { bg: "#dbeafe", color: "#1d4ed8" },
  "Tour":        { bg: "#d1fae5", color: "#065f46" },
  "Activity":    { bg: "#fef3c7", color: "#92400e" },
  "Workshop":    { bg: "#ede9fe", color: "#5b21b6" },
  "Exhibition":  { bg: "#fce7f3", color: "#9d174d" },
  "Member Only": { bg: "#fef9c3", color: "#854d0e" },
};

const TYPE_IMAGES = {
  "General":     "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80",
  "Lecture":     "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
  "Tour":        "https://i.postimg.cc/hGrqQ2bx/american-art-galleries-16502746617110251196.jpg",
  "Activity":    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  "Workshop":    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600&q=80",
  "Exhibition":  "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&q=80",
  "Member Only": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
};

export default function Home() {
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toast,        setToast]        = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Show success toast from checkout
  useEffect(() => {
    if (location.state?.successToast) {
      setToast(location.state.successToast);
      setTimeout(() => setToast(null), 5000);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  useEffect(() => {
    fetch(`${BASE_URL}/events`)
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-scroll every 8 seconds
  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [events.length]);

  const handlePrevEvent = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleNextEvent = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events?event=${eventId}`);
  };

  // Get visible events (3 at a time starting from currentIndex)
  const getVisibleEvents = () => {
    if (events.length === 0) return [];
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % events.length;
      visible.push(events[index]);
    }
    return visible;
  };

  const visibleEvents = getVisibleEvents();

  return (
    <>
      {/* Success toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: "0.875rem 2rem",
          background: "rgba(197, 160, 40, 0.95)",
          backdropFilter: "blur(4px)",
          borderBottom: "1px solid rgba(184, 134, 11, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "slideDown 0.3s ease",
        }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#000", letterSpacing: "0.03em" }}>
            ✓ {toast}
          </span>
        </div>
      )}

      <div className="home-container">

        {/* Hero Banner */}
        <section className="hero-section">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">Museum of Fine Arts, Houston</h1>
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
              <p>Explore tours, lectures, and more</p>
            </div>

            <div className="carousel-container">
              <button className="carousel-btn prev" onClick={handlePrevEvent} aria-label="Previous">‹</button>

              <div className="carousel-track">
                {visibleEvents.map((event) => {
                  const spotsLeft = (event.capacity || 0) - (event.total_attendees || 0);
                  const isFull = spotsLeft <= 0;
                  const imgSrc = event.image_url || TYPE_IMAGES[event.event_type] || TYPE_IMAGES["General"];
                  const typeStyle = TYPE_COLORS[event.event_type] || TYPE_COLORS["General"];

                  return (
                    <div
                      className="event-card"
                      key={event.event_id}
                      onClick={() => handleEventClick(event.event_id)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Image */}
                      <div className="event-card-image">
                        <img src={imgSrc} alt={event.event_name} />
                        <div className="event-card-image-badges">
                          {event.event_type && (
                            <span className="event-type-badge" style={{
                              background: typeStyle.bg,
                              color: typeStyle.color,
                            }}>
                              {event.event_type}
                            </span>
                          )}
                          {event.member_only === 1 && event.event_type !== "Member Only" && (
                            <span className="event-type-badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
                              Members Only
                            </span>
                          )}
                        </div>
                        {isFull && <div className="event-card-full-overlay">Fully Booked</div>}
                      </div>

                      {/* Body */}
                      <div className="event-card-body">
                        <h3 className="event-title">{event.event_name}</h3>
                        <p className="event-date">
                          {event.event_date
                            ? new Date(String(event.event_date).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
                                weekday: "long", year: "numeric", month: "long", day: "numeric",
                              })
                            : "Date TBD"}
                        </p>
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                        <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                          {isFull ? (
                            <span className="availability-full">Fully Booked</span>
                          ) : (
                            <span className="availability-available">
                              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="carousel-btn next" onClick={handleNextEvent} aria-label="Next">›</button>
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
              <h3>Admission</h3>
              <p>Purchase tickets to access all galleries and exhibitions</p>
              <span className="extras-link">Buy Now →</span>
            </Link>
            <Link to="/membership" className="link-card">
              <h3>Memberships</h3>
              <p>Become a member for exclusive benefits and support the arts</p>
              <span className="extras-link">View Memberships →</span>
            </Link>
            <Link to="/events" className="link-card">
              <h3>Events</h3>
              <p>Special exhibitions, lectures, workshops, and family programs</p>
              <span className="extras-link">View Itinerary →</span>
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
              <h3>MFAH Gift Shop</h3>
              <p>Unique art-inspired gifts, books, jewelry, and museum merchandise</p>
              <span className="extras-link">Shop Now →</span>
            </Link>
            <Link to="/cafe" className="extras-card">
              <h3>Café Leonelli</h3>
              <p>Place an order in advance and avoid the line at our cafe</p>
              <span className="extras-link">View Menu →</span>
            </Link>
            <Link to="/donations" className="extras-card">
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
    </>
  );
}