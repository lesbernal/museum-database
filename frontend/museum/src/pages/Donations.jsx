// src/pages/Donations.jsx
import { useState } from "react";
import "../styles/Donations.css";

export default function Donations() {
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState("General");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userId = localStorage.getItem("user_id");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("You must be logged in to donate.");
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const donation = {
        user_id: userId,
        donation_date: new Date().toISOString().split("T")[0],
        amount: parseFloat(amount),
        donation_type: donationType
      };

      const res = await fetch("http://localhost:5000/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donation)
      });

      if (!res.ok) throw new Error("Donation failed");

      setSuccessMsg(`Thank you for donating $${amount}!`);
      setAmount("");
      setDonationType("General");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to submit donation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="donations-page">
      <h1>Donate</h1>

      {errorMsg && <p className="error">{errorMsg}</p>}
      {successMsg && <p className="success">{successMsg}</p>}

      <form className="donation-form" onSubmit={handleSubmit}>
        <label>
          Amount ($):
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Donation Type:
          <select value={donationType} onChange={(e) => setDonationType(e.target.value)}>
            <option>General</option>
            <option>Membership</option>
            <option>Special Campaign</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Donate"}
        </button>
      </form>
    </div>
  );
}