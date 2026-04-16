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

const TABS = [
  { id: "profile", label: "My Profile"         },
  { id: "membership", label: "Membership"      },
  { id: "visits", label: "Visit History"       },
  { id: "purchases", label: "Purchase History" },
  { id: "password", label: "Change Password"   },
];

const LEVEL_COLORS = {
  Bronze: { bg: "#fdf2e9", color: "#a04000", border: "#f0a070" },
  Silver: { bg: "#f2f3f4", color: "#566573", border: "#aab7b8" },
  Gold: { bg: "#fef9e7", color: "#9a7d0a", border: "#f4d03f" },
  Platinum: { bg: "#eaf4fb", color: "#1a5276", border: "#7fb3d3" },
  Benefactor: { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc" },
  "Leadership Circle": { bg: "#fff1f2", color: "#9f1239", border: "#fb7185" },
};
const DEFAULT_STYLE = { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
const DONATION_TIERS = ["Benefactor", "Leadership Circle"];

const fmt = dateStr => {
  if (!dateStr) return "—";
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default function MemberDashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("user_email") || "";
  const displayName = userEmail.split("@")[0];

  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [visitorRec, setVisitorRec] = useState(null);
  const [memberRec, setMemberRec] = useState(null);
  const [memberTxns, setMemberTxns] = useState([]);
  const [tickets,   setTickets]   = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors] = useState({});

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, vis, mem, txns, tix, don] = await Promise.allSettled([
          getMyProfile(), getMyVisitorRecord(),
          getMyMemberRecord(), getMyMembershipTransactions(),
          getMyTickets(), getMyDonations(),
        ]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (vis.status === "fulfilled") setVisitorRec(vis.value);
        if (mem.status === "fulfilled") setMemberRec(mem.value?.user_id ? mem.value : null);
        if (txns.status === "fulfilled") setMemberTxns(Array.isArray(txns.value) ? txns.value : []);
        if (tix.status  === "fulfilled") setTickets(Array.isArray(tix.value) ? tix.value : []);
        if (don.status  === "fulfilled") setDonations(Array.isArray(don.value) ? don.value : []);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
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
    setSaving(true);
    try {
      await updateMyProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number,
        street_address: form.street_address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
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

  const daysUntilExpiry = memberRec?.expiration_date
    ? Math.ceil((new Date(memberRec.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const levelStyle = LEVEL_COLORS[memberRec?.membership_level] || DEFAULT_STYLE;
  const isDonationTier = DONATION_TIERS.includes(memberRec?.membership_level);

  return (
    <div className="dashboard-page member-dashboard">
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
                        readOnly />
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

            {/* ── MEMBERSHIP TAB ── */}
            {activeTab === "membership" && (
              <div className="ss-card">
                <h2 className="ss-section-title">Membership Details</h2>
                {memberRec ? (
                  <>
                    <div className="ss-membership-badge" style={{
                      background: levelStyle.bg, color: levelStyle.color,
                      border: `1px solid ${levelStyle.border}`,
                    }}>
                      {memberRec.membership_level} Member
                    </div>
                    <div className="ss-stat-grid" style={{ marginTop: 24 }}>
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
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : "Expired"}
                          </span>
                          <span className="ss-stat-label">Until Expiry</span>
                        </div>
                      )}
                      <div className="ss-stat">
                        <span className="ss-stat-value">{visitorRec?.total_visits ?? 0}</span>
                        <span className="ss-stat-label">Total Visits</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                      {isDonationTier ? (
                        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                          Your <strong>{memberRec.membership_level}</strong> status was earned through your generous donations.{" "}
                          <Link to="/donations" style={{ color: "#c9a84c" }}>Make a donation</Link>
                        </p>
                      ) : (
                        <Link to="/membership" style={{
                          display: "inline-block", padding: "0.625rem 1.5rem",
                          background: "#c9a84c", color: "#000", fontSize: 13,
                          fontWeight: 500, textTransform: "uppercase",
                          letterSpacing: "0.06em", textDecoration: "none",
                        }}>
                          {daysUntilExpiry !== null && daysUntilExpiry <= 60 ? "Renew Membership" : "Upgrade or Renew"}
                        </Link>
                      )}
                    </div>
                    {memberTxns.length > 0 && (
                      <div style={{ marginTop: 32 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Membership History
                        </h3>
                        <div style={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {["Date", "Level", "Type", "Amount"].map(h => (
                                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: h === "Amount" ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {memberTxns.map((t, i) => (
                                <tr key={t.transaction_id} style={{ borderBottom: i < memberTxns.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>
                                    {new Date(t.transaction_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  </td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.membership_level}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151" }}>{t.transaction_type}</td>
                                  <td style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: "right" }}>
                                    ${Number(t.amount).toFixed(2)}
                                  </td>
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
                      <span className="ss-stat-value">{fmt(visitorRec.last_visit_date)}</span>
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