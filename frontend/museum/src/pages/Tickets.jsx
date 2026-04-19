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

// Tier discount percentages (for display purposes only - trigger does actual calculation)
const TIER_DISCOUNT = {
  "Bronze": 10,
  "Silver": 15,
  "Gold": 20,
  "Platinum": 25,
  "Benefactor": 100,  // Free admission
  "Leadership Circle": 100,  // Free admission
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function Tickets() {
  const navigate = useNavigate();

  const [visitDate,    setVisitDate]    = useState("");
  const [quantities,   setQuantities]   = useState({
    "Adult 19+": 0, "Senior 65+": 0, "Youth 13-18": 0, "Child 12 & Under": 0,
  });
  const [isMember,      setIsMember]      = useState(false);
  const [memberLevel,   setMemberLevel]   = useState(null);
  const [errorMsg,      setErrorMsg]      = useState("");
  const [step,          setStep]          = useState("calendar");
  const [currentMonth,  setCurrentMonth]  = useState(new Date().getMonth());
  const [currentYear,   setCurrentYear]   = useState(new Date().getFullYear());
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [isThursday,    setIsThursday]    = useState(false);

  const userId = localStorage.getItem("user_id");

  // ── Check membership ──
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || userId;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.membership_level && data?.expiration_date) {
          const exp = new Date(String(data.expiration_date).slice(0, 10));
          const now = new Date(); now.setHours(0, 0, 0, 0);
          if (exp >= now) {
            setIsMember(true);
            setMemberLevel(data.membership_level);
          } else {
            setIsMember(false);
            setMemberLevel(null);
          }
        } else {
          setIsMember(false);
          setMemberLevel(null);
        }
      })
      .catch(() => {
        setIsMember(false);
        setMemberLevel(null);
      });
  }, [userId]);

  // ── Calendar ────────────────────────────────────────────────────────────────
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const isDateDisabled = (year, month, day) => {
    const date = new Date(year, month, day);
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    return date < todayDate || date.getDay() === 1;
  };

  const isDateSelected = (year, month, day) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const handleDateSelect = (year, month, day) => {
    if (isDateDisabled(year, month, day)) return;
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setIsThursday(date.getDay() === 4);
    setVisitDate(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setStep("tickets");
    setTimeout(() => {
      document.querySelector(".tickets-selection-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells = [];
    for (let i = 0; i < firstDay; i++)
      cells.push(<div key={`e-${i}`} className="calendar-day empty" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(currentYear, currentMonth, day);
      const selected = isDateSelected(currentYear, currentMonth, day);
      const isMonday = new Date(currentYear, currentMonth, day).getDay() === 1;
      cells.push(
        <div key={day}
          className={`calendar-day ${disabled?"disabled":""} ${selected?"selected":""} ${isMonday&&!disabled?"monday":""}`}
          onClick={() => !disabled && handleDateSelect(currentYear, currentMonth, day)}>
          {day}
          {isMonday && <span className="closed-label">Closed</span>}
        </div>
      );
    }
    return cells;
  };

  // ── Quantity controls ───────────────────────────────────────────────────────
  function adjust(type, delta) {
    const total = Object.values(quantities).reduce((a, b) => a + b, 0);
    const next = (quantities[type] || 0) + delta;
    if (total + delta > MAX_TOTAL_TICKETS || next < 0) return;
    setQuantities(prev => ({ ...prev, [type]: next }));
  }

  function handleQuantityInput(type, value) {
    let num = parseInt(value.replace(/^0+/, "")) || 0;
    const withoutThis = Object.values(quantities).reduce((a, b) => a + b, 0) - (quantities[type] || 0);
    num = Math.max(0, Math.min(MAX_TOTAL_TICKETS - withoutThis, num));
    setQuantities(prev => ({ ...prev, [type]: num }));
  }

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const remainingTickets = MAX_TOTAL_TICKETS - totalTickets;

  // ── Calculate display price for a ticket (based on member tier) ──
  const getDisplayPrice = (ticketType) => {
    const ticket = TICKET_TYPES.find(t => t.type === ticketType);
    if (!ticket || ticket.basePrice === 0) return { display: "FREE", value: 0, original: null };
    
    // Thursday = FREE for everyone
    if (isThursday) return { display: "FREE", value: 0, original: null };
    
    // Benefactor/Leadership Circle = FREE
    if (memberLevel === 'Benefactor' || memberLevel === 'Leadership Circle') {
      return { display: "FREE", value: 0, original: null };
    }
    
    // Member discount
    if (isMember) {
      const discountPct = TIER_DISCOUNT[memberLevel] || 0;
      if (discountPct > 0 && discountPct < 100) {
        const discountedPrice = ticket.basePrice * (1 - discountPct / 100);
        return { 
          display: `$${discountedPrice.toFixed(2)}`, 
          value: discountedPrice,
          original: `$${ticket.basePrice.toFixed(2)}`
        };
      }
    }
    
    // Regular price (non-member or Bronze with 0% discount)
    return { display: `$${ticket.basePrice.toFixed(2)}`, value: ticket.basePrice, original: null };
  };

  // Build ticket list with display info
  const getTicketsWithDisplay = () => {
    const tickets = [];
    
    for (const ticketType of TICKET_TYPES.map(t => t.type)) {
      const qty = quantities[ticketType];
      if (qty === 0) continue;
      
      const ticket = TICKET_TYPES.find(t => t.type === ticketType);
      const priceInfo = getDisplayPrice(ticketType);
      
      tickets.push({
        type: ticketType,
        label: ticket.label,
        quantity: qty,
        basePrice: ticket.basePrice,
        priceInfo,
      });
    }
    
    return tickets;
  };

  const displayTickets = getTicketsWithDisplay();
  const displayTotal = displayTickets.reduce((sum, t) => sum + (t.priceInfo.value * t.quantity), 0);

  // ── Get member benefit message ──
  const getMemberBenefitMessage = () => {
    if (isThursday) return null;
    if (memberLevel === 'Benefactor' || memberLevel === 'Leadership Circle') {
      return `✨ As a ${memberLevel} member, all your tickets are FREE! ✨`;
    }
    const discountPct = TIER_DISCOUNT[memberLevel] || 0;
    if (discountPct > 0) {
      return `✨ ${memberLevel} Member: ${discountPct}% off all tickets! ✨`;
    }
    return `✨ ${memberLevel} Member benefits applied at checkout. ✨`;
  };

  // ── Submit - Let the TRIGGER handle final pricing! ──
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!userId) return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");
    if (new Date(visitDate + "T00:00:00").getDay() === 1)
      return setErrorMsg("The museum is closed on Mondays.");
    if (totalTickets === 0) return setErrorMsg("Please select at least one ticket.");

    const tickets = [];
    for (const t of TICKET_TYPES) {
      const qty = quantities[t.type];
      if (qty === 0) continue;
      const priceInfo = getDisplayPrice(t.type);
      for (let i = 0; i < qty; i++) {
        tickets.push({
          type: t.type,
          label: t.label,
          quantity: 1,
          basePrice: t.basePrice,
          finalPrice: priceInfo.value,
          discount_type: isThursday ? "None" : isMember ? "Member" : "None",
          visit_date: visitDate,
        });
      }
    }

    const orderTotal = tickets.reduce((sum, t) => sum + t.finalPrice, 0);

    // If total is $0 skip checkout and purchase directly
    if (orderTotal === 0) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const transactionId = 0;

        const results = await Promise.all(tickets.map(t =>
          fetch(`${BASE_URL}/tickets`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${userId}`
            },
            body: JSON.stringify({
              user_id:        userId,
              purchase_date:  today,
              visit_date:     visitDate,
              ticket_type:    t.type,
              base_price:     t.basePrice,
              discount_type:  isThursday ? "None" : "Member",
              final_price:    0,
              payment_method: "Free",
              transaction_id: transactionId,
            })
          })
        ));

        const allOk = results.every(r => r.ok);
        if (allOk) {
          navigate("/", { state: { successToast: "Your free tickets have been confirmed! See you soon." } });
        } else {
          setErrorMsg("Something went wrong processing your free tickets. Please try again.");
        }
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
      return;
    }

    // Otherwise go to checkout as normal
    navigate("/checkout", {
      state: {
        type:         "tickets",
        tickets,
        visitDate,
        discount:     isThursday ? "Thursday Special" : (isMember ? `Member (${TIER_DISCOUNT[memberLevel]}% off)` : "None"),
        totalTickets: tickets.length,
        total:        0,
        isThursday,
        isMember,
        memberLevel,
      },
    });
  }

  const formatSelectedDate = () =>
    selectedDate?.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }) ?? "";

  return (
    <div className="tickets-page">
      <div className="tickets-hero">
        <p className="tickets-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="tickets-title">Buy Tickets</h1>
        <p className="tickets-subtitle">Select a date to begin your visit</p>
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">‹</button>
          <h2>{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={handleNextMonth} className="calendar-nav-btn">›</button>
        </div>
        <div className="calendar-weekdays">
          {DAYS.map(d => <div key={d} className="weekday">{d}</div>)}
        </div>
        <div className="calendar-grid">{renderCalendar()}</div>
        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-color available" /><span>Available</span></div>
          <div className="legend-item"><div className="legend-color selected" /><span>Selected</span></div>
          <div className="legend-item"><div className="legend-color closed" /><span>Museum Closed</span></div>
          <div className="legend-item"><div className="legend-color past" /><span>Past Date</span></div>
        </div>
      </div>

      {/* Selected date banner */}
      {selectedDate && (
        <div className="selected-date-banner">
          <span className="selected-date-label">Selected Date:</span>
          <span className="selected-date-value">{formatSelectedDate()}</span>
          <button className="change-date-btn" onClick={() => {
            setStep("calendar");
            document.querySelector(".calendar-section")?.scrollIntoView({ behavior: "smooth" });
          }}>Change Date</button>
        </div>
      )}

      {/* Ticket selection */}
      {step === "tickets" && selectedDate && (
        <div className="tickets-selection-section">
          <form onSubmit={handleSubmit}>

            {/* Thursday banner */}
            {isThursday && (
              <div className="thursday-discount-banner">
                 Admission is FREE every Thursday! 
              </div>
            )}

            {/* Member benefit banner */}
            {isMember && !isThursday && (
              <div className="member-discount-banner">
                {getMemberBenefitMessage()}
              </div>
            )}

            <div className="ticket-limit-info">
              <span>Up to <strong>{MAX_TOTAL_TICKETS}</strong> tickets per transaction.</span>
              {remainingTickets > 0
                ? <span className="remaining">{remainingTickets} remaining</span>
                : <span className="limit-reached">Maximum reached.</span>}
            </div>

            <p className="tickets-section-label">Select Tickets</p>
            <div className="ticket-rows">
              {TICKET_TYPES.map(t => {
                const isMaxReached = totalTickets >= MAX_TOTAL_TICKETS;
                const priceInfo = getDisplayPrice(t.type);
                
                return (
                  <div className="ticket-row" key={t.type}>
                    <div className="ticket-row-info">
                      <div className="ticket-row-name">{t.label}</div>
                      <div className="ticket-row-desc">{t.desc}</div>
                    </div>
                    <div className="ticket-row-price">
                      {priceInfo.original ? (
                        <span>
                          <span style={{ textDecoration: "line-through", color: "#9ca3af", marginRight: 6, fontSize: "0.8em" }}>
                            {priceInfo.original}
                          </span>
                          {priceInfo.display}
                        </span>
                      ) : (
                        priceInfo.display
                      )}
                    </div>
                    <div className="ticket-counter">
                      <button type="button" className="counter-btn"
                        onClick={() => adjust(t.type, -1)} disabled={quantities[t.type] === 0}>−</button>
                      <input type="text" className="counter-input" value={quantities[t.type]}
                        onChange={e => handleQuantityInput(t.type, e.target.value)} />
                      <button type="button" className="counter-btn"
                        onClick={() => adjust(t.type, 1)} disabled={isMaxReached && quantities[t.type] === 0}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="tickets-summary">
              {totalTickets === 0 ? (
                <p className="tickets-empty-summary">No tickets selected</p>
              ) : (
                <>
                  {displayTickets.map(ticket => (
                    <div className="summary-line" key={ticket.type}>
                      <span>
                        {ticket.quantity}× {ticket.label}
                        {isMember && !isThursday && memberLevel !== 'Benefactor' && memberLevel !== 'Leadership Circle' && ticket.priceInfo.original && (
                          <span style={{ fontSize: 11, color: "#c9a84c", marginLeft: 6 }}>
                            ({TIER_DISCOUNT[memberLevel]}% off)
                          </span>
                        )}
                      </span>
                      <span>
                        {isThursday || (memberLevel === 'Benefactor' || memberLevel === 'Leadership Circle') 
                          ? "FREE" 
                          : ticket.priceInfo.display}
                      </span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>
                      {isThursday || (memberLevel === 'Benefactor' || memberLevel === 'Leadership Circle') 
                        ? "FREE" 
                        : `$${displayTotal.toFixed(2)}`}
                    </span>
                  </div>
                </>
              )}
            </div>

            {errorMsg && <div className="tickets-feedback error">{errorMsg}</div>}

            <button className="tickets-purchase-btn" type="submit" disabled={totalTickets === 0}>
              {totalTickets === 0
                ? "Select Tickets to Continue"
                : displayTotal === 0 && totalTickets > 0
                  ? "Confirm Free Tickets"
                  : "Proceed to Checkout"}
            </button>
          </form>
        </div>
      )}

      {totalTickets >= MAX_TOTAL_TICKETS && (
        <div className="bulk-message">
          <span className="bulk-icon">ℹ️</span>
          <div className="bulk-text">
            <strong>Need more than {MAX_TOTAL_TICKETS} tickets?</strong>
            <p>For group visits of 30+ people, contact our group sales team at <strong>groups@mfah.org</strong> or <strong>(713) 639-7300</strong>.</p>
          </div>
        </div>
      )}
    </div>
  );
}