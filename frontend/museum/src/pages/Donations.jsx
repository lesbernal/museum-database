// src/pages/Donations.jsx
import { useState } from "react";
import "../styles/theme.css";

export default function Donations() {
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState("General");
  const [method, setMethod] = useState("Credit Card");
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");  // ← was missing

  async function handleDonate(e) {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    if (!userId) return setErrorMsg("Please log in first.");
    if (!amount || amount <= 0) return setErrorMsg("Enter a valid amount.");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`  // ← was missing
        },
        body: JSON.stringify({
          donation_date: new Date().toISOString().split("T")[0],
          amount: amount,
          donation_type: donationType,  // ← was undefined
          payment_method: method        // ← was never sent
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Donation failed");
      }

      setMsg("Thank you for your donation!");
      setAmount("");
    } catch (err) {
      setErrorMsg(err.message || "Donation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Support the Museum</h1>

      <form className="card" style={{ padding: "var(--spacing-xl)", maxWidth: "400px" }} onSubmit={handleDonate}>

        <div>
          <label>Donation Amount</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

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
    </div>
  );
}