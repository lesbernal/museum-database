// src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Tickets.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TICKET_TYPES = [
  { type: "Adult 19+",        label: "Adult",  desc: "Ages 19+",        basePrice: 20 },
  { type: "Senior 65+",       label: "Senior", desc: "Ages 65+",        basePrice: 15 },
  { type: "Youth 13-18",      label: "Youth",  desc: "Ages 13–18",      basePrice: 12 },
  { type: "Child 12 & Under", label: "Child",  desc: "Ages 12 & under", basePrice: 0  },
];

const MAX_TOTAL_TICKETS = 30;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getFinalPrice(basePrice, isMember) {
  if (isMember) return 0;
  return basePrice;
}

export default function Tickets() {
  const navigate = useNavigate();

  const [visitDate,  setVisitDate]  = useState("");
  const [quantities, setQuantities] = useState({
    "Adult 19+": 0, "Senior 65+": 0, "Youth 13-18": 0, "Child 12 & Under": 0
  });
  const [isMember,   setIsMember]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [step,       setStep]       = useState("calendar");
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate]  = useState(null);

  const userId = localStorage.getItem("user_id");
  const today = new Date();

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { "Authorization": `Bearer ${userId}` }
    })
      .then(res => setIsMember(res.ok))
      .catch(() => setIsMember(false));
  }, [userId]);

  // Calendar generation
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (year, month, day) => {
    const date = new Date(year, month, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (date < todayDate) return true;
    if (date.getDay() === 1) return true;
    return false;
  };

  const isDateSelected = (year, month, day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === month && 
           selectedDate.getFullYear() === year;
  };

  const handleDateSelect = (year, month, day) => {
    const date = new Date(year, month, day);
    if (isDateDisabled(year, month, day)) return;
    
    setSelectedDate(date);
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setVisitDate(formattedDate);
    
    setStep("tickets");
    
    setTimeout(() => {
      const section = document.querySelector('.tickets-selection-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const calendarDays = [];
    
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(currentYear, currentMonth, day);
      const selected = isDateSelected(currentYear, currentMonth, day);
      const isMonday = new Date(currentYear, currentMonth, day).getDay() === 1;
      
      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${isMonday && !disabled ? 'monday' : ''}`}
          onClick={() => !disabled && handleDateSelect(currentYear, currentMonth, day)}
        >
          {day}
          {isMonday && <span className="closed-label">Closed</span>}
        </div>
      );
    }
    
    return calendarDays;
  };

  function adjust(type, delta) {
    const currentTotal = Object.values(quantities).reduce((a, b) => a + b, 0);
    const newQuantity = (quantities[type] || 0) + delta;
    const newTotal = currentTotal + delta;

    if (newTotal > MAX_TOTAL_TICKETS || newQuantity < 0) return;

    setQuantities(prev => ({
      ...prev,
      [type]: newQuantity
    }));
  }

  function handleQuantityInput(type, value) {
    const cleanValue = value.replace(/^0+/, '');
    let numValue = parseInt(cleanValue) || 0;
    const currentTotalWithoutThis = Object.values(quantities).reduce((a, b) => a + b, 0) - (quantities[type] || 0);
    
    const maxAllowed = MAX_TOTAL_TICKETS - currentTotalWithoutThis;
    numValue = Math.max(0, Math.min(maxAllowed, numValue));
    
    setQuantities(prev => ({
      ...prev,
      [type]: numValue
    }));
  }

  const summaryLines = TICKET_TYPES.filter(t => quantities[t.type] > 0).map(t => ({
    label: `${quantities[t.type]}x ${t.label}`,
    price: getFinalPrice(t.basePrice, isMember) * quantities[t.type],
  }));

  const total = summaryLines.reduce((sum, l) => sum + l.price, 0);
  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const remainingTickets = MAX_TOTAL_TICKETS - totalTickets;

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!userId) return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");
    const selectedDay = new Date(visitDate + "T00:00:00").getDay();
    if (selectedDay === 1) return setErrorMsg("The museum is closed on Mondays. Please select a different date.");
    if (totalTickets === 0) return setErrorMsg("Please select at least one ticket.");

    const tickets = TICKET_TYPES
      .filter(t => quantities[t.type] > 0)
      .map(t => ({
        type: t.type,
        label: t.label,
        quantity: quantities[t.type],
        basePrice: t.basePrice,
        finalPrice: getFinalPrice(t.basePrice, isMember),
      }));

    const orderTotal = tickets.reduce((sum, t) => sum + t.finalPrice * t.quantity, 0);
    const orderCount = tickets.reduce((sum, t) => sum + t.quantity, 0);

    navigate("/checkout", {
      state: {
        type: "tickets",
        tickets,
        visitDate,
        discount: isMember ? "Member" : "None",
        totalTickets: orderCount,
        total: orderTotal,
      }
    });
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("en-US", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="tickets-page">
      <div className="tickets-hero">
        <p className="tickets-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="tickets-title">Buy Tickets</h1>
        <p className="tickets-subtitle">Select a date to begin your visit</p>
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">‹</button>
          <h2>{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={handleNextMonth} className="calendar-nav-btn">›</button>
        </div>
        
        <div className="calendar-weekdays">
          {DAYS.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-grid">
          {renderCalendar()}
        </div>
        
        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-color available"></div><span>Available</span></div>
          <div className="legend-item"><div className="legend-color selected"></div><span>Selected</span></div>
          <div className="legend-item"><div className="legend-color closed"></div><span>Museum Closed</span></div>
          <div className="legend-item"><div className="legend-color past"></div><span>Past Date</span></div>
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="selected-date-banner">
          <span className="selected-date-label">Selected Date:</span>
          <span className="selected-date-value">{formatSelectedDate()}</span>
          <button 
            className="change-date-btn"
            onClick={() => {
              setStep("calendar");
              document.querySelector('.calendar-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Change Date
          </button>
        </div>
      )}

      {/* Ticket Selection Section */}
      {step === "tickets" && selectedDate && (
        <div className="tickets-selection-section">
          <form onSubmit={handleSubmit}>
            {isMember && (
              <div className="member-discount-banner">
                ✓ Members receive FREE admission! Tickets are complimentary.
              </div>
            )}

            {/* Ticket Limit Info - Option 2 */}
            <div className="ticket-limit-info">
              <span>You can select up to <strong>{MAX_TOTAL_TICKETS}</strong> total tickets.</span>
              {remainingTickets > 0 && (
                <span className="remaining">{remainingTickets} ticket{remainingTickets !== 1 ? "s" : ""} remaining</span>
              )}
              {remainingTickets === 0 && (
                <span className="limit-reached">Maximum reached. Remove some tickets to add more.</span>
              )}
            </div>

            <p className="tickets-section-label">Select Tickets</p>
            <div className="ticket-rows">
              {TICKET_TYPES.map(t => {
                const finalPrice = getFinalPrice(t.basePrice, isMember);
                const currentTotal = Object.values(quantities).reduce((a, b) => a + b, 0);
                const isMaxReached = currentTotal >= MAX_TOTAL_TICKETS;
                
                return (
                  <div className="ticket-row" key={t.type}>
                    <div className="ticket-row-info">
                      <div className="ticket-row-name">{t.label}</div>
                      <div className="ticket-row-desc">{t.desc}</div>
                    </div>
                    <div className="ticket-row-price">
                      {isMember ? "FREE" : (t.basePrice === 0 ? "FREE" : `$${finalPrice.toFixed(2)}`)}
                    </div>
                    <div className="ticket-counter">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => adjust(t.type, -1)}
                        disabled={quantities[t.type] === 0}
                      >−</button>
                      <input
                        type="text"
                        className="counter-input"
                        value={quantities[t.type]}
                        onChange={(e) => handleQuantityInput(t.type, e.target.value)}
                      />
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => adjust(t.type, 1)}
                        disabled={isMaxReached && quantities[t.type] === 0}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tickets-summary">
              {summaryLines.length === 0 ? (
                <p className="tickets-empty-summary">No tickets selected</p>
              ) : (
                <>
                  {summaryLines.map(l => (
                    <div className="summary-line" key={l.label}>
                      <span>{l.label}</span>
                      <span>{isMember ? "FREE" : `$${l.price.toFixed(2)}`}</span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{isMember ? "FREE" : `$${total.toFixed(2)}`}</span>
                  </div>
                </>
              )}
            </div>

            {errorMsg && <div className="tickets-feedback error">{errorMsg}</div>}

            <button className="tickets-purchase-btn" type="submit" disabled={totalTickets === 0}>
              {totalTickets > 0
                ? `Proceed to Checkout — ${isMember ? "FREE" : `$${total.toFixed(2)}`}`
                : "Select Tickets to Continue"}
            </button>
          </form>
        </div>
      )}

      {/* Bulk Message */}
      {totalTickets >= MAX_TOTAL_TICKETS && (
        <div className="bulk-message">
          <span className="bulk-icon">ℹ️</span>
          <div className="bulk-text">
            <strong>Need more than {MAX_TOTAL_TICKETS} tickets?</strong>
            <p>For group visits of 30+ people, please contact our group sales team at <strong>groups@mfah.org</strong> or <strong>(713) 639-7300</strong> for special rates and arrangements.</p>
          </div>
        </div>
      )}
    </div>
  );
}