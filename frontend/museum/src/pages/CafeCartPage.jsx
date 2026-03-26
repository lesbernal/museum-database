import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readCafeCart, writeCafeCart } from "../utils/cafeCart";
import "../styles/CafePage.css";

function getPickupEstimate(cart) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems <= 2) return "10 to 15 minutes";
  if (totalItems <= 4) return "15 to 20 minutes";
  return "20 to 30 minutes";
}

export default function CafeCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCafeCart());

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const pickupEstimate = useMemo(() => getPickupEstimate(cart), [cart]);

  function syncCart(nextCart) {
    setCart(nextCart);
    writeCafeCart(nextCart);
  }

  function updateQuantity(itemId, nextQuantity) {
    const nextCart = cart.map((item) =>
      item.item_id === itemId
        ? {
            ...item,
            quantity: Math.max(1, Math.min(nextQuantity, item.stock_quantity)),
          }
        : item
    );
    syncCart(nextCart);
  }

  function removeItem(itemId) {
    syncCart(cart.filter((item) => item.item_id !== itemId));
  }

  function handleCheckout() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/cafe");
      return;
    }

    navigate("/cafe/checkout");
  }

  return (
    <div className="cafe-page">
      <section className="cafe-subpage-header">
        <div>
          <p className="cafe-kicker">Museum Cafe</p>
          <h1>Pickup Cart</h1>
          <p>Review your order before sending it to the cafe counter.</p>
        </div>
        <Link to="/cafe" className="btn btn-outline">Continue Browsing</Link>
      </section>

      {cart.length === 0 ? (
        <div className="cafe-message">Your cafe cart is empty.</div>
      ) : (
        <div className="cafe-cart-layout">
          <section className="cafe-cart-items">
            {cart.map((item) => (
              <article className="cafe-cart-card" key={item.item_id}>
                <div>
                  <p className="cafe-category">{item.category}</p>
                  <h2>{item.item_name}</h2>
                  <p className="cafe-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="cafe-cart-controls">
                  <button type="button" onClick={() => updateQuantity(item.item_id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.item_id, item.quantity + 1)}>+</button>
                  <button type="button" className="remove-link" onClick={() => removeItem(item.item_id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="cafe-summary-card">
            <h2>Pickup Summary</h2>
            <p><strong>Estimated Ready Time:</strong> {pickupEstimate}</p>
            <div className="cafe-total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <button className="btn btn-primary" type="button" onClick={handleCheckout}>
              Continue to Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
