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
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Tier → discount % on additional tickets (after the 1 free one is used)
const TIER_DISCOUNT = {
  Bronze:              0,
  Silver:              15,
  Gold:                20,
  Platinum:            25,
  Benefactor:          25,
  "Leadership Circle": 25,
};

function getAdditionalPrice(basePrice, memberLevel) {
  const pct = TIER_DISCOUNT[memberLevel] ?? 0;
  if (pct === 0) return basePrice;
  return parseFloat((basePrice * (1 - pct / 100)).toFixed(2));
}

export default function Tickets() {
  const navigate = useNavigate();

  const [visitDate,    setVisitDate]    = useState("");
  const [quantities,   setQuantities]   = useState({
    "Adult 19+": 0, "Senior 65+": 0, "Youth 13-18": 0, "Child 12 & Under": 0,
  });
  const [isMember,              setIsMember]              = useState(false);
  const [memberLevel,           setMemberLevel]           = useState(null);
  const [freeTicketUsedToday,   setFreeTicketUsedToday]   = useState(false);
  const [checkingFreeTicket,    setCheckingFreeTicket]    = useState(false);
  const [isThursday,            setIsThursday]            = useState(false);
  const [errorMsg,              setErrorMsg]              = useState("");
  const [step,                  setStep]                  = useState("calendar");
  const [currentMonth,          setCurrentMonth]          = useState(new Date().getMonth());
  const [currentYear,           setCurrentYear]           = useState(new Date().getFullYear());
  const [selectedDate,          setSelectedDate]          = useState(null);

  const userId = localStorage.getItem("user_id");

  // ── Check membership ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || userId;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { if (!res.ok) throw new Error("not a member"); return res.json(); })
      .then(data => {
        if (data?.membership_level && data?.expiration_date) {
          const s = String(data.expiration_date).slice(0, 10);
          const [y, m, d] = s.split("-").map(Number);
          const exp = new Date(y, m - 1, d);
          const now = new Date(); now.setHours(0, 0, 0, 0);
          if (exp >= now) { setIsMember(true); setMemberLevel(data.membership_level); }
        }
      })
      .catch(() => { setIsMember(false); setMemberLevel(null); });
  }, [userId]);

  // ── Check if free ticket already used for selected visit date ───────────────
  useEffect(() => {
    if (!isMember || !visitDate || !userId) { setFreeTicketUsedToday(false); return; }
    const token = localStorage.getItem("token") || userId;
    setCheckingFreeTicket(true);
    fetch(`${BASE_URL}/tickets?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(tickets => {
        const alreadyUsed = Array.isArray(tickets) && tickets.some(t =>
          String(t.visit_date).slice(0, 10) === visitDate &&
          t.discount_type === "Member"
        );
        setFreeTicketUsedToday(alreadyUsed);
      })
      .catch(() => setFreeTicketUsedToday(false))
      .finally(() => setCheckingFreeTicket(false));
  }, [isMember, visitDate, userId]);

  // ── Calendar ────────────────────────────────────────────────────────────────
  const getDaysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate();
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
    const firstDay    = getFirstDayOfMonth(currentYear, currentMonth);
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
    const next  = (quantities[type] || 0) + delta;
    if (total + delta > MAX_TOTAL_TICKETS || next < 0) return;
    setQuantities(prev => ({ ...prev, [type]: next }));
  }

  function handleQuantityInput(type, value) {
    let num = parseInt(value.replace(/^0+/, "")) || 0;
    const withoutThis = Object.values(quantities).reduce((a, b) => a + b, 0) - (quantities[type] || 0);
    num = Math.max(0, Math.min(MAX_TOTAL_TICKETS - withoutThis, num));
    setQuantities(prev => ({ ...prev, [type]: num }));
  }

  // ── Pricing ─────────────────────────────────────────────────────────────────
  // memberFreeAvailable: member hasn't used their free ticket on this visit date yet
  const memberFreeAvailable = isMember && !freeTicketUsedToday && !isThursday;
  const discountPct = TIER_DISCOUNT[memberLevel] ?? 0;

  // Build the ordered list of tickets for pricing purposes.
  // Free slot goes to the FIRST paid ticket in quantity order.
  const computeTickets = () => {
    let freeSlotRemaining = memberFreeAvailable ? 1 : 0;

    return TICKET_TYPES
      .filter(t => quantities[t.type] > 0)
      .map(t => {
        const qty = quantities[t.type];

        // Thursday: all free
        if (isThursday) {
          return { type: t.type, label: t.label, quantity: qty, basePrice: t.basePrice, finalPrice: 0, discountType: "None", isFreeSlot: false };
        }

        // Child tickets (basePrice=0): always free, never consume free slot
        if (t.basePrice === 0) {
          return { type: t.type, label: t.label, quantity: qty, basePrice: 0, finalPrice: 0, discountType: "None", isFreeSlot: false };
        }

        // First paid ticket — use the free member slot if available
        if (freeSlotRemaining > 0) {
          freeSlotRemaining--;
          return { type: t.type, label: t.label, quantity: qty, basePrice: t.basePrice, finalPrice: 0, discountType: "Member", isFreeSlot: true };
        }

        // Additional paid tickets — apply tier discount
        const additionalPrice = isMember
          ? getAdditionalPrice(t.basePrice, memberLevel)
          : t.basePrice;

        return {
          type:         t.type,
          label:        t.label,
          quantity:     qty,
          basePrice:    t.basePrice,
          finalPrice:   additionalPrice,
          discountType: isMember ? "Member" : "None",
          isFreeSlot:   false,
        };
      });
  };

  const computedTickets  = computeTickets();
  const totalTickets     = Object.values(quantities).reduce((a, b) => a + b, 0);
  const orderTotal       = computedTickets.reduce((s, t) => s + t.finalPrice * t.quantity, 0);
  const remainingTickets = MAX_TOTAL_TICKETS - totalTickets;

  // ── Row price display (for the ticket selector UI) ──────────────────────────
  const getRowDisplayPrice = (ticketType) => {
    if (isThursday) return "FREE";
    const t = TICKET_TYPES.find(tt => tt.type === ticketType);
    if (!t || t.basePrice === 0) return "FREE";

    // Is this the type that will receive the free slot?
    const firstPaidWithQty = TICKET_TYPES.find(tt => tt.basePrice > 0 && quantities[tt.type] > 0);
    if (memberFreeAvailable && firstPaidWithQty?.type === ticketType) {
      return (
        <span>
          <span style={{ textDecoration: "line-through", color: "#9ca3af", marginRight: 6, fontSize: "0.8em" }}>
            ${t.basePrice.toFixed(2)}
          </span>
          FREE
        </span>
      );
    }

    if (isMember && discountPct > 0) {
      const discounted = getAdditionalPrice(t.basePrice, memberLevel);
      return (
        <span>
          <span style={{ textDecoration: "line-through", color: "#9ca3af", marginRight: 6, fontSize: "0.8em" }}>
            ${t.basePrice.toFixed(2)}
          </span>
          ${discounted.toFixed(2)}
        </span>
      );
    }

    return `$${t.basePrice.toFixed(2)}`;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!userId)    return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");
    if (new Date(visitDate + "T00:00:00").getDay() === 1)
      return setErrorMsg("The museum is closed on Mondays.");
    if (totalTickets === 0) return setErrorMsg("Please select at least one ticket.");

    const orderCount   = computedTickets.reduce((s, t) => s + t.quantity, 0);
    const discountLabel = isThursday
      ? "Thursday Special"
      : memberFreeAvailable
      ? `Member - ${memberLevel}${discountPct > 0 ? ` (1 free + ${discountPct}% off extras)` : " (1 free admission)"}`
      : isMember
      ? `Member - ${memberLevel}${discountPct > 0 ? ` (${discountPct}% off)` : ""}`
      : "None";

    navigate("/checkout", {
      state: {
        type:              "tickets",
        tickets:           computedTickets,
        visitDate,
        discount:          discountLabel,
        totalTickets:      orderCount,
        total:             orderTotal,
        isMember,
        memberLevel,
        memberFreeAvailable,
      },
    });
  }

  const formatSelectedDate = () =>
    selectedDate?.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }) ?? "";

  // ── Benefit description for banner ─────────────────────────────────────────
  const memberBenefitText = () => {
    if (!memberLevel) return "";
    const pct = TIER_DISCOUNT[memberLevel] ?? 0;
    if (freeTicketUsedToday)
      return pct > 0
        ? `Your free ticket for this date is already used. Additional tickets are ${pct}% off.`
        : "Your free ticket for this date has already been used. Additional tickets are at regular price.";
    return pct > 0
      ? `${memberLevel} Member: first ticket FREE, additional tickets ${pct}% off.`
      : `${memberLevel} Member: first ticket FREE, additional tickets at regular price.`;
  };

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

            {/* Benefit banners */}
            {isThursday && (
              <div className="thursday-discount-banner">
                Admission is FREE on Thursdays!
              </div>
            )}
            {isMember && !isThursday && !checkingFreeTicket && (
              <div className={`member-discount-banner ${freeTicketUsedToday ? "member-discount-banner--used" : ""}`}>
                ✓ {memberBenefitText()}
              </div>
            )}
            {checkingFreeTicket && (
              <div className="member-discount-banner" style={{ background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}>
                Checking your membership benefits…
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
                return (
                  <div className="ticket-row" key={t.type}>
                    <div className="ticket-row-info">
                      <div className="ticket-row-name">{t.label}</div>
                      <div className="ticket-row-desc">{t.desc}</div>
                    </div>
                    <div className="ticket-row-price">
                      {getRowDisplayPrice(t.type)}
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
              {computedTickets.length === 0 ? (
                <p className="tickets-empty-summary">No tickets selected</p>
              ) : (
                <>
                  {computedTickets.map(t => (
                    <div className="summary-line" key={t.type}>
                      <span>
                        {t.quantity}× {t.label}
                        {t.isFreeSlot && (
                          <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
                            (free member ticket)
                          </span>
                        )}
                        {!t.isFreeSlot && isMember && discountPct > 0 && t.basePrice > 0 && !isThursday && (
                          <span style={{ fontSize: 11, color: "#c9a84c", marginLeft: 6 }}>
                            ({discountPct}% off)
                          </span>
                        )}
                      </span>
                      <span>
                        {isThursday || (t.finalPrice === 0 && t.basePrice > 0)
                          ? "FREE"
                          : t.basePrice === 0
                          ? "FREE"
                          : `$${(t.finalPrice * t.quantity).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{isThursday || orderTotal === 0 ? "FREE" : `$${orderTotal.toFixed(2)}`}</span>
                  </div>
                </>
              )}
            </div>

            {errorMsg && <div className="tickets-feedback error">{errorMsg}</div>}

            <button className="tickets-purchase-btn" type="submit"
              disabled={totalTickets === 0 || checkingFreeTicket}>
              {totalTickets > 0
                ? `Proceed to Checkout — ${isThursday || orderTotal === 0 ? "FREE" : `$${orderTotal.toFixed(2)}`}`
                : "Select Tickets to Continue"}
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