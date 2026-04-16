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

function getDiscountedPrice(basePrice, discount) {
  if (discount === "Student")  return basePrice * 0.8;
  if (discount === "Military") return basePrice * 0.85;
  if (discount === "Member")   return basePrice * 0.75;
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

  const userId  = localStorage.getItem("user_id");
  const today   = new Date().toISOString().split("T")[0];

  // Auto-apply member discount
  const discount = isMember ? "Member" : "None";

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { "Authorization": `Bearer ${userId}` }
    })
      .then(res => setIsMember(res.ok))
      .catch(() => setIsMember(false));
  }, [userId]);

  function adjust(type, delta) {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + delta)
    }));
  }

  const summaryLines = TICKET_TYPES.filter(t => quantities[t.type] > 0).map(t => ({
    label:      `${quantities[t.type]}x ${t.label}`,
    price:      getDiscountedPrice(t.basePrice, discount) * quantities[t.type],
  }));

  const total        = summaryLines.reduce((sum, l) => sum + l.price, 0);
  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!userId)           return setErrorMsg("Please log in first.");
    if (!visitDate)        return setErrorMsg("Select a visit date.");
    if (visitDate < today) return setErrorMsg("Visit date must be today or a future date.");
    const selectedDay = new Date(visitDate + "T00:00:00").getDay();
    if (selectedDay === 1) return setErrorMsg("The museum is closed on Mondays. Please select a different date.");
    if (totalTickets === 0) return setErrorMsg("Please select at least one ticket.");

    const tickets = TICKET_TYPES
      .filter(t => quantities[t.type] > 0)
      .map(t => ({
        type:       t.type,
        label:      t.label,
        quantity:   quantities[t.type],
        basePrice:  t.basePrice,
        finalPrice: getDiscountedPrice(t.basePrice, discount),
      }));

    const orderTotal = tickets.reduce((sum, t) => sum + t.finalPrice * t.quantity, 0);
    const orderCount = tickets.reduce((sum, t) => sum + t.quantity, 0);

    navigate("/checkout", {
      state: {
        type:         "tickets",
        tickets,
        visitDate,
        discount,
        totalTickets: orderCount,
        total:        orderTotal,
      }
    });
  }

  return (
    <div className="tickets-page">
      <div className="tickets-hero">
        <p className="tickets-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="tickets-title">Buy Tickets</h1>
        <p className="tickets-subtitle">Purchase admission tickets for your visit</p>
      </div>

      {/* Member discount banner */}
      {isMember && (
        <div style={{
          padding: "0.75rem 1rem",
          background: "#fefce8",
          border: "1px solid var(--color-gold)",
          color: "var(--color-gold)",
          fontSize: "0.85rem",
          marginBottom: "1.5rem",
        }}>
          ✅ Member discount (25% off) automatically applied to all tickets
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <p className="tickets-section-label">Visit Details</p>
        <div className="tickets-details-row">
          <div className="tickets-field">
            <label>Visit Date</label>
            <input
              type="date"
              value={visitDate}
              min={today}
              onChange={e => setVisitDate(e.target.value)}
              required
            />
          </div>
        </div>

        <p className="tickets-section-label">
          Select Tickets
          <span style={{ fontSize: "0.72rem", color: "var(--color-gray-light)", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>
          </span>
        </p>
        <div className="ticket-rows">
          {TICKET_TYPES.map(t => {
            const finalPrice = getDiscountedPrice(t.basePrice, discount);
            return (
              <div className="ticket-row" key={t.type}>
                <div className="ticket-row-info">
                  <div className="ticket-row-name">{t.label}</div>
                  <div className="ticket-row-desc">{t.desc}</div>
                </div>
                <div className="ticket-row-price">
                  {isMember && t.basePrice > 0 && (
                    <span style={{ textDecoration: "line-through", color: "var(--color-gray-light)", fontSize: "0.8rem", marginRight: "0.4rem" }}>
                      ${t.basePrice.toFixed(2)}
                    </span>
                  )}
                  ${finalPrice.toFixed(2)}
                </div>
                <div className="ticket-counter">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjust(t.type, -1)}
                    disabled={quantities[t.type] === 0}
                  >−</button>
                  <span className="counter-val">{quantities[t.type]}</span>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjust(t.type, 1)}
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
                  <span>${l.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="summary-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {errorMsg && (
          <div className="tickets-feedback error">{errorMsg}</div>
        )}

        <button
          className="tickets-purchase-btn"
          type="submit"
          disabled={totalTickets === 0}
        >
          {totalTickets > 0
            ? `Proceed to Checkout — $${total.toFixed(2)}`
            : "Select Tickets to Continue"}
        </button>

      </form>
    </div>
  );
}