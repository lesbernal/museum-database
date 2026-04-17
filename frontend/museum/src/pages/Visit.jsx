// src/pages/Visit.jsx
import { Link } from "react-router-dom";
import "../styles/Visit.css";

export default function Visit() {
  const ticketPrices = [
    { type: "Adult", price: 20, description: "Ages 19 and above" },
    { type: "Senior", price: 15, description: "Ages 65 and above" },
    { type: "Youth", price: 12, description: "Ages 13-18" },
    { type: "Child", price: 0, description: "Ages 12 and under" },
    { type: "Member", price: 0, description: "Members only", isMembershipLink: true },
  ];

  const hours = [
    { day: "Tuesday", hours: "10:00 AM - 6:00 PM" },
    { day: "Wednesday", hours: "10:00 AM - 6:00 PM" },
    { day: "Thursday", hours: "10:00 AM - 9:00 PM", note: "Late night" },
    { day: "Friday", hours: "10:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 6:00 PM" },
    { day: "Sunday", hours: "12:30 PM - 6:00 PM" },
    { day: "Monday", hours: "Closed" }
  ];

  const handlePurchaseTickets = () => {
    window.location.href = "/tickets";
  };

  return (
    <div className="visit-page">
      {/* Hero Section */}
      <div className="visit-hero">
        <p className="visit-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="visit-title">Plan Your Visit</h1>
        <p className="visit-subtitle">
          Directions, hours, and admission
        </p>
      </div>

      {/* Section 1: Directions & Map */}
      <div className="visit-section directions-section">
        <div className="section-container">
          <div className="section-content">
            <h2>Directions</h2>
            <p className="section-subtitle">The Sarofim Campus includes three main gallery buildings</p>
            
            <div className="directions-info">
              <p><strong>Museum of Fine Arts, Houston</strong></p>
              
              {/* Single link for the entire address */}
              <a 
                href="https://maps.google.com/?q=1001+Bissonnet+St+Houston+TX+77005" 
                target="_blank" 
                rel="noopener noreferrer"
                className="address-link"
              >
                1001 Bissonnet Street<br />
                Houston, Texas 77005
              </a>
              
              <div className="directions-divider"></div>
              
              <p><strong>Parking:</strong> On-site parking garage available at $15 per vehicle. Free street parking available on surrounding streets.</p>
              
              <p><strong>Public Transportation:</strong></p>
              <p>METRO Rail: Red Line to the Museum District Station</p>
              <p>METRO Bus: Routes 56, 60, 65, 68 serve the Museum District</p>
            </div>
          </div>
          
          <div className="section-image">
            <div className="map-placeholder">
              <img 
                src="https://static.mfah.com/images/-campus-plans---map-of-old-buildings-new-buildings-with-names.8713965514606499740.jpg?width=1100" 
                alt="MFAH Campus Map"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Museum_of_Fine_Arts%2C_Houston.jpg/800px-Museum_of_Fine_Arts%2C_Houston.jpg";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Ticket Information */}
      <div className="visit-section tickets-section">
        <div className="section-container tickets-container">
          <div className="section-content">
            <h2>Ticket Information</h2>
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
                      <td className="details">
                        {ticket.isMembershipLink ? (
                          <Link to="/membership" className="membership-link">
                            {ticket.description} →
                          </Link>
                        ) : (
                          ticket.description
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Purchase Tickets Button - Moved below the table */}
        <div className="ticket-action-wrapper">
          <button className="purchase-btn" onClick={handlePurchaseTickets}>
            Purchase Tickets
          </button>
          <p className="member-note">Members: Log in to access your free tickets</p>
        </div>
      </div>

      {/* Section 3: Hours - Reformatted */}
      <div className="visit-section hours-section">
        <div className="section-container">
          <div className="section-content full-width">
            <h2>Hours</h2>
            <p className="section-subtitle">Plan your visit around our operating hours</p>
            
            <div className="hours-list">
              {hours.map((hour, index) => (
                <div key={index} className={`hour-row ${hour.hours === "Closed" ? "closed" : ""}`}>
                  <span className="day">{hour.day}</span>
                  <span className="hours">{hour.hours}</span>
                  {hour.note && <span className="note">{hour.note}</span>}
                </div>
              ))}
            </div>
            
            <div className="holiday-info">
              <p>MFAH is closed on Thanksgiving, Christmas Eve, Christmas Day, and New Year's Day.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}