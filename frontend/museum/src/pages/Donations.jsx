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

export default function Donations() {
  const navigate = useNavigate();

  const [amount,       setAmount]       = useState("");
  const [donationType, setDonationType] = useState("General");
  const [isCustom,     setIsCustom]     = useState(false);
  const [feedback,     setFeedback]     = useState(null);

  const userId       = localStorage.getItem("user_id");
  const parsedAmount = parseFloat(amount) || 0;
  const tierEarned   = getMembershipEarned(amount);

  function handleQuickAmount(val) {
    setAmount(String(val));
    setIsCustom(false);
  }

  function handleCustomAmount(e) {
    setAmount(e.target.value);
    setIsCustom(true);
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

      {/* Hero Section */}
      <div className="donations-hero">
        <div className="donations-hero-content">
          <p className="donations-eyebrow">Museum of Fine Arts, Houston</p>
          <h1 className="donations-title">Support the Museum</h1>
          <p className="donations-subtitle">
            Your generosity helps preserve art and culture for future generations.
          </p>
        </div>
      </div>

      <form onSubmit={handleDonate} className="donations-form">

        {/* Quick amounts */}
        <p className="donations-section-label">Select an Amount</p>
        <div className="donations-quick-amounts">
          {QUICK_AMOUNTS.map(val => (
            <button
              key={val}
              type="button"
              className={`quick-amount-btn ${String(val) === amount && !isCustom ? "active" : ""}`}
              onClick={() => handleQuickAmount(val)}
            >
              ${val.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            className={`quick-amount-btn custom ${isCustom ? "active" : ""}`}
            onClick={() => setIsCustom(true)}
          >
            Other
          </button>
        </div>

        {/* Custom amount */}
        {isCustom && (
          <div className="donations-custom-field">
            <label>Custom Amount ($)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={handleCustomAmount}
              placeholder="Enter any amount"
              className="custom-amount-input"
              autoFocus
            />
          </div>
        )}

        {/* Tier preview */}
        {parsedAmount >= 1500 && (
          <div className={`donations-tier-preview ${tierEarned === "Leadership Circle" ? "leadership" : "benefactor"}`}>
            <span className="tier-icon">🏆</span>
            <span className="tier-text">
              This donation qualifies you for <strong>{tierEarned}</strong> membership!
            </span>
          </div>
        )}

        {/* Donation details */}
        <p className="donations-section-label">Donation Details</p>
        <div className="donations-details-grid">
          <div className="donations-field">
            <label>Designation</label>
            <select value={donationType} onChange={e => setDonationType(e.target.value)}>
              <option value="General">General Support</option>
              <option value="Scholarship">Education & Scholarships</option>
              <option value="Exhibition">Exhibitions Fund</option>
              <option value="Conservation">Art Conservation</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        {parsedAmount > 0 && (
          <div className="donations-summary">
            <div className="donations-summary-row">
              <span>Donation Type</span>
              <span>{donationType}</span>
            </div>
            <div className="donations-summary-total">
              <span>Your Gift</span>
              <span>${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <p className="donations-tax-note">
              The Museum of Fine Arts, Houston is a 501(c)(3) nonprofit organization. Your donation is tax-deductible to the full extent of the law.
            </p>
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
            ? `Donate $${parsedAmount.toLocaleString()}`
            : "Select an Amount to Continue"}
        </button>

        <p className="donations-footer-note">
          Questions? Contact our development office at <strong>development@mfah.org</strong> or <strong>(713) 639-7300</strong>.
        </p>

      </form>
    </div>
  );
}