// pages/VisitorDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyVisitorRecord, getMyTickets, getMyDonations,
  getMyCafeTransactions, getMyGiftShopTransactions,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";

const TABS = [
  { id: "profile",   label: "My Profile" },
  { id: "visits",    label: "Visit History" },
  { id: "purchases", label: "Purchase History" },
  { id: "orders",    label: "Orders" },
  { id: "password",  label: "Change Password" },
];

const fmt = dateStr => {
  if (!dateStr) return "—";
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// Validate and block save if required fields are blank/invalid
function validateProfile(form) {
  const required = [
    { key: "first_name",     label: "First name",     maxLen: 50,  lettersOnly: true  },
    { key: "last_name",      label: "Last name",       maxLen: 50,  lettersOnly: true  },
    { key: "email",          label: "Email",           maxLen: 255, lettersOnly: false },
    { key: "phone_number",   label: "Phone number",    maxLen: 14,  lettersOnly: false },
    { key: "street_address", label: "Street address",  maxLen: 50,  lettersOnly: false },
    { key: "city",           label: "City",            maxLen: 30,  lettersOnly: false },
    { key: "state",          label: "State",           maxLen: 2,   lettersOnly: false },
    { key: "zip_code",       label: "Zip code",        maxLen: 5,   lettersOnly: false },
  ];
  for (const f of required) {
    const val = (form[f.key] || "").trim();
    if (!val) return `${f.label} is required and cannot be blank.`;
    if (val.length > f.maxLen) return `${f.label} cannot exceed ${f.maxLen} characters.`;
    if (f.lettersOnly && !/^[a-zA-Z\s\-']+$/.test(val))
      return `${f.label} can only contain letters, spaces, hyphens, and apostrophes.`;
  }
  const phoneDigits = (form.phone_number || "").replace(/\D/g, "");
  if (phoneDigits.length !== 10) return "Phone number must be exactly 10 digits.";
  if (!/^\d{5}$/.test((form.zip_code || "").trim())) return "Zip code must be exactly 5 digits.";
  return null;
}

export default function VisitorDashboard() {
  const navigate    = useNavigate();
  const userEmail   = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];

  const [activeTab,  setActiveTab]  = useState("profile");
  const [profile,    setProfile]    = useState(null);
  const [visitorRec, setVisitorRec] = useState(null);
  const [tickets,    setTickets]    = useState([]);
  const [donations,  setDonations]  = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [giftOrders, setGiftOrders] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [feedback,   setFeedback]   = useState(null);
  const [form,       setForm]       = useState({});
  const [pwForm,     setPwForm]     = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,   setPwErrors]   = useState({});
  const [ordersTab,  setOrdersTab]  = useState("giftshop");

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, vis, tix, don, cafe, gift] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(), getMyTickets(), getMyDonations(),
          getMyCafeTransactions(), getMyGiftShopTransactions(),
        ]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status  === "fulfilled") setVisitorRec(vis.value);
        if (tix.status  === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status  === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
        if (cafe.status === "fulfilled") setCafeOrders(Array.isArray(cafe.value) ? cafe.value : []);
        if (gift.status === "fulfilled") setGiftOrders(Array.isArray(gift.value) ? gift.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Update visitor record based on tickets whose visit_date <= today
  useEffect(() => {
    if (!visitorRec || tickets.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const completedVisits = tickets.filter(t =>
      t.visit_date && String(t.visit_date).slice(0, 10) <= today
    );
    if (completedVisits.length !== visitorRec.total_visits) {
      const latestVisit = completedVisits
        .map(t => String(t.visit_date).slice(0, 10))
        .sort()
        .reverse()[0];
      setVisitorRec(prev => ({
        ...prev,
        total_visits: completedVisits.length,
        last_visit_date: latestVisit || prev.last_visit_date,
      }));
    }
  }, [tickets, visitorRec]);

  function handleLogout() {
    ["token","role","user_id","user_email"].forEach(k => localStorage.removeItem(k));
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
        first_name:     form.first_name.trim(),
        last_name:      form.last_name.trim(),
        email:          form.email.trim(),
        phone_number:   form.phone_number,
        street_address: form.street_address.trim(),
        city:           form.city.trim(),
        state:          form.state,
        zip_code:       form.zip_code.trim(),
        date_of_birth:  form.date_of_birth ? form.date_of_birth.slice(0, 10) : null,
      });
      setProfile({ ...profile, ...form });
      notify("Profile updated successfully");
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    const errs = {};
    if (pwForm.new_password.length < 6) errs.new_password = "Min. 6 characters";
    if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = "Passwords do not match";
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    setPwErrors({});
    setSaving(true);
    try {
      await changeMyPassword(pwForm.new_password);
      notify("Password changed successfully");
      setPwForm({ new_password: "", confirm_password: "" });
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  // Group tickets by visit date for cleaner display
  const groupedTickets = tickets.reduce((acc, t) => {
    const key = String(t.visit_date).slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const sortedVisitDates = Object.keys(groupedTickets).sort().reverse();
  const ticketTotal = tickets.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
  const donationTotal = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const sortedCafeOrders = [...cafeOrders].sort(
    (a, b) => new Date(b.transaction_datetime || 0) - new Date(a.transaction_datetime || 0)
  );
  const sortedGiftOrders = [...giftOrders].sort(
    (a, b) => new Date(b.transaction_datetime || 0) - new Date(a.transaction_datetime || 0)
  );

  return (
    <div className="dashboard-page visitor-dashboard">
      <div className="dashboard-hero visitor-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge">Visitor</span>
          <h1>Welcome, {profile?.first_name || displayName}</h1>
          <p>Manage your account and explore your museum history.</p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">← Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="ss-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ss-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {feedback && <div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}

        {loading ? <div className="ss-loading">Loading your information…</div> : (
          <>
            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div className="ss-card">
                <h2 className="ss-section-title">My Profile</h2>
                <form className="ss-form" onSubmit={handleProfileSave}>
                  <div className="ss-form-grid">
                    <div className="ss-form-group">
                      <label>First Name *</label>
                      <input name="first_name" value={form.first_name || ""} onChange={handleFormChange} maxLength={50} />
                    </div>
                    <div className="ss-form-group">
                      <label>Last Name *</label>
                      <input name="last_name" value={form.last_name || ""} onChange={handleFormChange} maxLength={50} />
                    </div>
                    <div className="ss-form-group full">
                      <label>Email *</label>
                      <input name="email" type="email" value={form.email || ""} onChange={handleFormChange} maxLength={255} />
                    </div>
                    <div className="ss-form-group">
                      <label>Phone Number *</label>
                      <PhoneInput name="phone_number" value={form.phone_number || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Date of Birth</label>
                      <input name="date_of_birth" type="date" value={form.date_of_birth?.slice(0, 10) || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group full">
                      <label>Street Address * <span style={{ fontSize: 10, color: "#9ca3af" }}>(max 50 chars)</span></label>
                      <input name="street_address" value={form.street_address || ""} onChange={handleFormChange} maxLength={50} />
                    </div>
                    <div className="ss-form-group">
                      <label>City * <span style={{ fontSize: 10, color: "#9ca3af" }}>(max 30 chars)</span></label>
                      <input name="city" value={form.city || ""} onChange={handleFormChange} maxLength={30} />
                    </div>
                    <div className="ss-form-group">
                      <label>State *</label>
                      <StateSelect name="state" value={form.state || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Zip Code *</label>
                      <ZipInput name="zip_code" value={form.zip_code || ""} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className="ss-form-actions">
                    <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── VISIT HISTORY TAB ── */}
            {activeTab === "visits" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Visit History</h2>
                {visitorRec ? (
                  <>
                    <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
                      <div className="ss-stat">
                        <span className="ss-stat-value">{visitorRec.total_visits ?? 0}</span>
                        <span className="ss-stat-label">Total Visits</span>
                      </div>
                      <div className="ss-stat">
                        <span className="ss-stat-value">{fmt(visitorRec.last_visit_date)}</span>
                        <span className="ss-stat-label">Last Visit</span>
                      </div>
                    </div>
                    {sortedVisitDates.length > 0 && (
                      <>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                          Upcoming & Past Visits
                        </h3>
                        <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {["Visit Date","Tickets","Status","Total Paid"].map(h => (
                                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Total Paid" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sortedVisitDates.map((date, i) => {
                                const group = groupedTickets[date];
                                const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                                const today = new Date().toISOString().slice(0, 10);
                                const status = date < today ? "Visited" : date === today ? "Today" : "Upcoming";
                                const statusColor = status === "Visited" ? "#6b7280" : status === "Today" ? "#c9a84c" : "#1a5276";
                                return (
                                  <tr key={date} style={{ borderBottom: i < sortedVisitDates.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                    <td style={{ padding: "0.625rem 1rem", color: "#374151", fontWeight: 500 }}>{fmt(date)}</td>
                                    <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{group.length} ticket{group.length > 1 ? "s" : ""}</td>
                                    <td style={{ padding: "0.625rem 1rem", color: statusColor, fontWeight: 500 }}>{status}</td>
                                    <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${total.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="ss-empty">No visit records found.</div>
                )}
              </div>
            )}

            {/* ── PURCHASE HISTORY TAB ── */}
            {activeTab === "purchases" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Purchase History</h2>

                {/* Tickets — grouped by visit date */}
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Tickets
                </h3>
                {tickets.length === 0 ? (
                  <div className="ss-empty" style={{ marginBottom: 24 }}>
                    No tickets purchased yet.{" "}
                    <Link to="/tickets" style={{ color: "#c9a84c" }}>Buy tickets</Link>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: 32 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["Visit Date","Tickets","Types","Total","Payment"].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Total" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedVisitDates.map((date, i) => {
                          const group = groupedTickets[date];
                          const total = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                          const types = [...new Set(group.map(t => t.ticket_type))].join(", ");
                          return (
                            <tr key={date} style={{ borderBottom: i < sortedVisitDates.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(date)}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{group.length}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{types}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${total.toFixed(2)}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{group[0]?.payment_method || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={3} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} across {sortedVisitDates.length} visit{sortedVisitDates.length !== 1 ? "s" : ""}
                          </td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>${ticketTotal.toFixed(2)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Donations */}
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Donations
                </h3>
                {donations.length === 0 ? (
                  <div className="ss-empty">
                    No donations yet.{" "}
                    <Link to="/donations" style={{ color: "#c9a84c" }}>Make a donation</Link>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["Date","Type","Amount"].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Amount" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d, i) => (
                          <tr key={d.donation_id} style={{ borderBottom: i < donations.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(d.donation_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{d.donation_type}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${parseFloat(d.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={2} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>Total Donated</td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>${donationTotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── CHANGE PASSWORD TAB ── */}
            {activeTab === "orders" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Orders</h2>

                <div className="ss-tabs" style={{ marginBottom: 20 }}>
                  <button
                    className={`ss-tab ${ordersTab === "giftshop" ? "active" : ""}`}
                    onClick={() => setOrdersTab("giftshop")}
                  >
                    Gift Shop
                  </button>
                  <button
                    className={`ss-tab ${ordersTab === "cafe" ? "active" : ""}`}
                    onClick={() => setOrdersTab("cafe")}
                  >
                    Cafe
                  </button>
                </div>

                {ordersTab === "giftshop" && (
                  <>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Gift Shop Orders
                    </h3>
                    {sortedGiftOrders.length === 0 ? (
                      <div className="ss-empty">
                        No gift shop orders yet.{" "}
                        <Link to="/gift-shop" style={{ color: "#c9a84c" }}>Visit the gift shop</Link>
                      </div>
                    ) : (
                      <div style={{ border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: 12 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                              {["Order Date", "Order ID", "Payment", "Total"].map((h) => (
                                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Total" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedGiftOrders.map((order, i) => (
                              <tr key={order.transaction_id} style={{ borderBottom: i < sortedGiftOrders.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(order.transaction_datetime)}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>#{order.transaction_id}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{order.payment_method || "—"}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {ordersTab === "cafe" && (
                  <>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Cafe Orders
                    </h3>
                    {sortedCafeOrders.length === 0 ? (
                      <div className="ss-empty">
                        No cafe orders yet.{" "}
                        <Link to="/cafe" style={{ color: "#c9a84c" }}>Visit the cafe</Link>
                      </div>
                    ) : (
                      <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                              {["Order Date", "Order ID", "Payment", "Total"].map((h) => (
                                <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Total" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedCafeOrders.map((order, i) => (
                              <tr key={order.cafe_transaction_id} style={{ borderBottom: i < sortedCafeOrders.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(order.transaction_datetime)}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>#{order.cafe_transaction_id}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{order.payment_method || "—"}</td>
                                <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "password" && (
              <div className="ss-card" style={{ maxWidth: 420 }}>
                <h2 className="ss-section-title">Change Password</h2>
                <form className="ss-form" onSubmit={handlePasswordChange}>
                  <div className="ss-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="ss-form-group">
                      <label>New Password <span style={{ fontSize: 10, color: "#9ca3af" }}>(min. 6 characters)</span></label>
                      <PasswordInput value={pwForm.new_password}
                        onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                        placeholder="Min. 6 characters" required />
                      {pwErrors.new_password && <span style={{ fontSize: 11, color: "#dc2626" }}>{pwErrors.new_password}</span>}
                    </div>
                    <div className="ss-form-group">
                      <label>Confirm New Password</label>
                      <PasswordInput value={pwForm.confirm_password}
                        onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))}
                        placeholder="Repeat new password" required />
                      {pwErrors.confirm_password && <span style={{ fontSize: 11, color: "#dc2626" }}>{pwErrors.confirm_password}</span>}
                    </div>
                  </div>
                  <div className="ss-form-actions">
                    <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
                      {saving ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
