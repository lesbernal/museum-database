// src/pages/PendingOrderPage.jsx
// Shown after a large order (>20 tickets or >$150 cafe/giftshop) is submitted
// for employee approval. No further action needed from the user.

import { useLocation, Link } from "react-router-dom";

export default function PendingOrderPage() {
  const { state } = useLocation();
  const orderType  = state?.orderType  || "order";
  const itemCount  = state?.itemCount  || null;
  const total      = state?.total      || null;

  const typeLabel = {
    tickets:  "Ticket Purchase",
    cafe:     "Cafe Order",
    giftshop: "Gift Shop Order",
  }[orderType] || "Order";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-cream)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        maxWidth: 560,
        width: "100%",
        background: "#fff",
        border: "1px solid var(--color-border)",
        padding: "3rem",
        textAlign: "center",
      }}>
        {/* Status icon */}
        <div style={{
          width: 64, height: 64,
          borderRadius: "50%",
          background: "#fef9e7",
          border: "2px solid var(--color-gold)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          fontSize: "1.75rem",
        }}>
          ⏳
        </div>

        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold)", margin: "0 0 0.5rem" }}>
          {typeLabel}
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.02em", margin: "0 0 1rem", color: "var(--color-black)" }}>
          Order Pending Approval
        </h1>

        <p style={{ fontSize: "0.95rem", color: "var(--color-gray)", lineHeight: 1.7, margin: "0 0 1.5rem" }}>
          Your {typeLabel.toLowerCase()} has been received and is awaiting confirmation
          by our team. No further action is needed on your part.
        </p>

        {(itemCount || total) && (
          <div style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            textAlign: "left",
          }}>
            {itemCount && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--color-gray)" }}>Items</span>
                <span style={{ fontWeight: 500 }}>{itemCount}</span>
              </div>
            )}
            {total != null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--color-gray)" }}>Order Total</span>
                <span style={{ fontWeight: 500 }}>${Number(total).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div style={{
          background: "#fffbeb",
          border: "1px solid var(--color-gold)",
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
          textAlign: "left",
        }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6 }}>
            <strong>Expected processing time:</strong> 2–10 minutes during regular museum hours
            (Tuesday–Sunday, 10 AM – 5 PM CT). You can track your order status in your dashboard
            under <strong>Purchases</strong> or <strong>Orders</strong>.
          </p>
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--color-gray-light)", marginBottom: "2rem", lineHeight: 1.6 }}>
          If you need immediate assistance, please email{" "}
          <a href="mailto:info@mfah.org" style={{ color: "var(--color-gold)" }}>info@mfah.org</a>.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" style={{
            padding: "0.75rem 1.5rem",
            background: "var(--color-gold)",
            color: "#000",
            textDecoration: "none",
            fontSize: "0.78rem",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Back to Home
          </Link>
          <Link to="/member-dashboard" style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            color: "var(--color-gray)",
            border: "1px solid var(--color-border)",
            textDecoration: "none",
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}