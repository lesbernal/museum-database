// src/pages/Visit.jsx
import { Link } from "react-router-dom";
import "../styles/Visit.css";

export default function Visit() {
  const ticketPrices = [
    { type: "Adult (19+)", price: 19, description: "Ages 19 and above" },
    { type: "Senior (65+)", price: 16, description: "Ages 65 and above" },
    { type: "Youth (13-18)", price: 12, description: "Ages 13-18" },
    { type: "Child (12 & under)", price: 0, description: "FREE" },
    { type: "Member", price: 0, description: "FREE (Members only)" },
    { type: "Student (with ID)", price: 12, description: "Valid student ID required" }
  ];

  const hours = [
    { day: "Tuesday", hours: "10:00 AM - 6:00 PM", note: "" },
    { day: "Wednesday", hours: "10:00 AM - 6:00 PM", note: "" },
    { day: "Thursday", hours: "10:00 AM - 9:00 PM", note: "Late night" },
    { day: "Friday", hours: "10:00 AM - 6:00 PM", note: "" },
    { day: "Saturday", hours: "10:00 AM - 6:00 PM", note: "" },
    { day: "Sunday", hours: "12:30 PM - 6:00 PM", note: "" },
    { day: "Monday", hours: "Closed", note: "Museum closed" }
  ];

  const handlePurchaseTickets = () => {
    // Navigate to ticket purchase page
    window.location.href = "/tickets";
  };

  return (
    <div className="visit-page">
      {/* Section 1: Directions & Map */}
      <section className="visit-section directions-section">
        <div className="section-container">
          <div className="section-content">
            <h2>Plan Your Visit</h2>
            <p className="section-subtitle">Discover the Museum of Fine Arts, Houston</p>
            
            <div className="directions-info">
              <h3>📍 Museum Location</h3>
              <p>1001 Bissonnet Street</p>
              <p>Houston, Texas 77005</p>
              
              <h3>🚗 Getting Here</h3>
              <p><strong>By Car:</strong> Take I-69/US-59 to the Montrose Blvd exit. The museum is located in the Museum District.</p>
              <p><strong>Parking:</strong> On-site parking garage available at $15 per vehicle. Free street parking available on surrounding streets.</p>
              
              <h3>🚇 Public Transportation</h3>
              <p><strong>METRO Rail:</strong> Red Line to the Museum District Station</p>
              <p><strong>METRO Bus:</strong> Routes 56, 60, 65, 68 serve the Museum District</p>
            </div>
          </div>
          
          <div className="section-image">
            <div className="map-placeholder">
              <img 
                src="https://www.mfah.org/sites/default/files/styles/max_width_1920/public/2023-12/mfah_campus_map_2022_updated_2023.png" 
                alt="MFAH Campus Map"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Museum_of_Fine_Arts%2C_Houston.jpg/800px-Museum_of_Fine_Arts%2C_Houston.jpg";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Ticket Information */}
      <section className="visit-section tickets-section">
        <div className="section-container">
          <div className="section-content">
            <h2>🎟️ Ticket Information</h2>
            <p className="section-subtitle">General admission tickets give you access to all galleries</p>
            
            <div className="ticket-prices">
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Ticket Type</th>
                    <th>Price</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketPrices.map((ticket, index) => (
                    <tr key={index}>
                      <td>{ticket.type}</td>
                      <td className="price">{ticket.price === 0 ? "FREE" : `$${ticket.price}`}</td>
                      <td className="details">{ticket.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="ticket-notes">
              <p>✨ Members always get FREE admission</p>
              <p>🎓 Student discounts available with valid ID</p>
              <p>👨‍👩‍👧‍👦 Family passes available at the box office</p>
            </div>
          </div>
          
          <div className="ticket-action">
            <button className="purchase-btn" onClick={handlePurchaseTickets}>
              🎟️ Purchase Tickets
            </button>
            <p className="member-note">Members: Log in to access your free tickets</p>
          </div>
        </div>
      </section>

      {/* Section 3: Hours of Operation */}
      <section className="visit-section hours-section">
        <div className="section-container">
          <div className="section-content">
            <h2>🕐 Hours of Operation</h2>
            <p className="section-subtitle">Plan your visit around our operating hours</p>
            
            <div className="hours-grid">
              {hours.map((hour, index) => (
                <div key={index} className={`hour-card ${hour.hours === "Closed" ? "closed" : ""}`}>
                  <span className="day">{hour.day}</span>
                  <span className="hours">{hour.hours}</span>
                  {hour.note && <span className="note">{hour.note}</span>}
                </div>
              ))}
            </div>
            
            <div className="holiday-info">
              <p>📅 The museum is closed on Thanksgiving, Christmas Eve, Christmas Day, and New Year's Day.</p>
              <p>🎄 Special holiday hours may apply - check our calendar for updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Extra Buttons - Events, Cafe, Gift Shop */}
      <section className="visit-section extras-section">
        <div className="section-container">
          <h2>Explore More</h2>
          <p className="section-subtitle">Enhance your museum experience</p>
          
          <div className="extra-buttons-grid">
            <Link to="/events" className="extra-card">
              <div className="extra-icon">🎉</div>
              <h3>Events</h3>
              <p>Lectures, workshops, family programs, and special events</p>
              <span className="extra-link">View Events →</span>
            </Link>
            
            <Link to="/cafe" className="extra-card">
              <div className="extra-icon">☕</div>
              <h3>Café</h3>
              <p>Enjoy coffee, pastries, and light meals in a beautiful setting</p>
              <span className="extra-link">View Menu →</span>
            </Link>
            
            <Link to="/gift-shop" className="extra-card">
              <div className="extra-icon">🛍️</div>
              <h3>Gift Shop</h3>
              <p>Unique art-inspired gifts, books, jewelry, and museum merchandise</p>
              <span className="extra-link">Shop Now →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}