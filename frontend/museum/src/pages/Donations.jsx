// src/pages/Donations.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/theme.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Donations() {
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState("General");
  const [method, setMethod] = useState("Credit Card");
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [membershipEarned, setMembershipEarned] = useState(null); // tracks what tier was earned

  const userId = localStorage.getItem("user_id");

  // Check if donation amount qualifies for a membership tier
  function getMembershipEarned(donationAmount) {
    const amt = parseFloat(donationAmount);
    if (amt >= 5000) return "Leadership Circle";
    if (amt >= 1500) return "Benefactor";
    return null;
  }

  // Tier styling
  function getTierStyle(tier) {
    if (tier === "Leadership Circle") return { bg: "#fff1f2", color: "#9f1239", border: "#fb7185", icon: "👑" };
    if (tier === "Benefactor") return { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc", icon: "⭐" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db", icon: "🎉" };
  }

  async function handleDonate(e) {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");
    setMembershipEarned(null);

    if (!userId) return setErrorMsg("Please log in first.");
    if (!amount || amount <= 0) return setErrorMsg("Enter a valid amount.");

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`
        },
        body: JSON.stringify({
          donation_date: new Date().toISOString().split("T")[0],
          amount: amount,
          donation_type: donationType,
          payment_method: method
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Donation failed");
      }

      // Check if they earned a membership tier
      const earned = getMembershipEarned(amount);
      if (earned) {
        setMembershipEarned(earned);
        // Update localStorage role so rest of app reflects member status
        localStorage.setItem("role", "member");
      }

      setMsg("Thank you for your donation!");
      setAmount("");
    } catch (err) {
      setErrorMsg(err.message || "Donation failed.");
    } finally {
      setLoading(false);
    }
  }

  const tierStyle = membershipEarned ? getTierStyle(membershipEarned) : null;

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Support the Museum</h1>

      <form
        className="card"
        style={{ padding: "var(--spacing-xl)", maxWidth: "400px" }}
        onSubmit={handleDonate}
      >
        <div>
          <label>Donation Amount</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Live tier preview based on amount typed */}
        {parseFloat(amount) >= 1500 && (
          <div style={{
            marginTop: "8px",
            padding: "8px 12px",
            background: parseFloat(amount) >= 5000 ? "#fff1f2" : "#f3e8ff",
            color: parseFloat(amount) >= 5000 ? "#9f1239" : "#6b21a8",
            border: `1px solid ${parseFloat(amount) >= 5000 ? "#fb7185" : "#c084fc"}`,
            borderRadius: "6px",
            fontSize: "0.85rem"
          }}>
            {parseFloat(amount) >= 5000
              ? "👑 This donation qualifies you for Leadership Circle membership!"
              : "⭐ This donation qualifies you for Benefactor membership!"}
          </div>
        )}

        <div>
          <label>Donation Type</label>
          <select value={donationType} onChange={(e) => setDonationType(e.target.value)}>
            <option>General</option>
            <option>Scholarship</option>
            <option>Exhibition</option>
            <option>Conservation</option>
          </select>
        </div>

        <div>
          <label>Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash</option>
          </select>
        </div>

        {errorMsg && <p className="error-message">{errorMsg}</p>}
        {msg && <p className="success-message">{msg}</p>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Processing..." : "Donate"}
        </button>
      </form>

      {/* Membership earned widget */}
      {membershipEarned && tierStyle && (
        <div style={{
          marginTop: "var(--spacing-xl)",
          maxWidth: "400px",
          padding: "var(--spacing-xl)",
          background: tierStyle.bg,
          border: `2px solid ${tierStyle.border}`,
          borderRadius: "12px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "8px" }}>{tierStyle.icon}</div>
          <h2 style={{ color: tierStyle.color, marginBottom: "8px" }}>
            You're now a {membershipEarned} Member!
          </h2>
          <p style={{ color: tierStyle.color, fontSize: "0.95rem", marginBottom: "16px" }}>
            Your generous donation of ${parseFloat(amount || 0).toLocaleString()} has unlocked{" "}
            <strong>{membershipEarned}</strong> membership status. Thank you for supporting the museum!
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/member-dashboard"
              style={{
                padding: "0.625rem 1.25rem",
                background: tierStyle.color,
                color: "#fff",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              View My Dashboard
            </Link>
            <Link
              to="/membership"
              style={{
                padding: "0.625rem 1.25rem",
                border: `1px solid ${tierStyle.border}`,
                color: tierStyle.color,
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              View Membership Benefits
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}