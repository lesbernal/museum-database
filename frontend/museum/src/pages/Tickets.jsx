// src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";

export default function Tickets() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [ticketType, setTicketType] = useState("Adult");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => setErrorMsg("Failed to load events."));
  }, []);

  function calculatePrice(type) {
    let base = 20;
    if (type === "Student") return base * 0.8;
    if (type === "Senior") return base * 0.85;
    return base;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userId) return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      for (let i = 0; i < quantity; i++) {
        await fetch("http://localhost:5000/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            purchase_date: new Date().toISOString().split("T")[0],
            visit_date: visitDate,
            ticket_type: ticketType,
            base_price: 20,
            discount_type: ticketType,
            final_price: calculatePrice(ticketType),
            payment_method: paymentMethod
          })
        });
      }

      setSuccessMsg(`Purchased ${quantity} ticket(s)!`);
    } catch {
      setErrorMsg("Purchase failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Buy Tickets</h1>

      <form className="card" style={{ padding: "var(--spacing-xl)", maxWidth: "500px" }} onSubmit={handleSubmit}>
        
        <div>
          <label>Event</label>
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">Select Event</option>
            {events.map(e => (
              <option key={e.event_id} value={e.event_id}>
                {e.event_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Visit Date</label>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        </div>

        <div>
          <label>Ticket Type</label>
          <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
            <option>Adult</option>
            <option>Student</option>
            <option>Senior</option>
          </select>
        </div>

        <div>
          <label>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>

        <div>
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash</option>
          </select>
        </div>

        {errorMsg && <p className="error-message">{errorMsg}</p>}
        {successMsg && <p className="success-message">{successMsg}</p>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Processing..." : "Buy Tickets"}
        </button>
      </form>
    </div>
  );
}