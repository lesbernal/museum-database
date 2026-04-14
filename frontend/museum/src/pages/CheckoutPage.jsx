// src/pages/CheckoutPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/CheckoutPage.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CheckoutPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const order     = location.state; // passed from Tickets or Donations

  const [cardName,   setCardName]   = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  const userId = localStorage.getItem("user_id");

  // If no order data redirect back
  useEffect(() => {
    if (!order) navigate(-1);
  }, [order]);

  // ── Format card number with spaces ──────────────────────────────────────────
  function handleCardNumber(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  }

  // ── Format expiry MM/YY ──────────────────────────────────────────────────────
  function handleExpiry(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
    setExpiry(val);
  }

  // ── Validate ─────────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    const rawCard = cardNumber.replace(/\s/g, "");

    if (!cardName.trim()) {
      errs.cardName = "Name on card is required.";
    }
    if (rawCard.length !== 16) {
      errs.cardNumber = "Card number must be 16 digits.";
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      errs.expiry = "Enter a valid expiry date (MM/YY).";
    } else {
      const [mm, yy] = expiry.split("/").map(Number);
      const now = new Date();
      const exp = new Date(2000 + yy, mm - 1, 1);
      if (mm < 1 || mm > 12) {
        errs.expiry = "Month must be between 01 and 12.";
      } else if (exp <= now) {
        errs.expiry = "Card has expired.";
      }
    }
    if (cvv.length !== 3) {
      errs.cvv = "CVV must be 3 digits.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      if (order.type === "tickets") {
        // Submit each ticket
        for (const ticket of order.tickets) {
          for (let i = 0; i < ticket.quantity; i++) {
            const res = await fetch(`${BASE_URL}/tickets`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userId}`
              },
              body: JSON.stringify({
                user_id:        userId,
                purchase_date:  new Date().toISOString().split("T")[0],
                visit_date:     order.visitDate,
                ticket_type:    ticket.type,
                base_price:     ticket.basePrice,
                discount_type:  order.discount,
                final_price:    ticket.finalPrice,
                payment_method: "Credit Card"
              })
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Ticket purchase failed");
            }
          }
        }
      } else if (order.type === "donation") {
        const res = await fetch(`${BASE_URL}/donations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userId}`
          },
          body: JSON.stringify({
            donation_date:  new Date().toISOString().split("T")[0],
            amount:         order.amount,
            donation_type:  order.donationType,
            payment_method: "Credit Card"
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Donation failed");
        }
      }

      // Navigate home with success toast state
      navigate("/", { state: { successToast: order.type === "tickets"
        ? `Successfully purchased ${order.totalTickets} ticket(s)!`
        : `Thank you for your $${parseFloat(order.amount).toLocaleString()} donation!`
      }});

    } catch (err) {
      setErrors({ submit: err.message || "Payment failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (!order) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* Left — Order Summary */}
        <div className="checkout-summary">
          <p className="checkout-eyebrow">Museum of Fine Arts, Houston</p>
          <h2 className="checkout-summary-title">Order Summary</h2>

          {order.type === "tickets" && (
            <>
              <div className="summary-section">
                <p className="summary-label">Visit Date</p>
                <p className="summary-value">{order.visitDate}</p>
              </div>
              <div className="summary-section">
                <p className="summary-label">Discount</p>
                <p className="summary-value">{order.discount}</p>
              </div>
              <div className="summary-items">
                {order.tickets.map(t => (
                  <div className="summary-item" key={t.type}>
                    <span>{t.quantity}x {t.label}</span>
                    <span>${(t.finalPrice * t.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </>
          )}

          {order.type === "donation" && (
            <>
              <div className="summary-section">
                <p className="summary-label">Donation Type</p>
                <p className="summary-value">{order.donationType}</p>
              </div>
              <div className="summary-total">
                <span>Donation Amount</span>
                <span>${parseFloat(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
        </div>

        {/* Right — Card Form */}
        <div className="checkout-form-section">
          <h2 className="checkout-form-title">Payment Details</h2>
          <p className="checkout-form-subtitle">All transactions are secure and encrypted</p>

          <form onSubmit={handleSubmit} className="checkout-form">

            <div className="checkout-field">
              <label>Name on Card</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
              />
              {errors.cardName && <p className="checkout-error">{errors.cardName}</p>}
            </div>

            <div className="checkout-field">
              <label>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumber}
                inputMode="numeric"
                maxLength={19}
              />
              {errors.cardNumber && <p className="checkout-error">{errors.cardNumber}</p>}
            </div>

            <div className="checkout-field-row">
              <div className="checkout-field">
                <label>Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiry}
                  inputMode="numeric"
                  maxLength={5}
                />
                {errors.expiry && <p className="checkout-error">{errors.expiry}</p>}
              </div>

              <div className="checkout-field">
                <label>CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                  maxLength={3}
                />
                {errors.cvv && <p className="checkout-error">{errors.cvv}</p>}
              </div>
            </div>

            {errors.submit && (
              <div className="checkout-submit-error">{errors.submit}</div>
            )}

            <button
              type="submit"
              className="checkout-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : order.type === "tickets"
                ? `Pay $${order.total.toFixed(2)}`
                : `Donate $${parseFloat(order.amount).toLocaleString()}`}
            </button>

            <button
              type="button"
              className="checkout-back-btn"
              onClick={() => navigate(-1)}
            >
              ← Go Back
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}