import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyMemberRecord } from "../services/api";
import { readGiftShopCart, writeGiftShopCart } from "../utils/giftShopCart";
import { calculateDiscountedAmount, formatMoney, getGiftShopDiscountPercent } from "../utils/shopDiscounts";
import "../styles/GiftShopPage.css";

export default function GiftShopCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readGiftShopCart());
  const [memberDiscountPercent, setMemberDiscountPercent] = useState(0);

  const baseTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const total = useMemo(
    () => calculateDiscountedAmount(baseTotal, memberDiscountPercent),
    [baseTotal, memberDiscountPercent]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function loadMemberDiscount() {
      try {
        const member = await getMyMemberRecord();
        setMemberDiscountPercent(getGiftShopDiscountPercent(member?.membership_level || ""));
      } catch {
        setMemberDiscountPercent(0);
      }
    }

    loadMemberDiscount();
  }, []);

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
        baseTotal,
        discountPercent: memberDiscountPercent,
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
                  {memberDiscountPercent > 0 ? (
                    <div className="giftshop-price-block">
                      <p className="giftshop-price giftshop-price-original">{formatMoney(item.price)}</p>
                      <p className="giftshop-price">{formatMoney(calculateDiscountedAmount(item.price, memberDiscountPercent))}</p>
                    </div>
                  ) : (
                    <p className="giftshop-price">{formatMoney(item.price)}</p>
                  )}
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
            {memberDiscountPercent > 0 && (
              <>
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>{formatMoney(baseTotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Member Discount ({memberDiscountPercent}%)</span>
                  <span>-{formatMoney(baseTotal - total)}</span>
                </div>
              </>
            )}
            <div className="cart-total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
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
