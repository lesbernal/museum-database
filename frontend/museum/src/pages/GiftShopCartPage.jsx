import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readGiftShopCart, writeGiftShopCart } from "../utils/giftShopCart";
import "../styles/GiftShopPage.css";

export default function GiftShopCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readGiftShopCart());

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function syncCart(nextCart) {
    setCart(nextCart);
    writeGiftShopCart(nextCart);
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
      navigate("/gift-shop");
      return;
    }

    navigate("/checkout", {
      state: {
        type: "giftshop",
        items: cart,
        total,
      },
    });
  }

  return (
    <div className="giftshop-page">
      <section className="giftshop-subpage-header">
        <div>
          <p className="giftshop-kicker">The MFA Shop</p>
          <h1>Pickup Cart</h1>
          <p>Review your selected items before heading to checkout.</p>
        </div>
        <Link to="/gift-shop" className="btn btn-outline">Continue Shopping</Link>
      </section>

      {cart.length === 0 ? (
        <div className="giftshop-message">Your cart is empty.</div>
      ) : (
        <div className="cart-page-layout">
          <section className="cart-page-items">
            {cart.map((item) => (
              <article className="cart-page-card" key={item.item_id}>
                <div>
                  <p className="giftshop-category">{item.category}</p>
                  <h2>{item.item_name}</h2>
                  <p className="giftshop-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="cart-controls">
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

          <aside className="giftshop-cart">
            <h2>Order Summary</h2>
            <div className="cart-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <button className="btn btn-primary" type="button" onClick={handleCheckout}>
              Go to Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
