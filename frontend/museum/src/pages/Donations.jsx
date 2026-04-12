// src/pages/Donations.jsx
import { useState } from "react";
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
  if (tier === "Leadership Circle") return "👑";
  if (tier === "Benefactor") return "⭐";
  return "🎉";
}

export default function Donations() {
  const [amount,           setAmount]           = useState("");
  const [donationType,     setDonationType]     = useState("General");
  const [method,           setMethod]           = useState("Credit Card");
  const [loading,          setLoading]          = useState(false);
  const [feedback,         setFeedback]         = useState(null);
  const [membershipEarned, setMembershipEarned] = useState(null);
  const [showEarnedToast,  setShowEarnedToast]  = useState(false);

  const userId       = localStorage.getItem("user_id");
  const parsedAmount = parseFloat(amount) || 0;
  const tierEarned   = getMembershipEarned(amount);
  const tierClass    = getTierClass(tierEarned);

  function handleQuickAmount(val) {
    setAmount(String(val));
  }

  async function handleDonate(e) {
    e.preventDefault();
    setFeedback(null);
    setMembershipEarned(null);
    setShowEarnedToast(false);

    if (!userId)                    return setFeedback({ type: "error", text: "Please log in first." });
    if (!amount || parsedAmount <= 0) return setFeedback({ type: "error", text: "Enter a valid donation amount." });

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`
        },
        body: JSON.stringify({
          donation_date:  new Date().toISOString().split("T")[0],
          amount:         parsedAmount,
          donation_type:  donationType,
          payment_method: method
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Donation failed");
      }

      // Check if single donation amount earns a tier
      const earned = getMembershipEarned(amount);
      if (earned) {
        setMembershipEarned(earned);
        setShowEarnedToast(true);
        localStorage.setItem("role", "member");
        setTimeout(() => setShowEarnedToast(false), 5000);
      }

      setFeedback({ type: "success", text: `Thank you! Your donation of $${parsedAmount.toLocaleString()} has been received.` });
      setAmount("");
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Donation failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Membership upgrade toast */}
      {showEarnedToast && membershipEarned && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: "0.875rem 2rem",
          background: "rgba(187, 247, 208, 0.92)",
          backdropFilter: "blur(4px)",
          borderBottom: "1px solid rgba(134, 239, 172, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          animation: "slideDown 0.3s ease",
        }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#14532d", letterSpacing: "0.03em" }}>
            {getTierIcon(membershipEarned)} You have been upgraded to the <strong>{membershipEarned}</strong> philanthropy level
          </span>
        </div>
      )}

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
          <div className="donations-form-row">
            <div className="donations-field">
              <label>Donation Type</label>
              <select value={donationType} onChange={e => setDonationType(e.target.value)}>
                <option>General</option>
                <option>Scholarship</option>
                <option>Exhibition</option>
                <option>Conservation</option>
              </select>
            </div>
            <div className="donations-field">
              <label>Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Cash</option>
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
              <div className="donations-summary-row">
                <span>Payment Method</span>
                <span>{method}</span>
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
            disabled={loading || parsedAmount <= 0}
          >
            {loading ? "Processing..." : parsedAmount > 0 ? `Donate $${parsedAmount.toLocaleString()}` : "Donate"}
          </button>

        </form>
      </div>
    </>
  );
}