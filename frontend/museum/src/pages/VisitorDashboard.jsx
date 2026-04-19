// pages/VisitorDashboard.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyVisitorRecord, getMyTickets, getMyDonations,
  getMyCafeTransactions, getMyGiftShopTransactions,
  getMyEventSignups,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "profile",   label: "Profile"   },
  { id: "visits",    label: "Visits"    },
  { id: "purchases", label: "Purchases" },
  { id: "orders",    label: "Orders"    },
  { id: "security",  label: "Security"  },
];

// Safe date formatter — slices YYYY-MM-DD directly, never passes string to new Date()
const fmt = dateStr => {
  if (!dateStr) return "—";
  const [year, month, day] = String(dateStr).slice(0, 10).split("-").map(Number);
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[month - 1]} ${day}, ${year}`;
};

// For datetime strings (cafe/giftshop orders with time component)
const fmtDateTime = datetimeStr => {
  if (!datetimeStr) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(datetimeStr).trim())) return fmt(datetimeStr);
  const date = new Date(datetimeStr);
  return date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function validateProfile(form) {
  const required = [
    { key: "first_name",     label: "First name"    },
    { key: "last_name",      label: "Last name"     },
    { key: "email",          label: "Email"         },
    { key: "phone_number",   label: "Phone number"  },
    { key: "street_address", label: "Street address"},
    { key: "city",           label: "City"          },
    { key: "state",          label: "State"         },
    { key: "zip_code",       label: "Zip code"      },
  ];
  for (const f of required) {
    if (!(form[f.key] || "").trim()) return `${f.label} is required.`;
  }
  if ((form.phone_number || "").replace(/\D/g, "").length !== 10)
    return "Phone number must be exactly 10 digits.";
  if (!/^\d{5}$/.test((form.zip_code || "").trim()))
    return "Zip code must be exactly 5 digits.";
  return null;
}

// ── Ticket group modal ────────────────────────────────────────────────────────
function TicketGroupModal({ tickets, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => { getMyProfile().then(setUserInfo).catch(() => {}); }, []);

  const generateBarcode = id => String(id).padStart(8, "0");
  const renderBarcode   = id => (
    <div className="mini-barcode-visual">
      {generateBarcode(id).split("").map((digit, i) => (
        <div key={i} className="barcode-line" style={{ height: `${12 + parseInt(digit) * 1.5}px` }} />
      ))}
    </div>
  );

  // Safe — no new Date() on date-only strings
  const formatDate = dateStr => fmt(dateStr);

  const first = tickets[0];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ticket-group-modal" onClick={e => e.stopPropagation()}>
        <div className="ticket-modal-header">
          <h2>Museum Admission Tickets</h2>
          <button className="ticket-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ticket-modal-body">
          <div className="purchase-summary">
            <div className="summary-row"><span>Visit Date:</span><strong>{formatDate(first.visit_date)}</strong></div>
            <div className="summary-row"><span>Purchase Date:</span><strong>{formatDate(first.purchase_date)}</strong></div>
            <div className="summary-row"><span>Total Tickets:</span><strong>{tickets.length}</strong></div>
            <div className="summary-row"><span>Total Paid:</span><strong>${tickets.reduce((s,t) => s + parseFloat(t.final_price || 0), 0).toFixed(2)}</strong></div>
          </div>
          <div className="tickets-list">
            <h4>Tickets</h4>
            {tickets.map((t, i) => (
              <div key={i} className="ticket-stub-mini">
                <div className="ticket-stub-mini-left">
                  <div className="ticket-type">{t.ticket_type}</div>
                  <div className="ticket-price">${parseFloat(t.final_price || 0).toFixed(2)}</div>
                </div>
                <div className="ticket-stub-mini-right">
                  {renderBarcode(t.ticket_id)}
                  <div className="barcode-number">{generateBarcode(t.ticket_id)}</div>
                  <div className="ticket-id">#{t.ticket_id}</div>
                </div>
              </div>
            ))}
          </div>
          {userInfo && (
            <div className="ticket-visitor">
              <h4>Visitor Information</h4>
              <div className="ticket-detail-row"><span className="detail-label">Name</span><span className="detail-value">{userInfo.first_name} {userInfo.last_name}</span></div>
              <div className="ticket-detail-row"><span className="detail-label">Email</span><span className="detail-value">{userInfo.email}</span></div>
            </div>
          )}
          <div className="ticket-footer">
            <p>Please present this ticket at the museum entrance.</p>
            <p className="ticket-footer-note">Valid for one-time entry on the date specified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donation modal ────────────────────────────────────────────────────────────
function DonationModal({ donation, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => { getMyProfile().then(setUserInfo).catch(() => {}); }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="donation-modal" onClick={e => e.stopPropagation()}>
        <div className="donation-modal-header">
          <h2>Donation Receipt</h2>
          <button className="donation-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="donation-modal-body">
          <div className="donation-receipt-header">
            <div className="donation-logo">MFAH</div>
            <div className="donation-title">Thank You for Your Support!</div>
            <div className="donation-id">Donation #{donation.donation_id}</div>
          </div>
          <div className="donation-summary">
            <div className="summary-row"><span>Donation Date:</span><strong>{fmt(donation.donation_date)}</strong></div>
            <div className="summary-row"><span>Donation Type:</span><strong>{donation.donation_type}</strong></div>
            <div className="summary-row highlight"><span>Donation Amount:</span><strong>${parseFloat(donation.amount || 0).toFixed(2)}</strong></div>
          </div>
          {userInfo && (
            <div className="donation-donor">
              <h4>Donor Information</h4>
              <div className="donation-detail-row"><span className="detail-label">Name</span><span className="detail-value">{userInfo.first_name} {userInfo.last_name}</span></div>
              <div className="donation-detail-row"><span className="detail-label">Email</span><span className="detail-value">{userInfo.email}</span></div>
            </div>
          )}
          <div className="donation-impact">
            <p>Your generosity helps preserve art and culture for future generations.</p>
            <p className="donation-impact-note">The Museum of Fine Arts, Houston is a 501(c)(3) nonprofit organization. Your donation is tax-deductible to the full extent of the law.</p>
          </div>
          <div className="donation-footer"><p>Thank you for supporting the arts!</p></div>
        </div>
      </div>
    </div>
  );
}

// ── Order detail modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
  const [items, setItems]            = useState([]);
  const [loading, setLoading]        = useState(true);
  const [userInfo, setUserInfo]      = useState(null);
  const [fulfillment, setFulfillment]= useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const user = await getMyProfile();
        setUserInfo(user);
        if (order.order_type === "Cafe") {
          const { getCafeTransactionItems, getCafeItems } = await import("../services/api");
          const [allItems, cafeItems] = await Promise.all([getCafeTransactionItems(), getCafeItems()]);
          setItems(allItems
            .filter(i => i.transaction_id === order.cafe_transaction_id)
            .map(i => ({ ...i, item_name: cafeItems.find(c => c.item_id === i.item_id)?.item_name || `Item #${i.item_id}`, price: cafeItems.find(c => c.item_id === i.item_id)?.price || 0 }))
          );
        } else if (order.order_type === "Gift Shop") {
          const { getGiftShopTransactionItems, getGiftShopItems } = await import("../services/api");
          const [allItems, giftItems] = await Promise.all([getGiftShopTransactionItems(), getGiftShopItems()]);
          setItems(allItems
            .filter(i => i.transaction_id === order.transaction_id)
            .map(i => ({ ...i, item_name: giftItems.find(g => g.item_id === i.item_id)?.item_name || `Item #${i.item_id}`, price: giftItems.find(g => g.item_id === i.item_id)?.price || 0 }))
          );
          setFulfillment(order.fulfillment_type === "shipping"
            ? { type: "shipping", address: order.shipping_address }
            : { type: "pickup" });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [order]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <div className="order-modal-header"><h2>Order Receipt</h2><button className="order-modal-close" onClick={onClose}>×</button></div>
        <div className="order-modal-body">
          <div className="order-receipt-header">
            <div className="order-logo">MFAH</div>
            <div className="order-title">{order.order_type} Order</div>
            <div className="order-id">Order #{order.cafe_transaction_id || order.transaction_id}</div>
          </div>
          {userInfo && (
            <div className="order-section"><h3>Customer Information</h3>
              <div className="order-info-grid">
                <div><span className="info-label">Name</span><span className="info-value">{userInfo.first_name} {userInfo.last_name}</span></div>
                <div><span className="info-label">Email</span><span className="info-value">{userInfo.email}</span></div>
                <div><span className="info-label">Phone</span><span className="info-value">{userInfo.phone_number || "—"}</span></div>
              </div>
            </div>
          )}
          <div className="order-section"><h3>Order Details</h3>
            <div className="order-info-grid">
              <div><span className="info-label">Order Date</span><span className="info-value">{fmtDateTime(order.date)}</span></div>
              {order.order_type === "Cafe" && <div><span className="info-label">Pickup Time</span><span className="info-value">Estimated 10-20 minutes</span></div>}
              {fulfillment && <div><span className="info-label">Fulfillment</span><span className="info-value">{fulfillment.type === "shipping" ? "Ship to Address" : "Pick Up In Store"}</span></div>}
            </div>
          </div>
          <div className="order-section"><h3>Items</h3>
            {loading ? <div className="order-loading">Loading items...</div> : items.length === 0 ? <div className="order-empty">No items found</div> : (
              <table className="order-items-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>{items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.item_name}</td><td>{item.quantity}</td>
                    <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                    {/* subtotal reflects DB trigger discount */}
                    <td>${parseFloat(item.subtotal || item.quantity * (item.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr><td colSpan="3" className="order-total-label">Total</td><td className="order-total-amount">${parseFloat(order.total_amount || 0).toFixed(2)}</td></tr></tfoot>
              </table>
            )}
          </div>
          <div className="order-footer"><p>Thank you for your order!</p></div>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function VisitorDashboard() {
  const navigate    = useNavigate();
  const userEmail   = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];
  const userId      = localStorage.getItem("user_id");

  const [activeTab,              setActiveTab]              = useState("overview");
  const [profile,                setProfile]                = useState(null);
  const [visitorRec,             setVisitorRec]             = useState(null);
  const [tickets,                setTickets]                = useState([]);
  const [donations,              setDonations]              = useState([]);
  const [cafeOrders,             setCafeOrders]             = useState([]);
  const [giftOrders,             setGiftOrders]             = useState([]);
  const [eventSignups,           setEventSignups]           = useState([]);
  const [loading,                setLoading]                = useState(true);
  const [saving,                 setSaving]                 = useState(false);
  const [feedback,               setFeedback]               = useState(null);
  const [form,                   setForm]                   = useState({});
  const [pwForm,                 setPwForm]                 = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,               setPwErrors]               = useState({});
  const [selectedOrder,          setSelectedOrder]          = useState(null);
  const [selectedPurchaseTickets,setSelectedPurchaseTickets]= useState(null);
  const [selectedDonation,       setSelectedDonation]       = useState(null);
  const [unsigningEvent,         setUnsigningEvent]         = useState(null);
  const [editingSignup,          setEditingSignup]          = useState(null);
  const [editQuantity,           setEditQuantity]           = useState(1);

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, vis, tix, don, cafe, gift, signups] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(), getMyTickets(), getMyDonations(),
          getMyCafeTransactions(), getMyGiftShopTransactions(), getMyEventSignups(),
        ]);
        if (prof.status   === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status    === "fulfilled") setVisitorRec(vis.value);
        if (tix.status    === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status    === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
        if (cafe.status   === "fulfilled") setCafeOrders(Array.isArray(cafe.value) ? cafe.value : []);
        if (gift.status   === "fulfilled") setGiftOrders(Array.isArray(gift.value) ? gift.value : []);
        if (signups.status=== "fulfilled") setEventSignups(Array.isArray(signups.value) ? signups.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function handleFormChange(e) { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); }

  async function handleProfileSave(e) {
    e.preventDefault();
    const err = validateProfile(form);
    if (err) { notify(err, "error"); return; }
    setSaving(true);
    try {
      await updateMyProfile({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim(), phone_number: form.phone_number, street_address: form.street_address.trim(), city: form.city.trim(), state: form.state, zip_code: form.zip_code.trim(), date_of_birth: form.date_of_birth ? form.date_of_birth.slice(0, 10) : null });
      setProfile({ ...profile, ...form });
      notify("Profile updated successfully");
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.new_password.length < 6) { setPwErrors({ new_password: "Min. 6 characters" }); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwErrors({ confirm_password: "Passwords do not match" }); return; }
    setPwErrors({}); setSaving(true);
    try { await changeMyPassword(pwForm.new_password); notify("Password changed successfully"); setPwForm({ new_password: "", confirm_password: "" }); }
    catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handleUnsignup(eventId, signupId) {
    setUnsigningEvent(signupId);
    try {
      const res  = await fetch(`${BASE_URL}/events/${eventId}/unsignup`, { method: "DELETE", headers: { Authorization: `Bearer ${userId}` } });
      const data = await res.json();
      if (res.ok) { setEventSignups(prev => prev.filter(e => e.signup_id !== signupId)); notify("Event signup cancelled!"); }
      else notify(data.error || "Could not cancel signup.", "error");
    } catch { notify("Something went wrong.", "error"); }
    finally { setUnsigningEvent(null); }
  }

  async function handleUpdateSignup(eventId, signupId, qty) {
    try {
      const res  = await fetch(`${BASE_URL}/events/${eventId}/update-signup`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${userId}` }, body: JSON.stringify({ quantity: qty }) });
      const data = await res.json();
      if (res.ok) { setEventSignups(prev => prev.map(e => e.signup_id === signupId ? { ...e, quantity: qty } : e)); notify("Signup updated!"); setEditingSignup(null); }
      else notify(data.error || "Could not update signup.", "error");
    } catch { notify("Something went wrong.", "error"); }
  }

  function handleLogout() {
    ["token", "role", "user_id", "user_email"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  }

  // ── Derived data ──────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);

  const groupedTickets = tickets.reduce((acc, t) => {
    const key = String(t.visit_date).slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const sortedVisitDates = Object.keys(groupedTickets).sort().reverse();

  // Total visits = number of DISTINCT visit dates on or before today
  // (not total ticket count, not individual tickets)
  const distinctPastVisitDates = sortedVisitDates.filter(d => d <= todayStr);
  const totalVisitCount        = distinctPastVisitDates.length;

  const ticketTotal   = tickets.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
  const donationTotal = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const upcomingVisits = sortedVisitDates.filter(d => d >= todayStr);
  const pastVisits     = sortedVisitDates.filter(d => d < todayStr);

  const allOrders = [
    ...cafeOrders.map(o => ({ ...o, order_type: "Cafe",      date: o.transaction_datetime })),
    ...giftOrders.map(o => ({ ...o, order_type: "Gift Shop", date: o.transaction_datetime, fulfillment_type: o.fulfillment_type, shipping_address: o.shipping_address })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const groupedByTransaction = tickets.reduce((acc, ticket) => {
    const key = ticket.transaction_id || `single_${ticket.ticket_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticket);
    return acc;
  }, {});

  // ── Render sections ───────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="welcome-card">
        <h2>Welcome back, {profile?.first_name || displayName}!</h2>
        <p>Explore your museum journey at a glance.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-info"><span className="stat-value">{totalVisitCount}</span><span className="stat-label">Total Visits</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">{upcomingVisits.length}</span><span className="stat-label">Upcoming Visits</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">${ticketTotal.toFixed(0)}</span><span className="stat-label">Ticket Spend</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">${donationTotal.toFixed(0)}</span><span className="stat-label">Donated</span></div></div>
      </div>
      <div className="quick-actions">
        <Link to="/tickets"   className="quick-action-btn">Buy Tickets</Link>
        <Link to="/donations" className="quick-action-btn">Make a Donation</Link>
        <Link to="/membership"className="quick-action-btn">Become a Member</Link>
      </div>
      {upcomingVisits.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Visits</h3>
          <div className="upcoming-list">
            {upcomingVisits.slice(0, 3).map(date => (
              <div key={date} className="upcoming-item">
                <span className="upcoming-date">{fmt(date)}</span>
                <span className="upcoming-tickets">{groupedTickets[date].length} tickets</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <form className="profile-form" onSubmit={handleProfileSave}>
      <div className="form-grid">
        <div className="form-field"><label>First Name</label><input name="first_name" value={form.first_name || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>Last Name</label><input name="last_name" value={form.last_name || ""} onChange={handleFormChange} /></div>
        <div className="form-field full-width"><label>Email</label><input name="email" type="email" value={form.email || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>Phone</label><PhoneInput name="phone_number" value={form.phone_number || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>Date of Birth</label><input name="date_of_birth" type="date" value={form.date_of_birth?.slice(0, 10) || ""} onChange={handleFormChange} /></div>
        <div className="form-field full-width"><label>Street Address</label><input name="street_address" value={form.street_address || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>City</label><input name="city" value={form.city || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>State</label><StateSelect name="state" value={form.state || ""} onChange={handleFormChange} /></div>
        <div className="form-field"><label>Zip Code</label><ZipInput name="zip_code" value={form.zip_code || ""} onChange={handleFormChange} /></div>
      </div>
      <div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
    </form>
  );

  const renderVisits = () => {
    const upcomingSignups = eventSignups.filter(e => String(e.event_date).slice(0, 10) >= todayStr);
    const pastSignups     = eventSignups.filter(e => String(e.event_date).slice(0, 10) < todayStr);
    return (
      <div className="visits-section">
        {sortedVisitDates.length === 0 && eventSignups.length === 0 ? (
          <div className="empty-state"><p>No visits yet.</p><Link to="/tickets" className="empty-action">Plan your first visit</Link></div>
        ) : (
          <>
            {upcomingVisits.length > 0 && (
              <div className="visit-group">
                <h3>Upcoming Visits</h3>
                {upcomingVisits.map(date => {
                  const group = groupedTickets[date];
                  const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                  return (
                    <div key={date} className="visit-card upcoming">
                      <div className="visit-date">{fmt(date)}</div>
                      <div className="visit-details"><span>{group.length} ticket{group.length !== 1 ? "s" : ""}</span><span className="visit-total">${total.toFixed(2)}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
            {upcomingSignups.length > 0 && (
              <div className="visit-group">
                <h3>Upcoming Events</h3>
                {upcomingSignups.map(e => {
                  const isEditing = editingSignup === e.signup_id;
                  return (
                    <div key={e.signup_id} className="visit-card upcoming" style={{ borderLeft: "3px solid #c5a028" }}>
                      <div className="visit-date">{fmt(e.event_date)}</div>
                      <div className="visit-details">
                        <span style={{ fontWeight: 600 }}>{e.event_name}</span>
                        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{e.event_type} · {e.quantity} spot{e.quantity !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {isEditing ? (
                          <>
                            <input type="number" min="1" value={editQuantity} onChange={ev => setEditQuantity(Number(ev.target.value))} style={{ width: 50, padding: "0.2rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }} />
                            <button onClick={() => handleUpdateSignup(e.event_id, e.signup_id, editQuantity)} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>Save</button>
                            <button onClick={() => setEditingSignup(null)} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: "0.75rem", background: "#fef9c3", color: "#854d0e", padding: "0.2rem 0.6rem", borderRadius: 999, fontWeight: 600 }}>Event</span>
                            <button onClick={() => { setEditingSignup(e.signup_id); setEditQuantity(e.quantity); }} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>Edit</button>
                            <button onClick={() => handleUnsignup(e.event_id, e.signup_id)} disabled={unsigningEvent === e.signup_id} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>{unsigningEvent === e.signup_id ? "Cancelling..." : "Cancel"}</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {pastVisits.length > 0 && (
              <div className="visit-group">
                <h3>Past Visits</h3>
                {pastVisits.slice(0, 5).map(date => {
                  const group = groupedTickets[date];
                  const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                  return (
                    <div key={date} className="visit-card past">
                      <div className="visit-date">{fmt(date)}</div>
                      <div className="visit-details"><span>{group.length} ticket{group.length !== 1 ? "s" : ""}</span><span className="visit-total">${total.toFixed(2)}</span></div>
                    </div>
                  );
                })}
                {pastVisits.length > 5 && <button className="view-more">View all past visits</button>}
              </div>
            )}
            {pastSignups.length > 0 && (
              <div className="visit-group">
                <h3>Past Events Attended</h3>
                {pastSignups.map(e => (
                  <div key={e.signup_id} className="visit-card past" style={{ borderLeft: "3px solid #d1d5db" }}>
                    <div className="visit-date">{fmt(e.event_date)}</div>
                    <div className="visit-details">
                      <span style={{ fontWeight: 600 }}>{e.event_name}</span>
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{e.event_type} · {e.quantity} spot{e.quantity !== 1 ? "s" : ""}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", background: "#f3f4f6", color: "#6b7280", padding: "0.2rem 0.6rem", borderRadius: 999, fontWeight: 600 }}>Event</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderPurchases = () => (
    <>
      <div className="purchases-section">
        <div className="purchase-group">
          <h3>Tickets</h3>
          {tickets.length === 0 ? (
            <div className="empty-state small"><p>No tickets purchased yet.</p><Link to="/tickets" className="empty-action">Buy tickets</Link></div>
          ) : (
            <div className="purchase-list">
              {Object.entries(groupedByTransaction).map(([transactionId, transactionTickets]) => {
                const total        = transactionTickets.reduce((sum, t) => sum + parseFloat(t.final_price || 0), 0);
                const purchaseDate = transactionTickets[0]?.purchase_date;
                const ticketTypes  = [...new Set(transactionTickets.map(t => t.ticket_type))].join(", ");
                return (
                  <div key={transactionId} className="purchase-item">
                    <div className="purchase-date">{fmt(purchaseDate)}</div>
                    <div className="purchase-info"><span className="purchase-type">{ticketTypes}</span><span className="purchase-qty">{transactionTickets.length} tickets</span></div>
                    <div className="purchase-amount" style={{ marginRight: "0.75rem" }}>${total.toFixed(2)}</div>
                    <button className="view-ticket-btn" onClick={() => setSelectedPurchaseTickets(transactionTickets)}>View Tickets</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="purchase-group">
          <h3>Donations</h3>
          {donations.length === 0 ? (
            <div className="empty-state small"><p>No donations yet.</p><Link to="/donations" className="empty-action">Make a donation</Link></div>
          ) : (
            <div className="purchase-list">
              {donations.map(donation => (
                <div key={donation.donation_id} className="purchase-item">
                  <div className="purchase-date">{fmt(donation.donation_date)}</div>
                  <div className="purchase-info"><span className="purchase-type">{donation.donation_type}</span></div>
                  <div className="purchase-amount" style={{ marginRight: "0.75rem" }}>${parseFloat(donation.amount || 0).toFixed(2)}</div>
                  <button className="view-donation-btn" onClick={() => setSelectedDonation(donation)}>View Receipt</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedPurchaseTickets && <TicketGroupModal tickets={selectedPurchaseTickets} onClose={() => setSelectedPurchaseTickets(null)} />}
      {selectedDonation && <DonationModal donation={selectedDonation} onClose={() => setSelectedDonation(null)} />}
    </>
  );

  const renderOrders = () => (
    <>
      <div className="orders-section">
        {allOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "0.5rem" }}>
              <Link to="/cafe"      className="empty-action">Visit the Cafe</Link>
              <Link to="/gift-shop" className="empty-action">Visit the Gift Shop</Link>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {allOrders.map(order => (
              <div key={order.cafe_transaction_id || order.transaction_id} className="order-item" onClick={() => setSelectedOrder(order)}>
                <div className="order-header">
                  <span className="order-type">{order.order_type}</span>
                  <span className="order-date">{fmtDateTime(order.date)}</span>
                </div>
                <div className="order-amount">${parseFloat(order.total_amount || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </>
  );

  const renderSecurity = () => (
    <form className="security-form" onSubmit={handlePasswordChange}>
      <div className="form-field"><label>New Password</label><PasswordInput value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} placeholder="Min. 6 characters" />{pwErrors.new_password && <span className="field-error">{pwErrors.new_password}</span>}</div>
      <div className="form-field"><label>Confirm New Password</label><PasswordInput value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} placeholder="Repeat new password" />{pwErrors.confirm_password && <span className="field-error">{pwErrors.confirm_password}</span>}</div>
      <div className="form-actions"><button type="submit" className="save-btn" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button></div>
    </form>
  );

  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;

  return (
    <div className="visitor-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>My Museum</h1>
            <div className="header-badge"><span className="role-badge visitor-badge">Visitor Account</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs" style={{ overflowY: "hidden" }}>
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {feedback && <div className={`feedback-message ${feedback.type}`}>{feedback.msg}</div>}
        {activeTab === "overview"  && renderOverview()}
        {activeTab === "profile"   && renderProfile()}
        {activeTab === "visits"    && renderVisits()}
        {activeTab === "purchases" && renderPurchases()}
        {activeTab === "orders"    && renderOrders()}
        {activeTab === "security"  && renderSecurity()}
      </div>
    </div>
  );
}