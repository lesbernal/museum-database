// src/pages/CheckoutPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createCafeTransaction, createCafeTransactionItem,
  createGiftShopTransaction, createGiftShopTransactionItem,
  getCafeTransactionItems, getCafeTransactions,
  getGiftShopTransactionItems, getGiftShopTransactions,
  getMyProfile, postDonation, postTicket, createMembershipTransaction,
} from "../services/api";
import { clearCafeCart } from "../utils/cafeCart";
import { clearGiftShopCart } from "../utils/giftShopCart";
import { calculateDiscountedAmount } from "../utils/shopDiscounts";
import "../styles/CheckoutPage.css";

// Thresholds that route an order to pending approval instead of instant processing
const PENDING_TICKET_THRESHOLD   = 20;   // > 20 tickets → pending
const PENDING_SHOP_THRESHOLD     = 900;  // > $900 cafe or giftshop → pending

// Department IDs that handle each pending type
const DEPT_TICKETS  = 4; // Visitor Services
const DEPT_CAFE     = 6; // Cafe & Hospitality
const DEPT_GIFTSHOP = 5; // Retail

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function nowSqlDateTime() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
}
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatCurrency(amount) { return `$${Number(amount || 0).toFixed(2)}`; }
function getOrderBaseTotal(order) {
  if (!order?.items?.length) return 0;
  if (typeof order.baseTotal === "number") return order.baseTotal;
  return order.items.reduce((s, i) => s + Number(i.price||0)*Number(i.quantity||0), 0);
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const order     = location.state;

  const [cardName,       setCardName]       = useState("");
  const [cardNumber,     setCardNumber]     = useState("");
  const [expiry,         setExpiry]         = useState("");
  const [cvv,            setCvv]            = useState("");
  const [errors,         setErrors]         = useState({});
  const [loading,        setLoading]        = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [shopDetails, setShopDetails] = useState({
    full_name:"", email:"", phone:"", street_address:"",
    city:"", state:"", zip_code:"", pickup_name:"", pickup_notes:"", fulfillment_type:"pickup",
  });

  const userId = localStorage.getItem("user_id");
  const token  = localStorage.getItem("token");

  useEffect(() => {
    if (!order) { navigate(-1); return; }
    if (order.type === "membership") {
      if (!userId) { navigate("/login"); return; }
      setProfileLoading(true);
      getMyProfile().then(u => setShopDetails(p => ({ ...p, full_name:`${u.first_name||""} ${u.last_name||""}`.trim(), email:u.email||"" }))).catch(()=>{}).finally(()=>setProfileLoading(false));
      return;
    }
    if (order.type !== "cafe" && order.type !== "giftshop") return;
    if (!userId) { navigate(-1); return; }
    let active = true;
    setProfileLoading(true);
    getMyProfile().then(u => {
      if (!active) return;
      const fullName = `${u.first_name||""} ${u.last_name||""}`.trim();
      setShopDetails(p => ({ ...p, full_name:fullName, email:u.email||"", phone:u.phone_number||"", street_address:u.street_address||"", city:u.city||"", state:u.state||"", zip_code:u.zip_code||"", pickup_name:p.pickup_name||fullName }));
    }).catch(()=>{}).finally(()=>{ if(active) setProfileLoading(false); });
    return () => { active=false; };
  }, [navigate, order, userId]);

  function handleCardNumber(e) {
    const v = e.target.value.replace(/\D/g,"").slice(0,16);
    setCardNumber(v.match(/.{1,4}/g)?.join(" ")||v);
  }
  function handleExpiry(e) {
    let v = e.target.value.replace(/\D/g,"").slice(0,4);
    if (v.length>=3) v=`${v.slice(0,2)}/${v.slice(2)}`;
    setExpiry(v);
  }
  function updateShopDetails(k,v) { setShopDetails(p=>({...p,[k]:v})); }

  function validate() {
    const errs = {};
    const raw  = cardNumber.replace(/\s/g,"");
    if (!cardName.trim())   errs.cardName   = "Name on card is required.";
    if (raw.length !== 16)  errs.cardNumber = "Card number must be 16 digits.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      errs.expiry = "Enter a valid expiry date (MM/YY).";
    } else {
      const [mm,yy] = expiry.split("/").map(Number);
      if (mm<1||mm>12) errs.expiry="Month must be between 01 and 12.";
      else if (new Date(2000+yy,mm-1,1)<=new Date()) errs.expiry="Card has expired.";
    }
    if (cvv.length!==3) errs.cvv="CVV must be 3 digits.";
    if (order?.type==="cafe"    && !shopDetails.pickup_name.trim()) errs.pickup_name="Pickup name is required.";
    if (order?.type==="cafe"    && !order.items?.length) errs.submit="Your cafe cart is empty.";
    if (order?.type==="giftshop"&& !order.items?.length) errs.submit="Your gift shop cart is empty.";
    setErrors(errs);
    return Object.keys(errs).length===0;
  }

  // ── Pending order helper ────────────────────────────────────────────────────
  async function submitPendingOrder({ order_type, department_id, order_data, total_amount, item_count }) {
    const res = await fetch(`${BASE_URL}/pending-orders`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ user_id:Number(userId), order_type, department_id, order_data, total_amount, item_count }),
    });
    if (!res.ok) { const d=await res.json(); throw new Error(d.error||"Failed to submit order"); }
    return res.json();
  }

  // ── Ticket submit ──────────────────────────────────────────────────────────
  async function submitTickets() {
    const purchase_date  = localDate();
    const transaction_id = Date.now();
    const totalTickets   = order.tickets.reduce((s,t)=>s+t.quantity,0);

    // Over threshold → pending
    if (totalTickets > PENDING_TICKET_THRESHOLD) {
      await submitPendingOrder({
        order_type:    "tickets",
        department_id: DEPT_TICKETS,
        order_data:    { user_id:Number(userId), visitDate:order.visitDate, purchase_date, tickets:order.tickets, transaction_id },
        total_amount:  order.total,
        item_count:    totalTickets,
      });
      return "pending";
    }

    // Normal path
    for (const ticket of order.tickets) {
      for (let i=0; i<ticket.quantity; i++) {
        let discountType="None";
        if (!order.isThursday && (order.discount==="Member"||ticket.discount_type==="Member"||(typeof order.discount==="string"&&order.discount.toLowerCase().includes("member")))) discountType="Member";
        await postTicket({ user_id:Number(userId), purchase_date, visit_date:order.visitDate, ticket_type:ticket.type, base_price:ticket.basePrice, discount_type:discountType, final_price:ticket.finalPrice, payment_method:"Credit Card", transaction_id });
      }
    }
    return "done";
  }

  // ── Donation submit ────────────────────────────────────────────────────────
  async function submitDonation() {
    await postDonation({ donation_date:localDate(), amount:order.amount, donation_type:order.donationType, payment_method:"Credit Card" });
    return "done";
  }

  // ── Membership submit ──────────────────────────────────────────────────────
  async function submitMembership() {
    await createMembershipTransaction({ user_id:Number(userId), membership_level:order.membership_level, amount:order.amount, payment_method:"Credit Card", transaction_type:order.transaction_type||"New", transaction_date:localDate() });
    localStorage.setItem("role","member");
    return "done";
  }

  // ── Cafe submit ────────────────────────────────────────────────────────────
  async function submitCafeOrder() {
    const total = Number(order.total.toFixed(2));
    if (total > PENDING_SHOP_THRESHOLD) {
      await submitPendingOrder({
        order_type:    "cafe",
        department_id: DEPT_CAFE,
        order_data:    { user_id:Number(userId), transaction_datetime:nowSqlDateTime(), total_amount:total, items:order.items, cafe_transaction_id:Date.now(), payment_method:"Card" },
        total_amount:  total,
        item_count:    order.items.reduce((s,i)=>s+i.quantity,0),
      });
      return "pending";
    }
    const [transactions, transactionItems] = await Promise.all([getCafeTransactions(), getCafeTransactionItems()]);
    const nextTxId   = transactions.reduce((m,r)=>Math.max(m,Number(r.cafe_transaction_id)),0)+1;
    const nextItemId = transactionItems.reduce((m,r)=>Math.max(m,Number(r.transaction_item_id)),0)+1;
    await createCafeTransaction({ cafe_transaction_id:nextTxId, user_id:Number(userId), transaction_datetime:nowSqlDateTime(), total_amount:total, payment_method:"Card" });
    for (const [idx,item] of order.items.entries()) {
      await createCafeTransactionItem({ transaction_item_id:nextItemId+idx, transaction_id:nextTxId, item_id:item.item_id, quantity:item.quantity, subtotal:Number((item.quantity*item.price).toFixed(2)) });
    }
    clearCafeCart();
    return "done";
  }

  // ── Gift shop submit ───────────────────────────────────────────────────────
  async function submitGiftShopOrder() {
    const total = Number(order.total.toFixed(2));
    if (total > PENDING_SHOP_THRESHOLD) {
      const shippingAddress = shopDetails.fulfillment_type==="shipping" ? `${shopDetails.street_address}, ${shopDetails.city}, ${shopDetails.state} ${shopDetails.zip_code}` : null;
      await submitPendingOrder({
        order_type:    "giftshop",
        department_id: DEPT_GIFTSHOP,
        order_data:    { user_id:Number(userId), transaction_datetime:nowSqlDateTime(), total_amount:total, items:order.items, transaction_id:Date.now(), payment_method:"Card", fulfillment_type:shopDetails.fulfillment_type, shipping_address:shippingAddress },
        total_amount:  total,
        item_count:    order.items.reduce((s,i)=>s+i.quantity,0),
      });
      return "pending";
    }
    const [transactions, transactionItems] = await Promise.all([getGiftShopTransactions(), getGiftShopTransactionItems()]);
    const nextTxId   = transactions.reduce((m,r)=>Math.max(m,Number(r.transaction_id)),0)+1;
    const nextItemId = transactionItems.reduce((m,r)=>Math.max(m,Number(r.shop_item_id)),0)+1;
    const shippingAddress = shopDetails.fulfillment_type==="shipping" ? `${shopDetails.street_address}, ${shopDetails.city}, ${shopDetails.state} ${shopDetails.zip_code}` : null;
    await createGiftShopTransaction({ transaction_id:nextTxId, user_id:Number(userId), transaction_datetime:nowSqlDateTime(), total_amount:total, payment_method:"Card", fulfillment_type:shopDetails.fulfillment_type, shipping_address:shippingAddress });
    for (const [idx,item] of order.items.entries()) {
      await createGiftShopTransactionItem({ shop_item_id:nextItemId+idx, transaction_id:nextTxId, item_id:item.item_id, quantity:item.quantity, subtotal:Number((item.quantity*item.price).toFixed(2)) });
    }
    clearGiftShopCart();
    return "done";
  }

  function buildSuccessToast() {
    if (order.type==="membership") return `Welcome, ${order.membership_level} Member! Your membership is now active.`;
    if (order.type==="tickets")    return `Successfully purchased ${order.totalTickets} ticket(s)!`;
    if (order.type==="donation")   return `Thank you for your ${formatCurrency(order.amount)} donation!`;
    if (order.type==="cafe")       return `Your cafe order is in. Estimated pickup: ${order.pickupEstimate}.`;
    if (shopDetails.fulfillment_type==="pickup") return "Your gift shop order is confirmed for in-store pickup.";
    return "Your gift shop order is confirmed and will ship to your saved address.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setErrors({});
    try {
      let result = "done";
      if      (order.type==="membership") result = await submitMembership();
      else if (order.type==="tickets")    result = await submitTickets();
      else if (order.type==="donation")   result = await submitDonation();
      else if (order.type==="cafe")       result = await submitCafeOrder();
      else if (order.type==="giftshop")   result = await submitGiftShopOrder();
      else throw new Error("Unsupported checkout type.");

      if (result === "pending") {
        // Large order — redirect to pending confirmation page
        const totalTickets = order.tickets ? order.tickets.reduce((s,t)=>s+t.quantity,0) : null;
        const itemCount    = totalTickets ?? order.items?.reduce((s,i)=>s+i.quantity,0) ?? null;
        navigate("/order-pending", { state: { orderType:order.type, itemCount, total:order.total } });
      } else if (order.type==="membership") {
        navigate("/member-dashboard", { state:{ successToast:buildSuccessToast() } });
      } else {
        navigate("/", { state:{ successToast:buildSuccessToast() } });
      }
    } catch (err) {
      setErrors({ submit:err.message||"Payment failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Summary render ──────────────────────────────────────────────────────────
  function renderSummary() {
    if (order.type==="membership") return (
      <>
        <div className="summary-section"><p className="summary-label">Membership Tier</p><p className="summary-value">{order.membership_level}</p></div>
        <div className="summary-section"><p className="summary-label">Duration</p><p className="summary-value">1 Year</p></div>
        <div className="summary-section"><p className="summary-label">Type</p><p className="summary-value">{order.transaction_type}</p></div>
        <div className="summary-total"><span>Total</span><span>{formatCurrency(order.amount)}</span></div>
      </>
    );

    if (order.type==="tickets") {
      // Use local date parsing to avoid UTC Thursday shift
      const [y,m,d] = (order.visitDate||"").split("-").map(Number);
      const isThursday = y ? new Date(y,m-1,d).getDay()===4 : order.isThursday;
      const memberLevel = order.memberLevel;
      const isMember    = order.isMember;
      const getPct = () => {
        if (isThursday) return 100;
        if (!isMember) return 0;
        const map = { "Leadership Circle":100, Benefactor:100, Platinum:25, Gold:20, Silver:15, Bronze:10 };
        return map[memberLevel]??0;
      };
      const pct    = getPct();
      const isFree = isThursday||pct===100;
      let total    = 0;
      const lines  = order.tickets.map(t => {
        const fp = isFree ? 0 : pct>0 ? t.basePrice*(1-pct/100) : t.finalPrice;
        total += fp*t.quantity;
        return { ...t, fp };
      });
      return (
        <>
          <div className="summary-section"><p className="summary-label">Visit Date</p><p className="summary-value">{order.visitDate}</p></div>
          <div className="summary-section"><p className="summary-label">Discount</p><p className="summary-value">{isThursday?"Thursday Special":pct===100?`${memberLevel} — Free Admission`:isMember?`${memberLevel} (${pct}% off)`:"None"}</p></div>
          <div className="summary-items">
            {lines.map((t,i)=>(
              <div className="summary-item" key={i}>
                <span>{t.quantity}× {t.label}</span>
                <span>{isFree?"FREE":formatCurrency(t.fp*t.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total"><span>Total</span><span>{isFree?"FREE":formatCurrency(total)}</span></div>
        </>
      );
    }

    if (order.type==="donation") return (
      <>
        <div className="summary-section"><p className="summary-label">Donation Type</p><p className="summary-value">{order.donationType}</p></div>
        <div className="summary-total"><span>Donation Amount</span><span>{formatCurrency(order.amount)}</span></div>
      </>
    );

    // cafe / giftshop
    return (
      <>
        {order.type==="cafe" && <div className="summary-section"><p className="summary-label">Estimated Pickup</p><p className="summary-value">{order.pickupEstimate}</p></div>}
        {order.type==="giftshop" && <div className="summary-section"><p className="summary-label">Fulfillment</p><p className="summary-value">{shopDetails.fulfillment_type==="pickup"?"Pick Up In Store":"Ship to Address"}</p></div>}
        <div className="summary-items">
          {order.items.map(item=>{
            const lineBase  = Number(item.quantity)*Number(item.price);
            const lineTotal = order.discountPercent>0 ? calculateDiscountedAmount(lineBase,order.discountPercent) : lineBase;
            return <div className="summary-item" key={item.item_id}><span>{item.quantity}× {item.item_name}</span><span>{formatCurrency(lineTotal)}</span></div>;
          })}
        </div>
        {order.discountPercent>0 && (
          <>
            <div className="summary-item"><span>Subtotal</span><span>{formatCurrency(getOrderBaseTotal(order))}</span></div>
            <div className="summary-item summary-discount"><span>Member Discount ({order.discountPercent}%)</span><span>-{formatCurrency(getOrderBaseTotal(order)-Number(order.total||0))}</span></div>
          </>
        )}
        <div className="summary-total"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
      </>
    );
  }

  function renderShopFields() {
    if (order.type==="membership") return (
      <><div className="checkout-field"><label>Name</label><input type="text" value={shopDetails.full_name} readOnly /></div><div className="checkout-field"><label>Email</label><input type="email" value={shopDetails.email} readOnly /></div></>
    );
    if (order.type!=="cafe"&&order.type!=="giftshop") return null;
    return (
      <>
        <div className="checkout-field"><label>Full Name</label><input type="text" value={shopDetails.full_name} readOnly /></div>
        <div className="checkout-field"><label>Email</label><input type="email" value={shopDetails.email} readOnly /></div>
        <div className="checkout-field"><label>Phone</label><input type="text" value={shopDetails.phone} readOnly /></div>
        {order.type==="cafe" ? (
          <>
            <div className="checkout-field"><label>Pickup Name</label><input type="text" value={shopDetails.pickup_name} onChange={e=>updateShopDetails("pickup_name",e.target.value)} placeholder="Pickup name" />{errors.pickup_name&&<p className="checkout-error">{errors.pickup_name}</p>}</div>
            <div className="checkout-field"><label>Pickup Notes</label><input type="text" value={shopDetails.pickup_notes} onChange={e=>updateShopDetails("pickup_notes",e.target.value)} placeholder="Optional notes for the cafe team" /></div>
          </>
        ) : (
          <>
            <div className="checkout-field"><label>Street Address</label><input type="text" value={shopDetails.street_address||"No saved address"} readOnly /></div>
            <div className="checkout-field-row">
              <div className="checkout-field"><label>City</label><input type="text" value={shopDetails.city||"—"} readOnly /></div>
              <div className="checkout-field"><label>State</label><input type="text" value={shopDetails.state||"—"} readOnly /></div>
              <div className="checkout-field"><label>ZIP</label><input type="text" value={shopDetails.zip_code||"—"} readOnly /></div>
            </div>
            <div className="checkout-field"><label>Fulfillment</label><select value={shopDetails.fulfillment_type} onChange={e=>updateShopDetails("fulfillment_type",e.target.value)}><option value="pickup">Pick Up In Store</option><option value="shipping">Ship to Address</option></select></div>
          </>
        )}
      </>
    );
  }

  function getHeading() {
    if (order.type==="membership") return `${order.membership_level} Membership`;
    if (order.type==="tickets")    return "Ticket Checkout";
    if (order.type==="donation")   return "Donation Checkout";
    if (order.type==="cafe")       return "Cafe Checkout";
    return "Gift Shop Checkout";
  }

  function getSubmitLabel() {
    if (loading) return "Processing...";
    // Warn user if this will go to pending
    if (order.type==="tickets") {
      const totalTickets = (order.tickets||[]).reduce((s,t)=>s+t.quantity,0);
      if (totalTickets>PENDING_TICKET_THRESHOLD) return `Submit for Approval (${totalTickets} tickets)`;
      if (order.total===0||(order.isMember&&["Benefactor","Leadership Circle"].includes(order.memberLevel))) return "Confirm FREE Tickets";
      const [y,m,d] = (order.visitDate||"").split("-").map(Number);
      const isThurs = y ? new Date(y,m-1,d).getDay()===4 : order.isThursday;
      if (isThurs) return "Confirm FREE Tickets";
      const pctMap = {"Leadership Circle":100,Benefactor:100,Platinum:25,Gold:20,Silver:15,Bronze:10};
      const pct    = order.isMember ? (pctMap[order.memberLevel]??0) : 0;
      const total  = (order.tickets||[]).reduce((s,t)=>s+t.basePrice*(1-pct/100)*t.quantity,0);
      return `Pay ${formatCurrency(total)}`;
    }
    if (order.type==="cafe"||order.type==="giftshop") {
      if (order.total>PENDING_SHOP_THRESHOLD) return `Submit for Approval (${formatCurrency(order.total)})`;
      return `Place Order ${formatCurrency(order.total)}`;
    }
    if (order.type==="membership") return `Pay ${formatCurrency(order.amount)}`;
    if (order.type==="donation")   return `Donate ${formatCurrency(order.amount)}`;
    return `Pay ${formatCurrency(order.total)}`;
  }

  if (!order) return null;

  // Determine if this will be a pending order (show advisory banner)
  const ticketCount   = (order.tickets||[]).reduce((s,t)=>s+t.quantity,0);
  const willBePending =
    (order.type==="tickets"  && ticketCount>PENDING_TICKET_THRESHOLD) ||
    ((order.type==="cafe"||order.type==="giftshop") && order.total>PENDING_SHOP_THRESHOLD);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-summary">
          <p className="checkout-eyebrow">Museum of Fine Arts, Houston</p>
          <h2 className="checkout-summary-title">{order.type==="donation"?"Donation Summary":"Order Summary"}</h2>
          {renderSummary()}
        </div>

        <div className="checkout-form-section">
          <h2 className="checkout-form-title">{getHeading()}</h2>
          <p className="checkout-form-subtitle">
            {order.type==="membership" ? "Your membership starts immediately upon payment." : "All transactions are secure and encrypted"}
          </p>

          {/* Large-order advisory */}
          {willBePending && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderLeft:"4px solid var(--color-gold)", padding:"0.875rem 1rem", marginBottom:"1.25rem", fontSize:"0.85rem", color:"#92400e", lineHeight:1.6 }}>
              <strong>Large order notice:</strong> This order exceeds our standard threshold and will be routed for employee approval. Your card will be charged and the order confirmed within 2–10 minutes during museum hours. You will be able to track its status in your dashboard.
            </div>
          )}

          <form onSubmit={handleSubmit} className="checkout-form">
            {profileLoading ? <p className="checkout-form-subtitle">Loading your account details...</p> : renderShopFields()}

            <div className="checkout-field"><label>Name on Card</label><input type="text" placeholder="Jane Doe" value={cardName} onChange={e=>setCardName(e.target.value)} />{errors.cardName&&<p className="checkout-error">{errors.cardName}</p>}</div>
            <div className="checkout-field"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={handleCardNumber} inputMode="numeric" maxLength={19} />{errors.cardNumber&&<p className="checkout-error">{errors.cardNumber}</p>}</div>
            <div className="checkout-field-row">
              <div className="checkout-field"><label>Expiry Date</label><input type="text" placeholder="MM/YY" value={expiry} onChange={handleExpiry} inputMode="numeric" maxLength={5} />{errors.expiry&&<p className="checkout-error">{errors.expiry}</p>}</div>
              <div className="checkout-field"><label>CVV</label><input type="text" placeholder="123" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} inputMode="numeric" maxLength={3} />{errors.cvv&&<p className="checkout-error">{errors.cvv}</p>}</div>
            </div>

            {errors.submit && <div className="checkout-submit-error">{errors.submit}</div>}
            <button type="submit" className="checkout-submit-btn" disabled={loading||profileLoading}>{getSubmitLabel()}</button>
            <button type="button" className="checkout-back-btn" onClick={()=>navigate(-1)}>Back</button>
          </form>
        </div>
      </div>
    </div>
  );
}