// src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";

export default function Tickets() {
  const [visitDate, setVisitDate] = useState("");
  const [ticketType, setTicketType] = useState("Adult 19+");
  const [discountType, setDiscountType] = useState("None");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userId = localStorage.getItem("user_id");
  const today = new Date().toISOString().split("T")[0];


  // Check if the logged-in user is a member
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:5000/members/${userId}`, {
      headers: { "Authorization": `Bearer ${userId}` }
    })
      .then(res => {
        if (res.ok) setIsMember(true);
        else setIsMember(false);
      })
      .catch(() => setIsMember(false));
  }, [userId]);

  function getBasePrice(type) {
    if (type === "Adult 19+") return 20;
    if (type === "Senior 65+") return 15;
    if (type === "Youth 13-18") return 12;
    if (type === "Child 12 & Under") return 0;
    return 20;
  }

  function calculateFinalPrice(type, discount) {
    const base = getBasePrice(type);
    if (discount === "Student") return base * 0.8;
    if (discount === "Military") return base * 0.85;
    if (discount === "Member") return base * 0.75;
    return base;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!userId) return setErrorMsg("Please log in first.");
    if (!visitDate) return setErrorMsg("Select a visit date.");
    if (visitDate < today) return setErrorMsg("Visit date must be today or a future date.");

    // Block member discount if not a member
    if (discountType === "Member" && !isMember) {
      return setErrorMsg("You must be a museum member to use the Member discount.");
    }

    const base = getBasePrice(ticketType);
    const final = calculateFinalPrice(ticketType, discountType);

    setLoading(true);

    try {
      for (let i = 0; i < quantity; i++) {
        const res = await fetch("http://localhost:5000/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userId}`
          },
          body: JSON.stringify({
            user_id: userId,
            purchase_date: new Date().toISOString().split("T")[0],
            visit_date: visitDate,
            ticket_type: ticketType,
            base_price: base,
            discount_type: discountType,
            final_price: final,
            payment_method: paymentMethod
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Purchase failed");
        }
      }

      setSuccessMsg(`Successfully purchased ${quantity} ticket(s)!`);
      setVisitDate("");
      setQuantity(1);
    } catch (err) {
      setErrorMsg(err.message || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Buy Tickets</h1>

      <form
        className="card"
        style={{ padding: "var(--spacing-xl)", maxWidth: "500px" }}
        onSubmit={handleSubmit}
      >
        <div>
          <label>Visit Date</label>
          <input
            type="date"
            value={visitDate}
            min={today}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Ticket Type</label>
          <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
            <option>Adult 19+</option>
            <option>Senior 65+</option>
            <option>Youth 13-18</option>
            <option>Child 12 & Under</option>
          </select>
        </div>

        <div>
          <label>Discount</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <option>None</option>
            <option>Student</option>
            <option>Military</option>
            <option>Member</option>
          </select>
          {/* Warn immediately if they pick Member and aren't one */}
          {discountType === "Member" && !isMember && (
            <p className="error-message" style={{ marginTop: "4px" }}>
              ⚠️ You are not a museum member. This discount will be blocked at checkout.
            </p>
          )}
          {discountType === "Member" && isMember && (
            <p className="success-message" style={{ marginTop: "4px" }}>
              ✅ Member discount applied!
            </p>
          )}
        </div>

        <div>
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Credit Card</option>
            <option>Debit Card</option>
            <option>Cash</option>
          </select>
        </div>

        <div style={{ marginTop: "var(--spacing-md)" }}>
          <strong>Base price: ${getBasePrice(ticketType).toFixed(2)}</strong><br />
          <strong>Price per ticket: ${calculateFinalPrice(ticketType, discountType).toFixed(2)}</strong><br />
          <strong>Total: ${(calculateFinalPrice(ticketType, discountType) * quantity).toFixed(2)}</strong>
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