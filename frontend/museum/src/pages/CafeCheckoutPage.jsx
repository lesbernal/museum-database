import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createCafeTransaction,
  createCafeTransactionItem,
  getCafeTransactionItems,
  getCafeTransactions,
  getUserById,
} from "../services/api";
import { clearCafeCart, readCafeCart } from "../utils/cafeCart";
import "../styles/CafePage.css";

function nowSqlDateTime() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function getPickupEstimate(cart) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems <= 2) return "10 to 15 minutes";
  if (totalItems <= 4) return "15 to 20 minutes";
  return "20 to 30 minutes";
}

function CafeOrderCompleteModal({ estimate, onContinue }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content cafe-order-modal">
        <div className="modal-header">
          <h2>Order Complete</h2>
        </div>
        <div className="shop-auth-body">
          <p>Your cafe order has been sent successfully.</p>
          <p className="cafe-order-estimate"><strong>Estimated pickup time:</strong> {estimate}</p>
          <div className="shop-auth-actions">
            <button type="button" className="btn btn-primary" onClick={onContinue}>
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CafeCheckoutPage() {
  const navigate = useNavigate();
  const [cart] = useState(readCafeCart());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    pickup_name: "",
    pickup_notes: "",
    card_name: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
  });

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const pickupEstimate = useMemo(() => getPickupEstimate(cart), [cart]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/cafe");
      return;
    }

    async function loadUser() {
      try {
        const user = await getUserById(userId);
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        setForm((prev) => ({
          ...prev,
          full_name: fullName,
          email: user.email || "",
          phone: user.phone_number || "",
          pickup_name: fullName,
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (cart.length === 0) {
      setCheckoutMessage("Your cafe cart is empty.");
      return;
    }

    setSubmitting(true);
    setCheckoutMessage("");

    try {
      const [transactions, transactionItems] = await Promise.all([
        getCafeTransactions(),
        getCafeTransactionItems(),
      ]);

      const nextTransactionId =
        transactions.reduce((max, row) => Math.max(max, Number(row.cafe_transaction_id)), 0) + 1;
      const nextTransactionItemId =
        transactionItems.reduce((max, row) => Math.max(max, Number(row.transaction_item_id)), 0) + 1;

      await createCafeTransaction({
        cafe_transaction_id: nextTransactionId,
        user_id: Number(localStorage.getItem("user_id")),
        transaction_datetime: nowSqlDateTime(),
        total_amount: Number(total.toFixed(2)),
        payment_method: "Card",
      });

      for (const [index, item] of cart.entries()) {
        await createCafeTransactionItem({
          transaction_item_id: nextTransactionItemId + index,
          transaction_id: nextTransactionId,
          item_id: item.item_id,
          quantity: item.quantity,
          subtotal: Number((item.quantity * item.price).toFixed(2)),
        });
      }

      clearCafeCart();
      setCheckoutMessage("");
      setShowSuccessModal(true);
    } catch (err) {
      setCheckoutMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cafe-page">
      <section className="cafe-subpage-header">
        <div>
          <p className="cafe-kicker">Museum Cafe</p>
          <h1>Pickup Checkout</h1>
          <p>Confirm your order and we&apos;ll estimate when it will be ready.</p>
        </div>
        <Link to="/cafe/cart" className="btn btn-outline">Back to Cart</Link>
      </section>

      {loading ? (
        <div className="cafe-message">Loading checkout details...</div>
      ) : error ? (
        <div className="cafe-message cafe-message-error">{error}</div>
      ) : (
        <div className="cafe-checkout-layout">
          <form className="cafe-summary-card cafe-checkout-card" onSubmit={handleSubmit} autoComplete="off">
            <h2>Contact</h2>
            <input value={form.full_name} placeholder="Full name" readOnly />
            <input value={form.email} placeholder="Email" readOnly />
            <input value={form.phone} placeholder="Phone" readOnly />

            <h2>Pickup</h2>
            <input
              value={form.pickup_name}
              onChange={(e) => setForm({ ...form, pickup_name: e.target.value })}
              placeholder="Pickup name"
              required
            />
            <textarea
              value={form.pickup_notes}
              onChange={(e) => setForm({ ...form, pickup_notes: e.target.value })}
              placeholder="Pickup notes (optional)"
              rows={3}
            />
            <div className="cafe-estimate-box">
              <strong>Estimated Ready Time:</strong> {pickupEstimate}
            </div>

            <h2>Payment</h2>
            <input
              value={form.card_name}
              onChange={(e) => setForm({ ...form, card_name: e.target.value })}
              placeholder="Name on card"
              autoComplete="off"
              required
            />
            <input
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              placeholder="Card number"
              autoComplete="off"
              inputMode="numeric"
              required
            />
            <div className="cafe-checkout-row">
              <input
                value={form.card_expiry}
                onChange={(e) => setForm({ ...form, card_expiry: e.target.value })}
                placeholder="MM/YY"
                autoComplete="off"
                required
              />
              <input
                value={form.card_cvv}
                onChange={(e) => setForm({ ...form, card_cvv: e.target.value })}
                placeholder="CVV"
                autoComplete="off"
                inputMode="numeric"
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Sending Order..." : "Place Pickup Order"}
            </button>

            {checkoutMessage && <div className="cafe-message">{checkoutMessage}</div>}
          </form>

          <aside className="cafe-summary-card">
            <h2>Order Summary</h2>
            <div className="cafe-summary-lines">
              {cart.map((item) => (
                <div className="summary-line" key={item.item_id}>
                  <span>{item.item_name} x {item.quantity}</span>
                  <span>${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="cafe-total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      )}

      {showSuccessModal && (
        <CafeOrderCompleteModal
          estimate={pickupEstimate}
          onContinue={() => {
            setShowSuccessModal(false);
            navigate("/cafe");
          }}
        />
      )}
    </div>
  );
}
