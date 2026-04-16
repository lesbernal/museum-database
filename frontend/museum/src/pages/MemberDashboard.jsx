// pages/MemberDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyVisitorRecord, getMyMemberRecord, getMyMembershipTransactions,
  getMyTickets, getMyDonations,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = [
  { id: "profile",    label: "My Profile"      },
  { id: "membership", label: "Membership"       },
  { id: "visits",     label: "Visit History"    },
  { id: "purchases",  label: "Purchase History" },
  { id: "password",   label: "Change Password"  },
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
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
const fmtShort = dateStr => {
  if (!dateStr) return "—";
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function validateProfile(form) {
  const required = [
    { key: "first_name",     label: "First name",    maxLen: 50,  lettersOnly: true  },
    { key: "last_name",      label: "Last name",      maxLen: 50,  lettersOnly: true  },
    { key: "email",          label: "Email",          maxLen: 255, lettersOnly: false },
    { key: "phone_number",   label: "Phone number",   maxLen: 14,  lettersOnly: false },
    { key: "street_address", label: "Street address", maxLen: 50,  lettersOnly: false },
    { key: "city",           label: "City",           maxLen: 30,  lettersOnly: false },
    { key: "state",          label: "State",          maxLen: 2,   lettersOnly: false },
    { key: "zip_code",       label: "Zip code",       maxLen: 5,   lettersOnly: false },
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

export default function MemberDashboard() {
  const navigate    = useNavigate();
  const userEmail   = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];
  const userId      = localStorage.getItem("user_id");
  const token       = localStorage.getItem("token");

  const [activeTab,     setActiveTab]     = useState("profile");
  const [profile,       setProfile]       = useState(null);
  const [visitorRec,    setVisitorRec]    = useState(null);
  const [memberRec,     setMemberRec]     = useState(null);
  const [memberTxns,    setMemberTxns]    = useState([]);
  const [tickets,       setTickets]       = useState([]);
  const [donations,     setDonations]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [feedback,      setFeedback]      = useState(null);
  const [form,          setForm]          = useState({});
  const [pwForm,        setPwForm]        = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,      setPwErrors]      = useState({});
  const [expandedDates, setExpandedDates] = useState({});
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
        const [prof, vis, mem, txns, tix, don] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(), getMyMemberRecord(),
          getMyMembershipTransactions(), getMyTickets(), getMyDonations(),
        ]);
        if (prof.status  === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status   === "fulfilled") setVisitorRec(vis.value);
        if (mem.status   === "fulfilled") setMemberRec(mem.value?.user_id ? mem.value : null);
        if (txns.status  === "fulfilled") setMemberTxns(Array.isArray(txns.value) ? txns.value : []);
        if (tix.status   === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status   === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }

      if (userId) {
        fetch(`${API_URL}/check-membership-expiry`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId }),
        })
        .then(r => r.json())
        .then(data => {
          if (data.action === "cancelled") {
            localStorage.setItem("role", "visitor");
            notify("Your membership has expired and been cancelled. You are now a visitor.", "error");
            setTimeout(() => navigate("/visitor-dashboard"), 3000);
          }
        })
        .catch(() => {});
      }
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
      await changeMyPassword(pwForm.new_password, profile);
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

  function toggleDate(date) {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  }

  const daysUntilExpiry = memberRec?.expiration_date
    ? Math.ceil((new Date(memberRec.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const levelStyle     = LEVEL_COLORS[memberRec?.membership_level] || DEFAULT_STYLE;
  const isDonationTier = DONATION_TIERS.includes(memberRec?.membership_level);
  const showExpiryWarn = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired      = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isCancelled    = memberRec?.pending_level === "cancelled";
  const hasPendingTier = memberRec?.pending_level && memberRec.pending_level !== "cancelled";

  const groupedTickets   = tickets.reduce((acc, t) => {
    const key = String(t.visit_date).slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const sortedVisitDates = Object.keys(groupedTickets).sort().reverse();
  const ticketTotal      = tickets.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
  const donationTotal    = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const membershipTotal  = memberTxns.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <div className="dashboard-page member-dashboard">

      {/* ── Notification banner ── */}
      {(showExpiryWarn || isExpired || isCancelled || hasPendingTier) && (
        <div style={{
          background: isExpired || isCancelled ? "#fee2e2" : hasPendingTier ? "#eff6ff" : "#fef3c7",
          color: isExpired || isCancelled ? "#991b1b" : hasPendingTier ? "#1e40af" : "#92400e",
          padding: "12px 24px", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          borderBottom: `1px solid ${isExpired || isCancelled ? "#fecaca" : hasPendingTier ? "#bfdbfe" : "#fde68a"}`,
        }}>
          <span>
            {isCancelled && "Your membership cancellation is scheduled. You will remain a member until your expiry date."}
            {hasPendingTier && !isCancelled && `Your next renewal will be at the ${memberRec.pending_level} tier.`}
            {isExpired && !isCancelled && !hasPendingTier && "Your membership has expired. Renew to keep your benefits."}
            {showExpiryWarn && !isCancelled && !hasPendingTier && `Your membership expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}.`}
          </span>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {(isCancelled || hasPendingTier) && (
              <button onClick={handleClearPending} style={{
                padding: "5px 14px", background: "transparent",
                border: "1px solid currentColor", color: "inherit",
                cursor: "pointer", fontSize: 12, fontWeight: 500,
              }}>
                Undo
              </button>
            )}
            {!isCancelled && !isDonationTier && (
              <Link to="/membership" style={{
                padding: "6px 16px",
                background: isExpired ? "#991b1b" : "#92400e",
                color: "#fff", textDecoration: "none", fontSize: 12,
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {isExpired ? "Renew Now" : "Renew"}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-hero member-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge member-badge">Member</span>
          <h1>Welcome, {profile?.first_name || displayName}</h1>
          <p>Access your membership benefits and manage your account.</p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="ss-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ss-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {feedback && <div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}

        {loading ? <div className="ss-loading">Loading your information...</div> : (
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
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── MEMBERSHIP TAB ── */}
            {activeTab === "membership" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Membership Details</h2>
                {memberRec ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                      <div className="ss-membership-badge" style={{
                        background: levelStyle.bg, color: levelStyle.color,
                        border: `1px solid ${levelStyle.border}`,
                      }}>
                        {memberRec.membership_level} Member
                      </div>
                      {!isCancelled && !isDonationTier && (
                        <button onClick={() => setShowCancelConfirm(true)} style={{
                          padding: "7px 16px", background: "transparent",
                          border: "1px solid #dc2626", color: "#dc2626",
                          cursor: "pointer", fontSize: 12, fontWeight: 500,
                          letterSpacing: "0.04em",
                        }}>
                          Cancel Membership
                        </button>
                      )}
                      {isCancelled && (
                        <span style={{ fontSize: 12, color: "#991b1b", fontStyle: "italic" }}>
                          Cancellation scheduled
                        </span>
                      )}
                    </div>

                    <div className="ss-stat-grid">
                      <div className="ss-stat">
                        <span className="ss-stat-value">{fmt(memberRec.join_date)}</span>
                        <span className="ss-stat-label">Member Since</span>
                      </div>
                      <div className="ss-stat">
                        <span className="ss-stat-value">{fmt(memberRec.expiration_date)}</span>
                        <span className="ss-stat-label">Expires</span>
                      </div>
                      {daysUntilExpiry !== null && (
                        <div className="ss-stat">
                          <span className="ss-stat-value" style={{ color: daysUntilExpiry < 30 ? "#c0392b" : "inherit" }}>
                            {isExpired ? "Expired" : `${daysUntilExpiry} days`}
                          </span>
                          <span className="ss-stat-label">Until Expiry</span>
                        </div>
                      )}
                      <div className="ss-stat">
                        <span className="ss-stat-value">{visitorRec?.total_visits ?? 0}</span>
                        <span className="ss-stat-label">Total Visits</span>
                      </div>
                    </div>

                    {!isDonationTier && !isCancelled && (
                      <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Link to="/membership" style={{
                          display: "inline-block", padding: "0.625rem 1.5rem",
                          background: "#c9a84c", color: "#000", fontSize: 13,
                          fontWeight: 500, textTransform: "uppercase",
                          letterSpacing: "0.06em", textDecoration: "none",
                        }}>
                          {isExpired ? "Renew Membership" : "Renew / Upgrade"}
                        </Link>
                        {!isExpired && (
                          <button onClick={() => setShowTierModal(true)} style={{
                            padding: "0.625rem 1.5rem", background: "transparent",
                            border: "1px solid #d1d5db", color: "#374151",
                            fontSize: 13, fontWeight: 500, cursor: "pointer",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                          }}>
                            Plan Tier Change
                          </button>
                        )}
                      </div>
                    )}

                    {hasPendingTier && (
                      <div style={{ marginTop: 16, padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13, color: "#1e40af" }}>
                        At your next renewal your tier will change to <strong>{memberRec.pending_level}</strong>.{" "}
                        <button onClick={handleClearPending} style={{ background: "none", border: "none", color: "#1e40af", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>
                          Undo
                        </button>
                      </div>
                    )}

                    {memberTxns.length > 0 && (
                      <div style={{ marginTop: 32 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Membership History
                        </h3>
                        <div style={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {["Date","Level","Type","Amount"].map(h => (
                                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Amount" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {memberTxns.map((t, i) => (
                                <tr key={t.transaction_id} style={{ borderBottom: i < memberTxns.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmtShort(t.transaction_date)}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.membership_level}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.transaction_type}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${Number(t.amount).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ss-empty">
                    <p style={{ marginBottom: 12 }}>No membership record found.</p>
                    <Link to="/membership" style={{ color: "#c9a84c", fontSize: 13 }}>Browse membership tiers</Link>
                  </div>
                )}
              </div>
            )}

            {/* ── VISIT HISTORY TAB ── */}
            {activeTab === "visits" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Visit History</h2>
                {visitorRec ? (
                  <div className="ss-stat-grid">
                    <div className="ss-stat">
                      <span className="ss-stat-value">{visitorRec.total_visits ?? 0}</span>
                      <span className="ss-stat-label">Total Visits</span>
                    </div>
                    <div className="ss-stat">
                      <span className="ss-stat-value">{fmtShort(visitorRec.last_visit_date)}</span>
                      <span className="ss-stat-label">Last Visit</span>
                    </div>
                  </div>
                ) : (
                  <div className="ss-empty">No visit records found.</div>
                )}
              </div>
            )}

            {/* ── PURCHASE HISTORY TAB ── */}
            {activeTab === "purchases" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Purchase History</h2>

                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Memberships
                </h3>
                {memberTxns.length === 0 ? (
                  <div className="ss-empty" style={{ marginBottom: 24 }}>No membership purchases yet.</div>
                ) : (
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: 32 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["Date","Level","Type","Amount","Payment"].map(h => (
                            <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Amount" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {memberTxns.map((t, i) => (
                          <tr key={t.transaction_id} style={{ borderBottom: i < memberTxns.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmtShort(t.transaction_date)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.membership_level}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.transaction_type}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${Number(t.amount).toFixed(2)}</td>
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={3} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>Total</td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>${membershipTotal.toFixed(2)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Tickets
                </h3>
                {tickets.length === 0 ? (
                  <div className="ss-empty" style={{ marginBottom: 24 }}>
                    No tickets purchased yet.{" "}
                    <Link to="/tickets" style={{ color: "#c9a84c" }}>Buy tickets</Link>
                  </div>
                ) : (
<<<<<<< HEAD
                  <>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Click a row to see individual tickets.</p>
                    <div style={{ border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: 32 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            {["","Visit Date","Tickets","Types","Total"].map(h => (
                              <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Total" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", width: h === "" ? 32 : "auto" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedVisitDates.map((date, i) => {
                            const group    = groupedTickets[date];
                            const total    = group.reduce((s, t) => s + parseFloat(t.final_price || 0), 0);
                            const types    = [...new Set(group.map(t => t.ticket_type))].join(", ");
                            const expanded = !!expandedDates[date];
                            return (
                              <>
                                <tr key={date}
                                  style={{ borderBottom: expanded ? "none" : i < sortedVisitDates.length - 1 ? "1px solid #f3f4f6" : "none", background: expanded ? "#fafaf9" : "transparent", cursor: "pointer" }}
                                  onClick={() => toggleDate(date)}>
                                  <td style={{ padding: "0.625rem 0.5rem 0.625rem 1rem", color: "#9ca3af", fontSize: 11 }}>
                                    {expanded ? "▾" : "▸"}
                                  </td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151", fontWeight: 500 }}>{fmtShort(date)}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{group.length}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{types}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${total.toFixed(2)}</td>
                                </tr>
                                {expanded && group.map((t, j) => (
                                  <tr key={t.ticket_id} style={{
                                    background: "#f9fafb",
                                    borderBottom: j < group.length - 1 ? "1px solid #f0f0ee" : i < sortedVisitDates.length - 1 ? "1px solid #e5e7eb" : "none",
                                  }}>
                                    <td />
                                    <td style={{ padding: "0.5rem 1rem 0.5rem 2rem", color: "#6b7280", fontSize: 12 }}>Ticket #{t.ticket_id}</td>
                                    <td style={{ padding: "0.5rem 1rem", color: "#6b7280", fontSize: 12 }}>{t.ticket_type}</td>
                                    <td style={{ padding: "0.5rem 1rem", color: "#6b7280", fontSize: 12 }}>{t.discount_type || "None"}</td>
                                    <td style={{ padding: "0.5rem 1rem", color: "#6b7280", fontSize: 12, textAlign: "right" }}>${parseFloat(t.final_price || 0).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                            <td />
                            <td colSpan={3} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} across {sortedVisitDates.length} visit{sortedVisitDates.length !== 1 ? "s" : ""}
                            </td>
                            <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>${ticketTotal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
=======
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: 32 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          {["Purchase Date", "Visit Date","Tickets","Types","Total"].map(h => (
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
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(group[0]?.purchase_date)}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmt(date)}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{group.length}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{types}</td>
                              <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>${total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                          <td colSpan={4} style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151" }}>
                            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} across {sortedVisitDates.length} visit{sortedVisitDates.length !== 1 ? "s" : ""}
                          </td>
                          <td style={{ padding: "0.625rem 1rem", fontWeight: 600, fontSize: 12, color: "#374151", textAlign: "right" }}>${ticketTotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
>>>>>>> 3cd5b70dd75852c998b07c5381fb5b312e2ae450
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
                            <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{fmtShort(d.donation_date)}</td>
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
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Cancel confirmation modal ── */}
      {showCancelConfirm && (
        <div className="um-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="um-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Cancel Membership</h3>
              <button className="um-modal-close" onClick={() => setShowCancelConfirm(false)}>x</button>
            </div>
            <div className="um-modal-body">
              <p style={{ color: "#374151", lineHeight: 1.7, fontSize: 14 }}>
                Are you sure you want to cancel your <strong>{memberRec?.membership_level}</strong> membership?
              </p>
              <p style={{ color: "#6b7280", lineHeight: 1.7, fontSize: 13, marginTop: 8 }}>
                You will keep all your current benefits until <strong>{fmt(memberRec?.expiration_date)}</strong>.
                After that, your account will revert to a free visitor account. This can be undone before your expiry date.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="um-cancel-btn" onClick={() => setShowCancelConfirm(false)}>Keep Membership</button>
              <button onClick={handleCancelMembership} style={{ padding: "0.625rem 1.25rem", background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, borderRadius: 4 }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tier change modal ── */}
      {showTierModal && (
        <div className="um-overlay" onClick={() => setShowTierModal(false)}>
          <div className="um-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Plan Tier Change</h3>
              <button className="um-modal-close" onClick={() => setShowTierModal(false)}>x</button>
            </div>
            <div className="um-modal-body">
              <p style={{ color: "#6b7280", lineHeight: 1.7, fontSize: 13, marginBottom: 16 }}>
                Select the tier you would like at your <strong>next renewal</strong>.
                Your current <strong>{memberRec?.membership_level}</strong> benefits remain active until <strong>{fmt(memberRec?.expiration_date)}</strong>.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PURCHASABLE_TIERS.filter(t => t !== memberRec?.membership_level).map(tier => (
                  <button key={tier} onClick={() => handleTierChange(tier)} style={{
                    padding: "10px 16px", background: "#f9fafb",
                    border: "1px solid #e5e7eb", cursor: "pointer",
                    fontSize: 13, fontWeight: 500, textAlign: "left",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span>{tier}</span>
                    <span style={{ color: "#9ca3af" }}>
                      {PURCHASABLE_TIERS.indexOf(tier) < PURCHASABLE_TIERS.indexOf(memberRec?.membership_level) ? "Downgrade" : "Upgrade"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-cancel-btn" onClick={() => setShowTierModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}