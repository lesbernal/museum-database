// src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import { getEvents, postTicket } from "../services/api";
import "../styles/Tickets.css";

export default function Tickets() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [ticketType, setTicketType] = useState("Adult");
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(20); // example default
  const [discountType, setDiscountType] = useState("None");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("http://localhost:5000/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load events.");
      }
    }
    loadEvents();
  }, []);

  function calculateFinalPrice(base, type) {
    let discount = 0;
    if (type === "Student") discount = 0.2;
    if (type === "Senior") discount = 0.15;
    return base * (1 - discount);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("You must be logged in to buy tickets.");
      return;
    }
    if (!selectedEvent || !visitDate || quantity < 1) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      for (let i = 0; i < quantity; i++) {
        const ticket = {
          user_id: userId,
          purchase_date: new Date().toISOString().split("T")[0],
          visit_date: visitDate,
          ticket_type: ticketType,
          base_price: basePrice,
          discount_type: discountType,
          final_price: calculateFinalPrice(basePrice, ticketType),
          payment_method: paymentMethod
        };

        await fetch("http://localhost:5000/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ticket)
        });
      }
      setSuccessMsg(`Successfully purchased ${quantity} ticket(s)!`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to purchase tickets.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tickets-page">
      <h1>Buy Tickets</h1>

      {errorMsg && <p className="error">{errorMsg}</p>}
      {successMsg && <p className="success">{successMsg}</p>}

      <form className="ticket-form" onSubmit={handleSubmit}>
        <label>
          Event:
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">Select Event</option>
            {events.map((e) => (
              <option key={e.event_id} value={e.event_id}>
                {e.event_name} ({e.event_date})
              </option>
            ))}
          </select>
        </label>

        <label>
          Visit Date:
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
        </label>

        <label>
          Ticket Type:
          <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
            <option value="Adult">Adult</option>
            <option value="Student">Student</option>
            <option value="Senior">Senior</option>
          </select>
        </label>

        <label>
          Quantity:
          <input
            type="number"
            value={quantity}
            min={1}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
        </label>

        <label>
          Payment Method:
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Buy Tickets"}
        </button>
      </form>
    </div>
  );
}