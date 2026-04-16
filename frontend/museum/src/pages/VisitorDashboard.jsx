// pages/VisitorDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyVisitorRecord, getMyTickets, getMyDonations,
  getMyEventSignups,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";

const TABS = [
  { id: "profile",   label: "My Profile"       },
  { id: "visits",    label: "Visit History"    },
  { id: "purchases", label: "Purchase History" },
  { id: "password",  label: "Change Password"  },
];

const fmt = dateStr => {
  if (!dateStr) return "—";
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export default function VisitorDashboard() {
  const navigate    = useNavigate();
  const userEmail   = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];

  const [activeTab,    setActiveTab]    = useState("profile");
  const [profile,      setProfile]      = useState(null);
  const [visitorRec,   setVisitorRec]   = useState(null);
  const [tickets,      setTickets]      = useState([]);
  const [donations,    setDonations]    = useState([]);
  const [eventSignups, setEventSignups] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [form,         setForm]         = useState({});
  const [pwForm,       setPwForm]       = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,     setPwErrors]     = useState({});

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, vis, tix, don, signups] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(), getMyTickets(),
          getMyDonations(), getMyEventSignups(),
        ]);
        if (prof.status    === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status     === "fulfilled") setVisitorRec(vis.value);
        if (tix.status     === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status     === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
        if (signups.status === "fulfilled") setEventSignups(Array.isArray(signups.value) ? signups.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

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
    setSaving(true);
    try {
      await updateMyProfile({
        first_name:     form.first_name,
        last_name:      form.last_name,
        email:          form.email,
        phone_number:   form.phone_number,
        street_address: form.street_address,
        city:           form.city,
        state:          form.state,
        zip_code:       form.zip_code,
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
                      <label>First Name</label>
                      <input name="first_name" value={form.first_name || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Last Name</label>
                      <input name="last_name" value={form.last_name || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group full">
                      <label>Email</label>
                      <input name="email" type="email" value={form.email || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Phone Number</label>
                      <PhoneInput name="phone_number" value={form.phone_number || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Date of Birth</label>
                      <input name="date_of_birth" type="date"
                        value={form.date_of_birth?.slice(0, 10) || ""}
                        onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group full">
                      <label>Street Address</label>
                      <input name="street_address" value={form.street_address || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>City</label>
                      <input name="city" value={form.city || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>State</label>
                      <StateSelect name="state" value={form.state || ""} onChange={handleFormChange} />
                    </div>
                    <div className="ss-form-group">
                      <label>Zip Code</label>
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

                {/* Visit stats */}
                {visitorRec ? (
                  <div className="ss-stat-grid" style={{ marginBottom: 32 }}>
                    <div className="ss-stat">
                      <span className="ss-stat-value">{visitorRec.total_visits ?? 0}</span>
                      <span className="ss-stat-label">Total Visits</span>
                    </div>
                    <div className="ss-stat">
                      <span className="ss-stat-value">{fmt(visitorRec.last_visit_date)}</span>
                      <span className="ss-stat-label">Last Visit</span>
                    </div>
                  </div>
                ) : (
                  <div className="ss-empty" style={{ marginBottom: 24 }}>No visit records found.</div>
                )}

                {/* Event signups */}
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Events Signed Up For
                </h3>
                {eventSignups.length === 0 ? (
                  <div className="ss-empty">
                    No events signed up yet.{" "}
                    <Link to="/events" style={{ color: "#c9a84c" }}>Browse events</Link>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["Event", "Type", "Event Date", "Signup Date", "Qty", "Location"].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {eventSignups.map((s, i) => (
                          <tr key={s.signup_id} style={{ borderBottom: i < eventSignups.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151", fontWeight: 500 }}>{s.event_name}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{s.event_type || "General"}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(s.event_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(s.signup_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{s.quantity}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{s.gallery_name || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={6} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                            Total Events: {eventSignups.length} &nbsp;·&nbsp; Total Spots: {eventSignups.reduce((s, e) => s + e.quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── PURCHASE HISTORY TAB ── */}
            {activeTab === "purchases" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Purchase History</h2>

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
                          {["Purchase Date","Visit Date","Type","Discount","Price","Payment"].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Price" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t, i) => (
                          <tr key={t.ticket_id} style={{ borderBottom: i < tickets.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(t.purchase_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(t.visit_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.ticket_type}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.discount_type}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>
                              {t.final_price != null ? `$${parseFloat(t.final_price).toFixed(2)}` : "—"}
                            </td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={4} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                            Total Tickets: {tickets.length}
                          </td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>
                            ${tickets.reduce((s, t) => s + parseFloat(t.final_price || 0), 0).toFixed(2)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

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
                            <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>
                              {d.amount != null ? `$${parseFloat(d.amount).toFixed(2)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={2} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>Total Donated</td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>
                            ${donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── CHANGE PASSWORD TAB ── */}
            {activeTab === "password" && (
              <div className="ss-card" style={{ maxWidth: 420 }}>
                <h2 className="ss-section-title">Change Password</h2>
                <form className="ss-form" onSubmit={handlePasswordChange}>
                  <div className="ss-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="ss-form-group">
                      <label>New Password <span style={{ fontSize: 10, color: "#9ca3af" }}>(min. 6 characters)</span></label>
                      <PasswordInput
                        value={pwForm.new_password}
                        onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                        placeholder="Min. 6 characters" required />
                      {pwErrors.new_password && <span style={{ fontSize: 11, color: "#dc2626" }}>{pwErrors.new_password}</span>}
                    </div>
                    <div className="ss-form-group">
                      <label>Confirm New Password</label>
                      <PasswordInput
                        value={pwForm.confirm_password}
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