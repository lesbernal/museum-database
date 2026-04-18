// pages/MemberDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyVisitorRecord, getMyMemberRecord, getMyMembershipTransactions,
  getMyTickets, getMyDonations, getMyCafeTransactions, getMyGiftShopTransactions,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "membership", label: "Membership" },
  { id: "visits", label: "Visits" },
  { id: "purchases", label: "Purchases" },
  { id: "orders", label: "Orders" },
  { id: "security", label: "Security" },
];

const PURCHASABLE_TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

const LEVEL_COLORS = {
  Bronze:              { bg: "#fdf2e9", color: "#a04000", border: "#f0a070" },
  Silver:              { bg: "#f2f3f4", color: "#566573", border: "#aab7b8" },
  Gold:                { bg: "#fef9e7", color: "#9a7d0a", border: "#f4d03f" },
  Platinum:            { bg: "#eaf4fb", color: "#1a5276", border: "#7fb3d3" },
  Benefactor:          { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc" },
  "Leadership Circle": { bg: "#fff1f2", color: "#9f1239", border: "#fb7185" },
};
const DEFAULT_STYLE  = { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
const DONATION_TIERS = ["Benefactor", "Leadership Circle"];

const fmt = dateStr => {
  if (!dateStr) return "—";
  const datePart = String(dateStr).slice(0, 10);
  const [year, month, day] = datePart.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

const fmtShort = dateStr => {
  if (!dateStr) return "—";
  const datePart = String(dateStr).slice(0, 10);
  const [year, month, day] = datePart.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

const fmtDateTime = datetimeStr => {
  if (!datetimeStr) return "—";
  const datePart = String(datetimeStr).slice(0, 10);
  const [year, month, day] = datePart.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

function validateProfile(form) {
  const required = [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "Phone number" },
    { key: "street_address", label: "Street address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip_code", label: "Zip code" },
  ];
  for (const f of required) {
    const val = (form[f.key] || "").trim();
    if (!val) return `${f.label} is required.`;
  }
  const phoneDigits = (form.phone_number || "").replace(/\D/g, "");
  if (phoneDigits.length !== 10) return "Phone number must be exactly 10 digits.";
  if (!/^\d{5}$/.test((form.zip_code || "").trim())) return "Zip code must be exactly 5 digits.";
  return null;
}

// Ticket Group Modal Component
function TicketGroupModal({ tickets, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const user = await getMyProfile();
        setUserInfo(user);
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    loadUserInfo();
  }, []);

  const generateBarcode = (ticketId) => {
    return String(ticketId).padStart(8, '0');
  };

  const renderBarcodeVisual = (ticketId) => {
    const barcodeNumber = generateBarcode(ticketId);
    return (
      <div className="mini-barcode-visual">
        {barcodeNumber.split('').map((digit, i) => (
          <div key={i} className="barcode-line" style={{ height: `${12 + parseInt(digit) * 1.5}px` }}></div>
        ))}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const firstTicket = tickets[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ticket-group-modal" onClick={e => e.stopPropagation()}>
        <div className="ticket-modal-header">
          <h2>Museum Admission Tickets</h2>
          <button className="ticket-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ticket-modal-body">
          <div className="purchase-summary">
            <div className="summary-row"><span>Visit Date:</span><strong>{formatDate(firstTicket.visit_date)}</strong></div>
            <div className="summary-row"><span>Purchase Date:</span><strong>{formatDate(firstTicket.purchase_date)}</strong></div>
            <div className="summary-row"><span>Total Tickets:</span><strong>{tickets.length}</strong></div>
            <div className="summary-row"><span>Total Paid:</span><strong>${tickets.reduce((sum, t) => sum + parseFloat(t.final_price || 0), 0).toFixed(2)}</strong></div>
          </div>

          <div className="tickets-list">
            <h4>Tickets</h4>
            {tickets.map((ticket, idx) => (
              <div key={idx} className="ticket-stub-mini">
                <div className="ticket-stub-mini-left">
                  <div className="ticket-type">{ticket.ticket_type}</div>
                  <div className="ticket-price">${parseFloat(ticket.final_price || 0).toFixed(2)}</div>
                </div>
                <div className="ticket-stub-mini-right">
                  {renderBarcodeVisual(ticket.ticket_id)}
                  <div className="barcode-number">{generateBarcode(ticket.ticket_id)}</div>
                  <div className="ticket-id">#{ticket.ticket_id}</div>
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

// Donation Modal Component
function DonationModal({ donation, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const user = await getMyProfile();
        setUserInfo(user);
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    loadUserInfo();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  };

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
            <div className="summary-row"><span>Donation Date:</span><strong>{formatDate(donation.donation_date)}</strong></div>
            <div className="summary-row"><span>Donation Time:</span><strong>{formatTime(donation.donation_date)}</strong></div>
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
            <p className="donation-impact-note">The Museum of Fine Arts, Houston is a 501(c)(3) nonprofit organization. Your donation is tax-deductible.</p>
          </div>

          <div className="donation-footer"><p>Thank you for supporting the arts!</p></div>
        </div>
      </div>
    </div>
  );
}

// Order Detail Modal Component
function OrderDetailModal({ order, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [fulfillmentDetails, setFulfillmentDetails] = useState(null);

  useEffect(() => {
    async function loadOrderDetails() {
      setLoading(true);
      try {
        const user = await getMyProfile();
        setUserInfo(user);

        if (order.order_type === "Cafe") {
          const { getCafeTransactionItems, getCafeItems } = await import("../services/api");
          const [allItems, cafeItems] = await Promise.all([getCafeTransactionItems(), getCafeItems()]);
          const orderItems = allItems.filter(item => item.transaction_id === order.cafe_transaction_id);
          const itemsWithNames = orderItems.map(item => {
            const cafeItem = cafeItems.find(ci => ci.item_id === item.item_id);
            return { ...item, item_name: cafeItem?.item_name || `Item #${item.item_id}`, price: cafeItem?.price || 0 };
          });
          setItems(itemsWithNames);
        } else if (order.order_type === "Gift Shop") {
          const { getGiftShopTransactionItems, getGiftShopItems } = await import("../services/api");
          const [allItems, giftItems] = await Promise.all([getGiftShopTransactionItems(), getGiftShopItems()]);
          const orderItems = allItems.filter(item => item.transaction_id === order.transaction_id);
          const itemsWithNames = orderItems.map(item => {
            const giftItem = giftItems.find(gi => gi.item_id === item.item_id);
            return { ...item, item_name: giftItem?.item_name || `Item #${item.item_id}`, price: giftItem?.price || 0 };
          });
          setItems(itemsWithNames);
          
          if (order.fulfillment_type === "shipping") {
            setFulfillmentDetails({ type: "shipping", address: order.shipping_address });
          } else {
            setFulfillmentDetails({ type: "pickup" });
          }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadOrderDetails();
  }, [order]);

  const formatDateTime = (datetime) => {
    if (!datetime) return "—";
    const date = new Date(datetime);
    return date.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <div className="order-modal-header"><h2>Order Receipt</h2><button className="order-modal-close" onClick={onClose}>×</button></div>
        <div className="order-modal-body">
          <div className="order-receipt-header"><div className="order-logo">MFAH</div><div className="order-title">{order.order_type} Order</div><div className="order-id">Order #{order.cafe_transaction_id || order.transaction_id}</div></div>

          {userInfo && (<div className="order-section"><h3>Customer Information</h3><div className="order-info-grid"><div><span className="info-label">Name</span><span className="info-value">{userInfo.first_name} {userInfo.last_name}</span></div><div><span className="info-label">Email</span><span className="info-value">{userInfo.email}</span></div><div><span className="info-label">Phone</span><span className="info-value">{userInfo.phone_number || "—"}</span></div></div></div>)}

          <div className="order-section"><h3>Order Details</h3><div className="order-info-grid"><div><span className="info-label">Order Date</span><span className="info-value">{formatDateTime(order.date)}</span></div>
            {order.order_type === "Cafe" && <div><span className="info-label">Pickup Time</span><span className="info-value">Estimated 10-20 minutes</span></div>}
            {order.order_type === "Gift Shop" && fulfillmentDetails && (<><div><span className="info-label">Fulfillment</span><span className="info-value">{fulfillmentDetails.type === "shipping" ? "Ship to Address" : "Pick Up In Store"}</span></div>
            {fulfillmentDetails.type === "shipping" && fulfillmentDetails.address && (<div className="full-width"><span className="info-label">Shipping Address</span><span className="info-value">{fulfillmentDetails.address}</span></div>)}</>)}
          </div></div>

          <div className="order-section"><h3>Items</h3>
            {loading ? <div className="order-loading">Loading items...</div> : items.length === 0 ? <div className="order-empty">No items found</div> : (
              <table className="order-items-table"><thead><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>{items.map((item, idx) => (<tr key={idx}><td>{item.item_name}</td><td>{item.quantity}</td><td>${parseFloat(item.price || 0).toFixed(2)}</td><td>${parseFloat(item.subtotal || (item.quantity * (item.price || 0))).toFixed(2)}</td></tr>))}</tbody>
              <tfoot><tr><td colSpan="3" className="order-total-label">Total</td><td className="order-total-amount">${parseFloat(order.total_amount || 0).toFixed(2)}</td></tr></tfoot></table>
            )}
          </div>

          <div className="order-footer"><p>Thank you for your order!</p>
            {order.order_type === "Cafe" && <p className="order-footer-note">Present this receipt when picking up your order.</p>}
            {order.order_type === "Gift Shop" && fulfillmentDetails?.type === "pickup" && <p className="order-footer-note">Present this receipt when picking up your order at the gift shop.</p>}
            {order.order_type === "Gift Shop" && fulfillmentDetails?.type === "shipping" && <p className="order-footer-note">Your order will be shipped to the address provided.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [visitorRec, setVisitorRec] = useState(null);
  const [memberRec, setMemberRec] = useState(null);
  const [memberTxns, setMemberTxns] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [donations, setDonations] = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [giftOrders, setGiftOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPurchaseTickets, setSelectedPurchaseTickets] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, vis, mem, txns, tix, don, cafe, gift] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(), getMyMemberRecord(),
          getMyMembershipTransactions(), getMyTickets(), getMyDonations(),
          getMyCafeTransactions(), getMyGiftShopTransactions(),
        ]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status === "fulfilled") setVisitorRec(vis.value);
        if (mem.status === "fulfilled") setMemberRec(mem.value?.user_id ? mem.value : null);
        if (txns.status === "fulfilled") setMemberTxns(Array.isArray(txns.value) ? txns.value : []);
        if (tix.status === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
        if (cafe.status === "fulfilled") setCafeOrders(Array.isArray(cafe.value) ? cafe.value : []);
        if (gift.status === "fulfilled") setGiftOrders(Array.isArray(gift.value) ? gift.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }

      if (userId) {
        fetch(`${API_URL}/check-membership-expiry`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId }),
        }).then(r => r.json()).then(data => {
          if (data.action === "cancelled") {
            localStorage.setItem("role", "visitor");
            notify("Your membership has expired and been cancelled. You are now a visitor.", "error");
            setTimeout(() => navigate("/visitor-dashboard"), 3000);
          }
        }).catch(() => {});
      }
    }
    load();
  }, []);

  function handleLogout() {
    ["token", "role", "user_id", "user_email"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    const err = validateProfile(form);
    if (err) { notify(err, "error"); return; }
    setSaving(true);
    try {
      await updateMyProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number,
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        state: form.state,
        zip_code: form.zip_code.trim(),
        date_of_birth: form.date_of_birth ? form.date_of_birth.slice(0, 10) : null,
      });
      setProfile({ ...profile, ...form });
      notify("Profile updated successfully");
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.new_password.length < 6) {
      setPwErrors({ new_password: "Min. 6 characters" });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErrors({ confirm_password: "Passwords do not match" });
      return;
    }
    setPwErrors({});
    setSaving(true);
    try {
      await changeMyPassword(pwForm.new_password);
      notify("Password changed successfully");
      setPwForm({ new_password: "", confirm_password: "" });
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function setPendingLevel(level) {
    try {
      const res = await fetch(`${API_URL}/membershiptransactions/pending`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, pending_level: level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMemberRec(prev => ({ ...prev, pending_level: level || null }));
      notify(data.message);
    } catch (e) { notify(e.message, "error"); }
  }

  async function handleCancelMembership() {
    await setPendingLevel("cancelled");
    setShowCancelConfirm(false);
  }

  async function handleTierChange(newTier) {
    await setPendingLevel(newTier);
    setShowTierModal(false);
  }

  async function handleClearPending() {
    await setPendingLevel(null);
  }

  function parseLocalDate(dateStr) {
    const [year, month, day] = String(dateStr).slice(0, 10).split("-");
    return new Date(year, month - 1, day);
  }

  const daysUntilExpiry = memberRec?.expiration_date
    ? Math.ceil((parseLocalDate(memberRec.expiration_date) - parseLocalDate(new Date().toISOString().slice(0, 10))) / (1000 * 60 * 60 * 24))
    : null;
  const levelStyle = LEVEL_COLORS[memberRec?.membership_level] || DEFAULT_STYLE;
  const isDonationTier = DONATION_TIERS.includes(memberRec?.membership_level);
  const showExpiryWarn = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isCancelled = memberRec?.pending_level === "cancelled";
  const hasPendingTier = memberRec?.pending_level && memberRec.pending_level !== "cancelled";

  const groupedTickets = tickets.reduce((acc, t) => {
    const key = String(t.visit_date).slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const sortedVisitDates = Object.keys(groupedTickets).sort().reverse();
  const ticketTotal = tickets.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
  const donationTotal = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const membershipTotal = memberTxns.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const upcomingVisits = sortedVisitDates.filter(date => date >= new Date().toISOString().slice(0, 10));
  const pastVisits = sortedVisitDates.filter(date => date < new Date().toISOString().slice(0, 10));

  const allOrders = [
    ...cafeOrders.map(o => ({ ...o, order_type: "Cafe", date: o.transaction_datetime })),
    ...giftOrders.map(o => ({ ...o, order_type: "Gift Shop", date: o.transaction_datetime, fulfillment_type: o.fulfillment_type, shipping_address: o.shipping_address })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const groupedByTransaction = tickets.reduce((acc, ticket) => {
    const key = ticket.transaction_id || `single_${ticket.ticket_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticket);
    return acc;
  }, {});

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="welcome-card">
        <h2>Welcome back, {profile?.first_name || displayName}!</h2>
        <p>Manage your membership and explore your museum journey.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-info"><span className="stat-value">{memberRec?.membership_level || "None"}</span><span className="stat-label">Membership Level</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">{visitorRec?.total_visits || 0}</span><span className="stat-label">Total Visits</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">{upcomingVisits.length}</span><span className="stat-label">Upcoming Visits</span></div></div>
        <div className="stat-card"><div className="stat-info"><span className="stat-value">${donationTotal.toFixed(0)}</span><span className="stat-label">Donated</span></div></div>
      </div>

      <div className="quick-actions">
        <Link to="/tickets" className="quick-action-btn">Buy Tickets</Link>
        <Link to="/donations" className="quick-action-btn">Make a Donation</Link>
        <Link to="/membership" className="quick-action-btn">Upgrade</Link>
      </div>

      {upcomingVisits.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Visits</h3>
          <div className="upcoming-list">
            {upcomingVisits.slice(0, 3).map(date => (
              <div key={date} className="upcoming-item"><span className="upcoming-date">{fmt(date)}</span><span className="upcoming-tickets">{groupedTickets[date].length} tickets</span></div>
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

  const renderMembership = () => (
    <div className="membership-section">
      <div className="membership-card">
        <div className="membership-header" style={{ background: levelStyle.bg, borderBottom: `1px solid ${levelStyle.border}` }}>
          <div className="membership-badge" style={{ background: levelStyle.color }}>{memberRec?.membership_level}</div>
          {!isCancelled && !isDonationTier && (
            <button onClick={() => setShowCancelConfirm(true)} className="cancel-membership-btn">Cancel Membership</button>
          )}
        </div>
        <div className="membership-stats">
          <div><span className="label">Member Since</span><span className="value">{fmt(memberRec?.join_date)}</span></div>
          <div><span className="label">Expires</span><span className="value">{fmt(memberRec?.expiration_date)}</span></div>
          {daysUntilExpiry !== null && <div><span className="label">Days Remaining</span><span className="value" style={{ color: daysUntilExpiry < 30 ? "#dc2626" : "#111827" }}>{isExpired ? "Expired" : `${daysUntilExpiry} days`}</span></div>}
        </div>
        {!isDonationTier && !isCancelled && (
          <div className="membership-actions">
            <Link to="/membership" className="renew-btn">{isExpired ? "Renew Membership" : "Renew / Upgrade"}</Link>
            {!isExpired && <button onClick={() => setShowTierModal(true)} className="plan-change-btn">Plan Tier Change</button>}
          </div>
        )}
        {hasPendingTier && (
          <div className="pending-banner">Your next renewal will be at <strong>{memberRec.pending_level}</strong>. <button onClick={handleClearPending}>Undo</button></div>
        )}
      </div>

      {memberTxns.length > 0 && (
        <div className="membership-history">
          <h3>Membership History</h3>
          <div className="history-table">
            <table>
              <thead><tr><th>Date</th><th>Level</th><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                {memberTxns.map((t, i) => (
                  <tr key={t.transaction_id}><td>{fmtShort(t.transaction_date)}</td><td>{t.membership_level}</td><td>{t.transaction_type}</td><td>${Number(t.amount).toFixed(2)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan="3">Total</td><td>${membershipTotal.toFixed(2)}</td></tr></tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderVisits = () => (
    <div className="visits-section">
      {sortedVisitDates.length === 0 ? (
        <div className="empty-state"><p>No visits yet.</p><Link to="/tickets" className="empty-action">Plan your first visit</Link></div>
      ) : (
        <>
          {upcomingVisits.length > 0 && (
            <div className="visit-group"><h3>Upcoming</h3>
              {upcomingVisits.map(date => {
                const group = groupedTickets[date];
                const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                return (<div key={date} className="visit-card upcoming"><div className="visit-date">{fmt(date)}</div><div className="visit-details"><span>{group.length} ticket{group.length > 1 ? "s" : ""}</span><span className="visit-total">${total.toFixed(2)}</span></div></div>);
              })}
            </div>
          )}
          {pastVisits.length > 0 && (
            <div className="visit-group"><h3>Past Visits</h3>
              {pastVisits.slice(0, 5).map(date => {
                const group = groupedTickets[date];
                const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                return (<div key={date} className="visit-card past"><div className="visit-date">{fmt(date)}</div><div className="visit-details"><span>{group.length} ticket{group.length > 1 ? "s" : ""}</span><span className="visit-total">${total.toFixed(2)}</span></div></div>);
              })}
              {pastVisits.length > 5 && <button className="view-more">View all past visits</button>}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderPurchases = () => (
    <>
      <div className="purchases-section">
        <div className="purchase-group">
          <h3>Tickets</h3>
          {tickets.length === 0 ? (
            <div className="empty-state small">
              <p>No tickets purchased yet.</p>
              <Link to="/tickets" className="empty-action">Buy tickets</Link>
            </div>
          ) : (
            <div className="purchase-list">
              {Object.entries(groupedByTransaction).map(([transactionId, transactionTickets]) => {
                const total = transactionTickets.reduce((sum, t) => sum + parseFloat(t.final_price || 0), 0);
                const purchaseDate = transactionTickets[0]?.purchase_date;
                const ticketTypes = [...new Set(transactionTickets.map(t => t.ticket_type))].join(", ");
                return (
                  <div key={transactionId} className="purchase-item">
                    <div className="purchase-date">{fmt(purchaseDate)}</div>
                    <div className="purchase-info">
                      <span className="purchase-type">{ticketTypes}</span>
                      <span className="purchase-qty">{transactionTickets.length} tickets</span>
                    </div>
                    <div className="purchase-amount">${total.toFixed(2)}</div>
                    <button 
                      className="view-ticket-btn"
                      onClick={() => setSelectedPurchaseTickets(transactionTickets)}
                    >
                      View Tickets
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="purchase-group">
          <h3>Donations</h3>
          {donations.length === 0 ? (
            <div className="empty-state small">
              <p>No donations yet.</p>
              <Link to="/donations" className="empty-action">Make a donation</Link>
            </div>
          ) : (
            <div className="purchase-list">
              {donations.map(donation => (
                <div key={donation.donation_id} className="purchase-item">
                  <div className="purchase-date">{fmt(donation.donation_date)}</div>
                  <div className="purchase-info">
                    <span className="purchase-type">{donation.donation_type}</span>
                  </div>
                  <div className="purchase-amount">${parseFloat(donation.amount || 0).toFixed(2)}</div>
                  <button 
                    className="view-donation-btn"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    View Receipt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedPurchaseTickets && (
        <TicketGroupModal 
          tickets={selectedPurchaseTickets} 
          onClose={() => setSelectedPurchaseTickets(null)} 
        />
      )}
      
      {selectedDonation && (
        <DonationModal 
          donation={selectedDonation} 
          onClose={() => setSelectedDonation(null)} 
        />
      )}
    </>
  );

  const renderOrders = () => (
    <>
      <div className="orders-section">
        {allOrders.length === 0 ? (<div className="empty-state"><p>No orders yet.</p><Link to="/cafe" className="empty-action">Visit the Cafe</Link><Link to="/gift-shop" className="empty-action">Visit the Gift Shop</Link></div>) : (
          <div className="orders-list">{allOrders.map(order => (<div key={order.cafe_transaction_id || order.transaction_id} className="order-item" onClick={() => setSelectedOrder(order)}><div className="order-header"><span className="order-type">{order.order_type}</span><span className="order-date">{fmtDateTime(order.date)}</span></div><div className="order-amount">${parseFloat(order.total_amount || 0).toFixed(2)}</div></div>))}</div>
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
    <div className="member-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>My Museum</h1>
            <div className="header-badge">
              <span className="role-badge member-badge">Member</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        {TABS.map(tab => (<button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>))}
      </div>

      <div className="dashboard-content">
        {feedback && <div className={`feedback-message ${feedback.type}`}>{feedback.msg}</div>}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "membership" && renderMembership()}
        {activeTab === "visits" && renderVisits()}
        {activeTab === "purchases" && renderPurchases()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "security" && renderSecurity()}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="um-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="um-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header"><h3>Cancel Membership</h3><button className="um-modal-close" onClick={() => setShowCancelConfirm(false)}>×</button></div>
            <div className="um-modal-body"><p>Are you sure you want to cancel your <strong>{memberRec?.membership_level}</strong> membership?</p><p>You will keep all your current benefits until <strong>{fmt(memberRec?.expiration_date)}</strong>. After that, your account will revert to a free visitor account.</p></div>
            <div className="um-modal-footer"><button className="um-cancel-btn" onClick={() => setShowCancelConfirm(false)}>Keep Membership</button><button onClick={handleCancelMembership} style={{ padding: "0.625rem 1.25rem", background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}>Yes, Cancel</button></div>
          </div>
        </div>
      )}

      {/* Tier change modal */}
      {showTierModal && (
        <div className="um-overlay" onClick={() => setShowTierModal(false)}>
          <div className="um-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header"><h3>Plan Tier Change</h3><button className="um-modal-close" onClick={() => setShowTierModal(false)}>×</button></div>
            <div className="um-modal-body"><p>Select the tier you would like at your <strong>next renewal</strong>.</p><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{PURCHASABLE_TIERS.filter(t => t !== memberRec?.membership_level).map(tier => (<button key={tier} onClick={() => handleTierChange(tier)} style={{ padding: "10px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}><span>{tier}</span><span style={{ color: "#9ca3af" }}>{PURCHASABLE_TIERS.indexOf(tier) < PURCHASABLE_TIERS.indexOf(memberRec?.membership_level) ? "Downgrade" : "Upgrade"}</span></button>))}</div></div>
            <div className="um-modal-footer"><button className="um-cancel-btn" onClick={() => setShowTierModal(false)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}