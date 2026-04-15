import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createCafeTransaction,
  createCafeTransactionItem,
  createGiftShopTransaction,
  createGiftShopTransactionItem,
  getCafeTransactionItems,
  getCafeTransactions,
  getGiftShopTransactionItems,
  getGiftShopTransactions,
  getMyProfile,
  postDonation,
  postTicket,
} from "../services/api";
import { clearCafeCart } from "../utils/cafeCart";
import { clearGiftShopCart } from "../utils/giftShopCart";
import "../styles/CheckoutPage.css";

function nowSqlDateTime() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [shopDetails, setShopDetails] = useState({
    full_name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    pickup_name: "",
    pickup_notes: "",
    fulfillment_type: "pickup",
  });

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!order) {
      navigate(-1);
      return;
    }

    if (order.type !== "cafe" && order.type !== "giftshop") {
      return;
    }

    if (!userId) {
      navigate(-1);
      return;
    }

    let active = true;
    setProfileLoading(true);

    getMyProfile()
      .then((user) => {
        if (!active) return;
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        setShopDetails((prev) => ({
          ...prev,
          full_name: fullName,
          email: user.email || "",
          phone: user.phone_number || "",
          street_address: user.street_address || "",
          city: user.city || "",
          state: user.state || "",
          zip_code: user.zip_code || "",
          pickup_name: prev.pickup_name || fullName,
        }));
      })
      .catch((error) => {
        if (!active) return;
        setErrors({ submit: error.message || "Failed to load checkout details." });
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, order, userId]);

  function handleCardNumber(e) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  }

  function handleExpiry(e) {
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 3) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    setExpiry(value);
  }

  function updateShopDetails(key, value) {
    setShopDetails((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const nextErrors = {};
    const rawCard = cardNumber.replace(/\s/g, "");

    if (!cardName.trim()) nextErrors.cardName = "Name on card is required.";
    if (rawCard.length !== 16) nextErrors.cardNumber = "Card number must be 16 digits.";

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      nextErrors.expiry = "Enter a valid expiry date (MM/YY).";
    } else {
      const [mm, yy] = expiry.split("/").map(Number);
      const now = new Date();
      const exp = new Date(2000 + yy, mm - 1, 1);
      if (mm < 1 || mm > 12) {
        nextErrors.expiry = "Month must be between 01 and 12.";
      } else if (exp <= now) {
        nextErrors.expiry = "Card has expired.";
      }
    }

    if (cvv.length !== 3) nextErrors.cvv = "CVV must be 3 digits.";

    if (order?.type === "cafe") {
      if (!shopDetails.pickup_name.trim()) {
        nextErrors.pickup_name = "Pickup name is required.";
      }
      if (!order.items?.length) {
        nextErrors.submit = "Your cafe cart is empty.";
      }
    }

    if (order?.type === "giftshop") {
      if (!order.items?.length) {
        nextErrors.submit = "Your gift shop cart is empty.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitTickets() {
    for (const ticket of order.tickets) {
      for (let i = 0; i < ticket.quantity; i += 1) {
        await postTicket({
          user_id: Number(userId),
          purchase_date: new Date().toISOString().split("T")[0],
          visit_date: order.visitDate,
          ticket_type: ticket.type,
          base_price: ticket.basePrice,
          discount_type: order.discount,
          final_price: ticket.finalPrice,
          payment_method: "Credit Card",
        });
      }
    }
  }

  async function submitDonation() {
    await postDonation({
      donation_date: new Date().toISOString().split("T")[0],
      amount: order.amount,
      donation_type: order.donationType,
      payment_method: "Credit Card",
    });
  }

  async function submitCafeOrder() {
    const [transactions, transactionItems] = await Promise.all([
      getCafeTransactions(),
      getCafeTransactionItems(),
    ]);

    const nextTransactionId =
      transactions.reduce((max, row) => Math.max(max, Number(row.cafe_transaction_id)), 0) + 1;
    const nextItemId =
      transactionItems.reduce((max, row) => Math.max(max, Number(row.transaction_item_id)), 0) + 1;

    await createCafeTransaction({
      cafe_transaction_id: nextTransactionId,
      user_id: Number(userId),
      transaction_datetime: nowSqlDateTime(),
      total_amount: Number(order.total.toFixed(2)),
      payment_method: "Card",
    });

    for (const [index, item] of order.items.entries()) {
      await createCafeTransactionItem({
        transaction_item_id: nextItemId + index,
        transaction_id: nextTransactionId,
        item_id: item.item_id,
        quantity: item.quantity,
        subtotal: Number((item.quantity * item.price).toFixed(2)),
      });
    }

    clearCafeCart();
  }

  async function submitGiftShopOrder() {
    const [transactions, transactionItems] = await Promise.all([
      getGiftShopTransactions(),
      getGiftShopTransactionItems(),
    ]);

    const nextTransactionId =
      transactions.reduce((max, row) => Math.max(max, Number(row.transaction_id)), 0) + 1;
    const nextItemId =
      transactionItems.reduce((max, row) => Math.max(max, Number(row.shop_item_id)), 0) + 1;

    await createGiftShopTransaction({
      transaction_id: nextTransactionId,
      user_id: Number(userId),
      transaction_datetime: nowSqlDateTime(),
      total_amount: Number(order.total.toFixed(2)),
      payment_method: "Card",
    });

    for (const [index, item] of order.items.entries()) {
      await createGiftShopTransactionItem({
        shop_item_id: nextItemId + index,
        transaction_id: nextTransactionId,
        item_id: item.item_id,
        quantity: item.quantity,
        subtotal: Number((item.quantity * item.price).toFixed(2)),
      });
    }

    clearGiftShopCart();
  }

  function buildSuccessToast() {
    if (order.type === "tickets") {
      return `Successfully purchased ${order.totalTickets} ticket(s)!`;
    }

    if (order.type === "donation") {
      return `Thank you for your ${formatCurrency(order.amount)} donation!`;
    }

    if (order.type === "cafe") {
      return `Your cafe order is in. Estimated pickup time: ${order.pickupEstimate}.`;
    }

    if (shopDetails.fulfillment_type === "pickup") {
      return "Your gift shop order is confirmed for in-store pickup.";
    }

    return "Your gift shop order is confirmed and will ship to your saved address.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (order.type === "tickets") {
        await submitTickets();
      } else if (order.type === "donation") {
        await submitDonation();
      } else if (order.type === "cafe") {
        await submitCafeOrder();
      } else if (order.type === "giftshop") {
        await submitGiftShopOrder();
      } else {
        throw new Error("Unsupported checkout type.");
      }

      navigate("/", {
        state: {
          successToast: buildSuccessToast(),
        },
      });
    } catch (error) {
      setErrors({ submit: error.message || "Payment failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function renderSummary() {
    if (order.type === "tickets") {
      return (
        <>
          <div className="summary-section">
            <p className="summary-label">Visit Date</p>
            <p className="summary-value">{order.visitDate}</p>
          </div>
          <div className="summary-section">
            <p className="summary-label">Discount</p>
            <p className="summary-value">{order.discount}</p>
          </div>
          <div className="summary-items">
            {order.tickets.map((ticket) => (
              <div className="summary-item" key={ticket.type}>
                <span>{ticket.quantity}x {ticket.label}</span>
                <span>{formatCurrency(ticket.finalPrice * ticket.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </>
      );
    }

    if (order.type === "donation") {
      return (
        <>
          <div className="summary-section">
            <p className="summary-label">Donation Type</p>
            <p className="summary-value">{order.donationType}</p>
          </div>
          <div className="summary-total">
            <span>Donation Amount</span>
            <span>{formatCurrency(order.amount)}</span>
          </div>
        </>
      );
    }

    return (
      <>
        {order.type === "cafe" && (
          <div className="summary-section">
            <p className="summary-label">Estimated Pickup</p>
            <p className="summary-value">{order.pickupEstimate}</p>
          </div>
        )}

        {order.type === "giftshop" && (
          <>
            <div className="summary-section">
              <p className="summary-label">Fulfillment</p>
              <p className="summary-value">
                {shopDetails.fulfillment_type === "pickup" ? "Pick Up In Store" : "Ship to Address"}
              </p>
            </div>

            <div className="summary-section">
              <p className="summary-label">
                {shopDetails.fulfillment_type === "pickup" ? "Pickup Policy" : "Shipping"}
              </p>
              <p className="summary-value">
                {shopDetails.fulfillment_type === "pickup"
                  ? "Pickup orders are typically ready the same day during museum hours. Unclaimed orders may be canceled after 30 days."
                  : "Your saved address will be used for shipping."}
              </p>
            </div>
          </>
        )}

        <div className="summary-items">
          {order.items.map((item) => (
            <div className="summary-item" key={item.item_id}>
              <span>{item.quantity}x {item.item_name}</span>
              <span>{formatCurrency(item.quantity * item.price)}</span>
            </div>
          ))}
        </div>
        <div className="summary-total">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </>
    );
  }

  function renderShopFields() {
    if (order.type !== "cafe" && order.type !== "giftshop") return null;

    return (
      <>
        <div className="checkout-field">
          <label>Full Name</label>
          <input type="text" value={shopDetails.full_name} readOnly />
        </div>

        <div className="checkout-field">
          <label>Email</label>
          <input type="email" value={shopDetails.email} readOnly />
        </div>

        <div className="checkout-field">
          <label>Phone</label>
          <input type="text" value={shopDetails.phone} readOnly />
        </div>

        {order.type === "cafe" ? (
          <>
            <div className="checkout-field">
              <label>Pickup Name</label>
              <input
                type="text"
                value={shopDetails.pickup_name}
                onChange={(e) => updateShopDetails("pickup_name", e.target.value)}
                placeholder="Pickup name"
              />
              {errors.pickup_name && <p className="checkout-error">{errors.pickup_name}</p>}
            </div>

            <div className="checkout-field">
              <label>Pickup Notes</label>
              <input
                type="text"
                value={shopDetails.pickup_notes}
                onChange={(e) => updateShopDetails("pickup_notes", e.target.value)}
                placeholder="Optional notes for the cafe team"
              />
            </div>
          </>
        ) : (
          <>
            <div className="checkout-field">
              <label>Street Address</label>
              <input type="text" value={shopDetails.street_address || "No saved street address"} readOnly />
            </div>

            <div className="checkout-field-row">
              <div className="checkout-field">
                <label>City</label>
                <input type="text" value={shopDetails.city || "No saved city"} readOnly />
              </div>
              <div className="checkout-field">
                <label>State</label>
                <input type="text" value={shopDetails.state || "No saved state"} readOnly />
              </div>
              <div className="checkout-field">
                <label>ZIP</label>
                <input type="text" value={shopDetails.zip_code || "No saved ZIP"} readOnly />
              </div>
            </div>

            <div className="checkout-field">
              <label>Fulfillment</label>
              <select
                value={shopDetails.fulfillment_type}
                onChange={(e) => updateShopDetails("fulfillment_type", e.target.value)}
              >
                <option value="pickup">Pick Up In Store</option>
                <option value="shipping">Ship to Address</option>
              </select>
            </div>

            {shopDetails.fulfillment_type === "pickup" ? (
              <div className="summary-section">
                <p className="summary-label">Pickup Policy</p>
                <p className="summary-value">
                  Pickup orders are typically ready the same day during museum hours.
                  Unclaimed orders may be canceled after 30 days.
                </p>
              </div>
            ) : (
              <div className="summary-section">
                <p className="summary-label">Shipping</p>
                <p className="summary-value">Your saved address will be used for shipping.</p>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  function getSummaryTitle() {
    if (order.type === "donation") return "Donation Summary";
    return "Order Summary";
  }

  function getHeading() {
    if (order.type === "tickets") return "Ticket Checkout";
    if (order.type === "donation") return "Donation Checkout";
    if (order.type === "cafe") return "Cafe Checkout";
    return "Gift Shop Checkout";
  }

  function getSubtitle() {
    if (order.type === "cafe") return "Confirm your pickup details before we send the order to the cafe.";
    if (order.type === "giftshop") return "Review your saved details and choose pickup or shipping.";
    return "All transactions are secure and encrypted";
  }

  function getSubmitLabel() {
    if (loading) return "Processing...";
    if (order.type === "donation") return `Donate ${formatCurrency(order.amount)}`;
    if (order.type === "cafe") return `Place Order ${formatCurrency(order.total)}`;
    if (order.type === "giftshop") return `Place Order ${formatCurrency(order.total)}`;
    return `Pay ${formatCurrency(order.total)}`;
  }

  if (!order) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-summary">
          <p className="checkout-eyebrow">Museum of Fine Arts, Houston</p>
          <h2 className="checkout-summary-title">{getSummaryTitle()}</h2>
          {renderSummary()}
        </div>

        <div className="checkout-form-section">
          <h2 className="checkout-form-title">{getHeading()}</h2>
          <p className="checkout-form-subtitle">{getSubtitle()}</p>

          <form onSubmit={handleSubmit} className="checkout-form">
            {profileLoading ? <p className="checkout-form-subtitle">Loading your account details...</p> : renderShopFields()}

            <div className="checkout-field">
              <label>Name on Card</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
              {errors.cardName && <p className="checkout-error">{errors.cardName}</p>}
            </div>

            <div className="checkout-field">
              <label>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumber}
                inputMode="numeric"
                maxLength={19}
              />
              {errors.cardNumber && <p className="checkout-error">{errors.cardNumber}</p>}
            </div>

            <div className="checkout-field-row">
              <div className="checkout-field">
                <label>Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiry}
                  inputMode="numeric"
                  maxLength={5}
                />
                {errors.expiry && <p className="checkout-error">{errors.expiry}</p>}
              </div>

              <div className="checkout-field">
                <label>CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                  maxLength={3}
                />
                {errors.cvv && <p className="checkout-error">{errors.cvv}</p>}
              </div>
            </div>

            {errors.submit && <div className="checkout-submit-error">{errors.submit}</div>}

            <button type="submit" className="checkout-submit-btn" disabled={loading || profileLoading}>
              {getSubmitLabel()}
            </button>

            <button
              type="button"
              className="checkout-back-btn"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
