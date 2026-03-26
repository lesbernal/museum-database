// src/pages/Donations.jsx
import { useState } from "react";
import "../styles/theme.css";

export default function Donations() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Credit Card");
  const [msg, setMsg] = useState("");

  async function handleDonate(e) {
    e.preventDefault();

    await fetch("http://localhost:5000/donations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount, method })
    });

    setMsg("Thank you for your donation!");
  }

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Support the Museum</h1>

      <form className="card" style={{ padding: "var(--spacing-xl)", maxWidth: "400px" }} onSubmit={handleDonate}>
        
        <div>
          <label>Donation Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div>
          <label>Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash</option>
          </select>
        </div>

        {msg && <p className="success-message">{msg}</p>}

        <button className="btn btn-primary">Donate</button>
      </form>
    </div>
  );
}