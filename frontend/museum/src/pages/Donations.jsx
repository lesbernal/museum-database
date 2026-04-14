// src/pages/Donations.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Donations.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000];

function getMembershipEarned(amount) {
  const amt = parseFloat(amount);
  if (amt >= 5000) return "Leadership Circle";
  if (amt >= 1500) return "Benefactor";
  return null;
}

function getTierClass(tier) {
  if (tier === "Leadership Circle") return "leadership";
  if (tier === "Benefactor") return "benefactor";
  return "";
}

function getTierIcon(tier) {
  return "";
}

export default function Donations() {
  const navigate = useNavigate();

  const [amount,       setAmount]       = useState("");
  const [donationType, setDonationType] = useState("General");
  const [feedback,     setFeedback]     = useState(null);

  const userId       = localStorage.getItem("user_id");
  const parsedAmount = parseFloat(amount) || 0;
  const tierEarned   = getMembershipEarned(amount);
  const tierClass    = getTierClass(tierEarned);

  function handleQuickAmount(val) {
    setAmount(String(val));
  }

  function handleDonate(e) {
    e.preventDefault();
    setFeedback(null);

    if (!userId)                      return setFeedback({ type: "error", text: "Please log in first." });
    if (!amount || parsedAmount <= 0) return setFeedback({ type: "error", text: "Enter a valid donation amount." });

    navigate("/checkout", {
      state: {
        type:         "donation",
        amount:       parsedAmount,
        donationType,
      }
    });
  }

  return (
    <div className="donations-page">

      {/* Hero */}
      <div className="donations-hero">
        <p className="donations-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="donations-title">Support the Museum</h1>
        <p className="donations-subtitle">Your generosity helps preserve art and culture for future generations</p>
      </div>

      <form onSubmit={handleDonate}>

        {/* Quick amounts */}
        <p className="donations-section-label">Select an Amount</p>
        <div className="donations-quick-amounts">
          {QUICK_AMOUNTS.map(val => (
            <button
              key={val}
              type="button"
              className={`quick-amount-btn ${String(val) === amount ? "active" : ""}`}
              onClick={() => handleQuickAmount(val)}
            >
              ${val.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="donations-form-row-single donations-field">
          <label>Custom Amount</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="amount-input"
          />
        </div>

        {/* Tier preview */}
        {parsedAmount >= 1500 && (
          <div className={`donations-tier-preview ${tierClass}`}>
            <span className="tier-preview-icon">{getTierIcon(tierEarned)}</span>
            <span className={`tier-preview-text ${tierClass}`}>
              This donation qualifies you for <strong>{tierEarned}</strong> membership!
            </span>
          </div>
        )}

        {/* Donation details */}
        <p className="donations-section-label">Donation Details</p>
        <div className="donations-form-row-single donations-field">
          <label>Donation Type</label>
          <select value={donationType} onChange={e => setDonationType(e.target.value)}>
            <option>General</option>
            <option>Scholarship</option>
            <option>Exhibition</option>
            <option>Conservation</option>
          </select>
        </div>

        {/* Summary */}
        {parsedAmount > 0 && (
          <div className="donations-summary">
            <div className="donations-summary-row">
              <span>Donation Type</span>
              <span>{donationType}</span>
            </div>
            <div className="donations-summary-total">
              <span>Total</span>
              <span>${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`donations-feedback ${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        <button
          className="donations-submit-btn"
          type="submit"
          disabled={parsedAmount <= 0}
        >
          {parsedAmount > 0
            ? `Proceed to Checkout — $${parsedAmount.toLocaleString()}`
            : "Enter an Amount to Continue"}
        </button>

      </form>
    </div>
  );
}