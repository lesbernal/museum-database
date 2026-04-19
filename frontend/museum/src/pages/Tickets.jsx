// src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TICKET_TIER_DISCOUNT } from "../utils/shopDiscounts";
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

// Only these two donation-earned tiers get completely free admission
const FREE_ADMISSION_TIERS = ["Benefactor", "Leadership Circle"];

export default function Tickets() {
  const navigate = useNavigate();

  const [visitDate,    setVisitDate]    = useState("");
  const [quantities,   setQuantities]   = useState({
    "Adult 19+": 0, "Senior 65+": 0, "Youth 13-18": 0, "Child 12 & Under": 0,
  });
  const [isMember,     setIsMember]     = useState(false);
  const [memberLevel,  setMemberLevel]  = useState(null);
  const [isThursday,   setIsThursday]   = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [step,         setStep]         = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const userId = localStorage.getItem("user_id");

  // ── Membership check ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || userId;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.membership_level && data?.expiration_date) {
          // Parse without UTC shift
          const s = String(data.expiration_date).slice(0, 10);
          const [y, m, d] = s.split("-").map(Number);
          const exp = new Date(y, m - 1, d);
          const now = new Date(); now.setHours(0, 0, 0, 0);
          if (exp >= now) { setIsMember(true); setMemberLevel(data.membership_level); }
          else            { setIsMember(false); setMemberLevel(null); }
        } else {
          setIsMember(false); setMemberLevel(null);
        }
      })
      .catch(() => { setIsMember(false); setMemberLevel(null); });
  }, [userId]);

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
    // Use local constructor — never pass "YYYY-MM-DD" string to new Date()
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

  // ── Quantity ────────────────────────────────────────────────────────────────
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

  const totalTickets     = Object.values(quantities).reduce((a, b) => a + b, 0);
  const remainingTickets = MAX_TOTAL_TICKETS - totalTickets;

  // ── Pricing flags ───────────────────────────────────────────────────────────
  const isFreeAdmissionTier = FREE_ADMISSION_TIERS.includes(memberLevel);
  const discountPct         = isMember && !isFreeAdmissionTier ? (TICKET_TIER_DISCOUNT[memberLevel] ?? 0) : 0;
  const everythingFree      = isThursday || isFreeAdmissionTier;

  const getDisplayPrice = (ticketType) => {
    const t = TICKET_TYPES.find(tt => tt.type === ticketType);
    if (!t || t.basePrice === 0) return { display: "FREE", value: 0, original: null };
    if (everythingFree)          return { display: "FREE", value: 0, original: null };
    if (discountPct > 0) {
      const discounted = parseFloat((t.basePrice * (1 - discountPct / 100)).toFixed(2));
      return { display: `$${discounted.toFixed(2)}`, value: discounted, original: `$${t.basePrice.toFixed(2)}` };
    }
    return { display: `$${t.basePrice.toFixed(2)}`, value: t.basePrice, original: null };
  };

  const displayTickets = TICKET_TYPES
    .filter(t => quantities[t.type] > 0)
    .map(t => ({ ...t, qty: quantities[t.type], priceInfo: getDisplayPrice(t.type) }));

  const displayTotal = displayTickets.reduce((sum, t) => sum + t.priceInfo.value * t.qty, 0);

  // ── Member banner text — no emoji, bold handled by wrapping in <strong> ────
  const getMemberBenefitText = () => {
    if (isThursday) return null;
    if (isFreeAdmissionTier)
      return `${memberLevel} members receive free admission — all tickets are complimentary.`;
    if (discountPct > 0)
      return `${memberLevel} member benefit: ${discountPct}% off all tickets.`;
    return `${memberLevel} member benefits applied.`;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!userId)    return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");
    if (new Date(visitDate + "T00:00:00").getDay() === 1)
      return setErrorMsg("The museum is closed on Mondays.");
    if (totalTickets === 0) return setErrorMsg("Please select at least one ticket.");

    const tickets = TICKET_TYPES
      .filter(t => quantities[t.type] > 0)
      .map(t => {
        const priceInfo = getDisplayPrice(t.type);
        return {
          type:          t.type,
          label:         t.label,
          quantity:      quantities[t.type],
          basePrice:     t.basePrice,
          finalPrice:    priceInfo.value,
          discount_type: (!isThursday && isMember) ? "Member" : "None",
        };
      });

    const orderTotal = tickets.reduce((sum, t) => sum + t.finalPrice * t.quantity, 0);

    // Skip checkout for fully free orders
    if (orderTotal === 0) {
      try {
        const today = new Date();
        const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
        const transactionId = Date.now();
        const token = localStorage.getItem("token") || userId;

        const results = await Promise.all(
          tickets.flatMap(t =>
            Array.from({ length: t.quantity }, () =>
              fetch(`${BASE_URL}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  user_id:        Number(userId),
                  purchase_date:  localDate,
                  visit_date:     visitDate,
                  ticket_type:    t.type,
                  base_price:     t.basePrice,
                  discount_type:  t.discount_type,
                  final_price:    0,
                  payment_method: "Free",
                  transaction_id: transactionId,
                }),
              })
            )
          )
        );

        if (results.every(r => r.ok)) {
          navigate("/", { state: { successToast: "Your free tickets have been confirmed! See you soon." } });
        } else {
          setErrorMsg("Something went wrong processing your free tickets. Please try again.");
        }
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
      }
      return;
    }

    navigate("/checkout", {
      state: {
        type:         "tickets",
        tickets,
        visitDate,
        discount:     isThursday
          ? "Thursday Special"
          : isFreeAdmissionTier
          ? `${memberLevel} — Free Admission`
          : isMember && discountPct > 0
          ? `${memberLevel} Member (${discountPct}% off)`
          : "None",
        totalTickets: tickets.reduce((s, t) => s + t.quantity, 0),
        total:        orderTotal,
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

      {step === "tickets" && selectedDate && (
        <div className="tickets-selection-section">
          <form onSubmit={handleSubmit}>

            {isThursday && (
              <div className="thursday-discount-banner">
                Admission is FREE every Thursday!
              </div>
            )}

            {isMember && !isThursday && (
              <div className="member-discount-banner">
                <strong>{getMemberBenefitText()}</strong>
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
                const priceInfo    = getDisplayPrice(t.type);
                return (
                  <div className="ticket-row" key={t.type}>
                    <div className="ticket-row-info">
                      <div className="ticket-row-name">{t.label}</div>
                      <div className="ticket-row-desc">{t.desc}</div>
                    </div>
                    <div className="ticket-row-price">
                      {priceInfo.original ? (
                        <span>
                          <span className="original-price">{priceInfo.original}</span>
                          {priceInfo.display}
                        </span>
                      ) : priceInfo.display}
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

            <div className="tickets-summary">
              {totalTickets === 0 ? (
                <p className="tickets-empty-summary">No tickets selected</p>
              ) : (
                <>
                  {displayTickets.map(t => (
                    <div className="summary-line" key={t.type}>
                      <span>
                        {t.qty}× {t.label}
                        {isMember && !isThursday && !isFreeAdmissionTier && discountPct > 0 && t.basePrice > 0 && (
                          <span style={{ fontSize: 11, color: "#c9a84c", marginLeft: 6 }}>
                            ({discountPct}% off)
                          </span>
                        )}
                      </span>
                      <span>
                        {everythingFree || t.priceInfo.value === 0
                          ? "FREE"
                          : `$${(t.priceInfo.value * t.qty).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>
                      {everythingFree || displayTotal === 0
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
                : everythingFree || displayTotal === 0
                ? "Confirm Free Tickets"
                : `Proceed to Checkout — $${displayTotal.toFixed(2)}`}
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