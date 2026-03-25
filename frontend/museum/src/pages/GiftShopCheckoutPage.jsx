import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createGiftShopTransaction,
  createGiftShopTransactionItem,
  getGiftShopItems,
  getGiftShopTransactions,
  getGiftShopTransactionItems,
  getUserById,
} from "../services/api";
import { clearGiftShopCart, readGiftShopCart } from "../utils/giftShopCart";
import "../styles/GiftShopPage.css";

function nowSqlDateTime() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function OrderCompleteModal({ onContinue }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content shop-order-modal">
        <div className="modal-header">
          <h2>Order Complete</h2>
        </div>
        <div className="shop-auth-body">
          <p>Your museum shop order has been placed successfully.</p>
          <div className="shop-auth-actions">
            <button type="button" className="btn btn-primary" onClick={onContinue}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftShopCheckoutPage() {
  const navigate = useNavigate();
  const [cart] = useState(readGiftShopCart());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    card_name: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    pickup_day: "",
    fulfillment_type: "pickup",
  });

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/gift-shop");
      return;
    }

    async function loadUser() {
      try {
        const user = await getUserById(userId);
        setUserInfo(user);
        setForm((prev) => ({
          ...prev,
          full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email || "",
          phone: user.phone_number || "",
          street_address: user.street_address || "",
          city: user.city || "",
          state: user.state || "",
          zip_code: user.zip_code || "",
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
      setCheckoutMessage("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setCheckoutMessage("");

    try {
      const [transactions, transactionItems] = await Promise.all([
        getGiftShopTransactions(),
        getGiftShopTransactionItems(),
      ]);

      const nextTransactionId =
        transactions.reduce((max, row) => Math.max(max, Number(row.transaction_id)), 0) + 1;
      const nextShopItemId =
        transactionItems.reduce((max, row) => Math.max(max, Number(row.shop_item_id)), 0) + 1;

      await createGiftShopTransaction({
        transaction_id: nextTransactionId,
        user_id: Number(localStorage.getItem("user_id")),
        transaction_datetime: nowSqlDateTime(),
        total_amount: Number(total.toFixed(2)),
        payment_method: "Card",
      });

      for (const [index, item] of cart.entries()) {
        await createGiftShopTransactionItem({
          shop_item_id: nextShopItemId + index,
          transaction_id: nextTransactionId,
          item_id: item.item_id,
          quantity: item.quantity,
          subtotal: Number((item.quantity * item.price).toFixed(2)),
        });
      }

      await getGiftShopItems();
      clearGiftShopCart();
      setCheckoutMessage("");
      setShowSuccessModal(true);
    } catch (err) {
      setCheckoutMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="giftshop-page">
      <section className="giftshop-subpage-header">
        <div>
          <p className="giftshop-kicker">The MFA Shop</p>
          <h1>Checkout</h1>
          <p>Review your account details and complete your pickup order.</p>
        </div>
        <Link to="/gift-shop/cart" className="btn btn-outline">Back to Cart</Link>
      </section>

      {loading ? (
        <div className="loading-spinner">Loading checkout details...</div>
      ) : error ? (
        <div className="giftshop-message error">{error}</div>
      ) : (
        <div className="checkout-layout">
          <form className="giftshop-cart checkout-card" onSubmit={handleSubmit} autoComplete="off">
            <h2>Contact & Pickup</h2>
            <input value={form.full_name} placeholder="Full name" readOnly />
            <input value={form.email} placeholder="Email" readOnly />
            <input value={form.phone} placeholder="Phone" readOnly />
            <input value={form.street_address} placeholder="Street address" readOnly />
            <div className="checkout-row">
              <input value={form.city} placeholder="City" readOnly />
              <input value={form.state} placeholder="State" readOnly />
              <input value={form.zip_code} placeholder="ZIP" readOnly />
            </div>
            <div className="checkout-row checkout-row-two">
              <select
                value={form.fulfillment_type}
                onChange={(e) => setForm({ ...form, fulfillment_type: e.target.value })}
                required
              >
                <option value="pickup">Pick Up In Store</option>
                <option value="shipping">Ship to Address</option>
              </select>
              {form.fulfillment_type === "pickup" ? (
                <input
                  type="text"
                  value={form.pickup_day}
                  onChange={(e) => setForm({ ...form, pickup_day: e.target.value })}
                  placeholder="MM/DD/YYYY"
                  required
                />
              ) : (
                <div className="checkout-fulfillment-note">
                  Orders marked for shipping will use the address on your account.
                </div>
              )}
            </div>

            <h2>Payment</h2>
            <input
              value={form.card_name}
              onChange={(e) => setForm({ ...form, card_name: e.target.value })}
              placeholder="Name on card"
              autoComplete="off"
              name="giftshop_card_name"
              required
            />
            <input
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              placeholder="Card number"
              autoComplete="off"
              inputMode="numeric"
              name="giftshop_card_number"
              required
            />
            <div className="checkout-row checkout-row-two">
              <input
                value={form.card_expiry}
                onChange={(e) => setForm({ ...form, card_expiry: e.target.value })}
                placeholder="MM/YY"
                autoComplete="off"
                name="giftshop_card_expiry"
                required
              />
              <input
                value={form.card_cvv}
                onChange={(e) => setForm({ ...form, card_cvv: e.target.value })}
                placeholder="CVV"
                autoComplete="off"
                inputMode="numeric"
                name="giftshop_card_cvv"
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Processing..." : "Place Order"}
            </button>

            {checkoutMessage && <div className="giftshop-message">{checkoutMessage}</div>}
          </form>

          <aside className="giftshop-cart">
            <h2>Order Summary</h2>
            {userInfo && (
              <div className="checkout-summary-block">
                <p><strong>User:</strong> {userInfo.first_name} {userInfo.last_name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
              </div>
            )}
            <div className="checkout-summary-block">
              {cart.map((item) => (
                <div className="summary-line" key={item.item_id}>
                  <span>{item.item_name} x {item.quantity}</span>
                  <span>${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      )}

      {showSuccessModal && (
        <OrderCompleteModal
          onContinue={() => {
            setShowSuccessModal(false);
            navigate("/gift-shop");
          }}
        />
      )}
    </div>
  );
}
