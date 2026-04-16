// pages/EmployeeDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyEmployeeRecord, getMembers, getCafeTransactions,
  getGiftShopTransactions, getArtworks, getExhibitions, getVisitors,
  createMembershipTransaction,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";

const DEPT_GROUPS = {
  operations:    [1],
  collections:   [2, 3],
  guestServices: [4],
  revenue:       [5, 6],
  development:   [7],
};

function getDeptGroup(department_id) {
  const id = Number(department_id);
  for (const [group, ids] of Object.entries(DEPT_GROUPS)) {
    if (ids.includes(id)) return group;
  }
  return "operations";
}

function getTabsForGroup(group, isManager) {
  const base = [
    { id: "profile", label: "My Profile" },
    { id: "jobinfo", label: "Job Info" },
  ];
  const groupTabs = {
    operations:    [],
    collections:   [
      { id: "artworks",    label: "Artworks" },
      { id: "exhibitions", label: "Exhibitions" },
    ],
    guestServices: [{ id: "visitors",     label: "Visitor Stats" }],
    revenue:       [{ id: "transactions", label: "Transactions" }],
    development:   [
      { id: "members",   label: "Members" },
      { id: "donations", label: "Donations" },
    ],
  };
  const managerTabs = isManager ? [{ id: "staff", label: "My Team" }] : [];
  return [
    ...base,
    ...(groupTabs[group] || []),
    ...managerTabs,
    { id: "password", label: "Change Password" },
  ];
}

const fmt = dateStr => {
  if (!dateStr) return "—";
  return new Date(String(dateStr).slice(0, 10))
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const currency = val =>
  val === null || val === undefined ? "—" : `$${parseFloat(val).toFixed(2)}`;

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

function DataTable({ columns, rows, keyField }) {
  if (!rows || rows.length === 0)
    return <div className="ss-empty">No records found.</div>;
  return (
    <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding: "0.625rem 1rem", textAlign: c.right ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[keyField] ?? i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: c.right ? "right" : "left", whiteSpace: "nowrap" }}>
                  {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TIER_PRICES    = { Bronze: 75, Silver: 150, Gold: 300, Platinum: 600 };
const PAYMENT_METHODS = ["Credit Card", "Debit Card"];

function RenewalModal({ member, onClose, onSuccess, notify }) {
  const [tier,    setTier]    = useState(member.membership_level || "Bronze");
  const [payment, setPayment] = useState("Credit Card");
  const [saving,  setSaving]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const tiers = Object.keys(TIER_PRICES);
      const existingLevel = member.membership_level;
      const transaction_type = !existingLevel ? "New"
        : tier === existingLevel ? "Renewal"
        : tiers.indexOf(tier) > tiers.indexOf(existingLevel) ? "Upgrade"
        : "Renewal";

      await createMembershipTransaction({
        user_id: member.user_id, membership_level: tier,
        amount: TIER_PRICES[tier], payment_method: payment, transaction_type,
      });
      notify(`Membership ${transaction_type.toLowerCase()} processed for ${member.first_name} ${member.last_name}`);
      onSuccess();
      onClose();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Process Membership — {member.first_name} {member.last_name}</h3>
          <button className="um-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Current: <strong>{member.membership_level || "None"}</strong>
              {member.expiration_date && ` · Expires ${fmt(member.expiration_date)}`}
            </div>
            <div className="um-form-grid">
              <div className="um-form-group full">
                <label>Membership Level</label>
                <select value={tier} onChange={e => setTier(e.target.value)}>
                  {Object.entries(TIER_PRICES).map(([lvl, price]) => (
                    <option key={lvl} value={lvl}>{lvl} — ${price}/yr</option>
                  ))}
                </select>
              </div>
              <div className="um-form-group full">
                <label>Payment Method</label>
                <select value={payment} onChange={e => setPayment(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "10px 14px", fontSize: 13 }}>
              Amount: <strong>{currency(TIER_PRICES[tier])}</strong> · New expiry: <strong>1 year from today</strong>
            </div>
          </div>
          <div className="um-modal-footer">
            <button type="button" className="um-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="um-save-btn" disabled={saving}>
              {saving ? "Processing…" : "Process Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const [activeTab,     setActiveTab]     = useState("profile");
  const [profile,       setProfile]       = useState(null);
  const [empRecord,     setEmpRecord]     = useState(null);
  const [tabData,       setTabData]       = useState({});
  const [loading,       setLoading]       = useState(true);
  const [tabLoading,    setTabLoading]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [feedback,      setFeedback]      = useState(null);
  const [form,          setForm]          = useState({});
  const [pwForm,        setPwForm]        = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,      setPwErrors]      = useState({});
  const [renewalMember, setRenewalMember] = useState(null);

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, emp] = await Promise.allSettled([
          getMyProfile(), getMyEmployeeRecord(),
        ]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (emp.status  === "fulfilled") setEmpRecord(emp.value?.user_id ? emp.value : null);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const deptGroup = getDeptGroup(empRecord?.department_id);
  const isManager = !!empRecord?.is_manager;
  const tabs      = getTabsForGroup(deptGroup, isManager);
  // Show department name from join, fall back to ID if name not available
  const deptName  = empRecord?.department_name || `Department ${empRecord?.department_id || ""}`;

  useEffect(() => {
    if (!empRecord) return;
    if (["profile","jobinfo","password"].includes(activeTab)) return;
    if (tabData[activeTab] !== undefined) return;

    async function loadTab() {
      setTabLoading(true);
      try {
        let data;
        switch (activeTab) {
          case "artworks":     data = await getArtworks();        break;
          case "exhibitions":  data = await getExhibitions();     break;
          case "visitors":     data = await getVisitors();        break;
          case "members":      data = await getMembers();         break;
          case "transactions": {
            const [cafe, shop] = await Promise.all([getCafeTransactions(), getGiftShopTransactions()]);
            data = { cafe: Array.isArray(cafe) ? cafe : [], shop: Array.isArray(shop) ? shop : [] };
            break;
          }
          case "donations": {
            const r = await fetch(`${API_BASE}/donations`, { headers: authHeader() });
            data = r.ok ? await r.json() : [];
            break;
          }
          case "staff": {
            const r = await fetch(`${API_BASE}/employees`, { headers: authHeader() });
            const all = r.ok ? await r.json() : [];
            data = all.filter(e => Number(e.department_id) === Number(empRecord.department_id));
            break;
          }
          default: data = [];
        }
        setTabData(prev => ({ ...prev, [activeTab]: data }));
      } catch (e) { notify(`Failed to load data: ${e.message}`, "error"); }
      finally { setTabLoading(false); }
    }
    loadTab();
  }, [activeTab, empRecord]);

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

  const d = tabData[activeTab];

  const renderContent = () => {
    if (tabLoading) return <div className="ss-loading">Loading…</div>;

    switch (activeTab) {
      case "profile":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Profile</h2>
            <form className="ss-form" onSubmit={handleProfileSave}>
              <div className="ss-form-grid">
                <div className="ss-form-group"><label>First Name *</label>
                  <input name="first_name" value={form.first_name || ""} onChange={handleFormChange} maxLength={50} /></div>
                <div className="ss-form-group"><label>Last Name *</label>
                  <input name="last_name" value={form.last_name || ""} onChange={handleFormChange} maxLength={50} /></div>
                <div className="ss-form-group full"><label>Email *</label>
                  <input name="email" type="email" value={form.email || ""} onChange={handleFormChange} maxLength={255} /></div>
                <div className="ss-form-group"><label>Phone Number *</label>
                  <PhoneInput name="phone_number" value={form.phone_number || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>Date of Birth</label>
                  <input name="date_of_birth" type="date" value={form.date_of_birth?.slice(0, 10) || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group full"><label>Street Address * <span style={{ fontSize: 10, color: "#9ca3af" }}>(max 50 chars)</span></label>
                  <input name="street_address" value={form.street_address || ""} onChange={handleFormChange} maxLength={50} /></div>
                <div className="ss-form-group"><label>City * <span style={{ fontSize: 10, color: "#9ca3af" }}>(max 30 chars)</span></label>
                  <input name="city" value={form.city || ""} onChange={handleFormChange} maxLength={30} /></div>
                <div className="ss-form-group"><label>State *</label>
                  <StateSelect name="state" value={form.state || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>Zip Code *</label>
                  <ZipInput name="zip_code" value={form.zip_code || ""} onChange={handleFormChange} /></div>
              </div>
              <div className="ss-form-actions">
                <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        );

      case "jobinfo":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Job Information</h2>
            {empRecord ? (
              <>
                {isManager && (
                  <div style={{ display: "inline-block", padding: "4px 14px", marginBottom: 24, background: "#1e3a5f", color: "#a8d4f0", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #4a7fa5" }}>
                    Manager
                  </div>
                )}
                <div className="ss-stat-grid">
                  {/* Show department NAME not number */}
                  <div className="ss-stat">
                    <span className="ss-stat-value" style={{ fontSize: 16 }}>{deptName}</span>
                    <span className="ss-stat-label">Department</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value" style={{ fontSize: 16 }}>{empRecord.job_title || "—"}</span>
                    <span className="ss-stat-label">Job Title</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value" style={{ fontSize: 16 }}>{empRecord.employment_type || "—"}</span>
                    <span className="ss-stat-label">Employment Type</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value" style={{ fontSize: 16 }}>{fmt(empRecord.hire_date)}</span>
                    <span className="ss-stat-label">Hire Date</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value" style={{ fontSize: 16 }}>{currency(empRecord.salary)}</span>
                    <span className="ss-stat-label">Annual Salary</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="ss-empty">No employee record found. Contact your admin.</div>
            )}
          </div>
        );

      case "artworks":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Artworks</h2>
            <DataTable keyField="artwork_id" rows={Array.isArray(d) ? d : []} columns={[
              { key: "artwork_id",             label: "ID" },
              { key: "title",                  label: "Title" },
              { key: "medium",                 label: "Medium" },
              { key: "creation_year",          label: "Year" },
              { key: "current_display_status", label: "Status" },
              { key: "insurance_value",        label: "Value", right: true, render: currency },
            ]} />
          </div>
        );

      case "exhibitions":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Exhibitions</h2>
            <DataTable keyField="exhibition_id" rows={Array.isArray(d) ? d : []} columns={[
              { key: "exhibition_id",   label: "ID" },
              { key: "exhibition_name", label: "Name" },
              { key: "exhibition_type", label: "Type" },
              { key: "start_date",      label: "Start", render: fmt },
              { key: "end_date",        label: "End",   render: fmt },
            ]} />
          </div>
        );

      case "visitors": {
        const list  = Array.isArray(d) ? d : [];
        const total = list.reduce((s, v) => s + Number(v.total_visits || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Visitor Stats</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{list.length}</span><span className="ss-stat-label">Registered Visitors</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{total}</span><span className="ss-stat-label">Total Visits Recorded</span></div>
            </div>
            {isManager ? (
              <DataTable keyField="user_id" rows={list} columns={[
                { key: "user_id",         label: "ID" },
                { key: "first_name",      label: "First Name" },
                { key: "last_name",       label: "Last Name" },
                { key: "total_visits",    label: "Visits",     right: true },
                { key: "last_visit_date", label: "Last Visit", render: fmt },
              ]} />
            ) : (
              <p style={{ fontSize: 13, color: "#6b7280" }}>Detailed visitor records are visible to managers only.</p>
            )}
          </div>
        );
      }

      case "transactions": {
        const cafe      = d?.cafe || [];
        const shop      = d?.shop || [];
        const cafeTotal = cafe.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
        const shopTotal = shop.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Transactions</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 32 }}>
              <div className="ss-stat"><span className="ss-stat-value">{cafe.length}</span><span className="ss-stat-label">Cafe Orders</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(cafeTotal)}</span><span className="ss-stat-label">Cafe Revenue</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{shop.length}</span><span className="ss-stat-label">Shop Orders</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(shopTotal)}</span><span className="ss-stat-label">Shop Revenue</span></div>
            </div>
            {isManager ? (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Cafe</h3>
                <DataTable keyField="cafe_transaction_id" rows={cafe.slice(0, 50)} columns={[
                  { key: "cafe_transaction_id", label: "ID" },
                  { key: "user_id",              label: "User" },
                  { key: "transaction_datetime", label: "Date",   render: v => fmt(v?.slice(0, 10)) },
                  { key: "total_amount",         label: "Amount", right: true, render: currency },
                  { key: "payment_method",       label: "Payment" },
                ]} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 12px" }}>Gift Shop</h3>
                <DataTable keyField="transaction_id" rows={shop.slice(0, 50)} columns={[
                  { key: "transaction_id",       label: "ID" },
                  { key: "user_id",              label: "User" },
                  { key: "transaction_datetime", label: "Date",   render: v => fmt(v?.slice(0, 10)) },
                  { key: "total_amount",         label: "Amount", right: true, render: currency },
                  { key: "payment_method",       label: "Payment" },
                ]} />
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#6b7280" }}>Detailed records are visible to managers only.</p>
            )}
          </div>
        );
      }

      case "members": {
        const list   = Array.isArray(d) ? d : [];
        const active = list.filter(m => m.expiration_date && new Date(String(m.expiration_date).slice(0, 10)) > new Date()).length;
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Members</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{list.length}</span><span className="ss-stat-label">Total Members</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{active}</span><span className="ss-stat-label">Active Members</span></div>
            </div>
            <DataTable keyField="user_id" rows={list} columns={[
              { key: "user_id",          label: "ID" },
              { key: "first_name",       label: "First Name" },
              { key: "last_name",        label: "Last Name" },
              { key: "membership_level", label: "Level" },
              { key: "join_date",        label: "Joined",  render: fmt },
              { key: "expiration_date",  label: "Expires", render: fmt },
              {
                key: "_action", label: "Action",
                render: (_, row) => (
                  <button onClick={() => setRenewalMember(row)}
                    style={{ padding: "4px 12px", background: "#c9a84c", color: "#000", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                    Process
                  </button>
                )
              },
            ]} />
          </div>
        );
      }

      case "donations": {
        const list  = Array.isArray(d) ? d : [];
        const total = list.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Donations</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{list.length}</span><span className="ss-stat-label">Total Donations</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(total)}</span><span className="ss-stat-label">Total Amount</span></div>
            </div>
            {isManager ? (
              <DataTable keyField="donation_id" rows={list} columns={[
                { key: "donation_id",   label: "ID" },
                { key: "user_id",       label: "User" },
                { key: "donation_date", label: "Date",   render: fmt },
                { key: "donation_type", label: "Type" },
                { key: "amount",        label: "Amount", right: true, render: currency },
              ]} />
            ) : (
              <p style={{ fontSize: 13, color: "#6b7280" }}>Detailed donation records are visible to managers only.</p>
            )}
          </div>
        );
      }

      case "staff":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Team — {deptName}</h2>
            <DataTable keyField="user_id" rows={Array.isArray(d) ? d : []} columns={[
              { key: "user_id",         label: "ID" },
              { key: "first_name",      label: "First Name" },
              { key: "last_name",       label: "Last Name" },
              { key: "job_title",       label: "Job Title" },
              { key: "employment_type", label: "Type" },
              { key: "hire_date",       label: "Hired",   render: fmt },
              { key: "is_manager",      label: "Manager", render: v => v ? "✓" : "" },
            ]} />
          </div>
        );

      case "password":
        return (
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
        );

      default: return null;
    }
  };

  return (
    <div className="dashboard-page employee-dashboard">
      <div className="dashboard-hero employee-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge employee-badge">
            {isManager ? "Manager" : "Employee"}
          </span>
          {/* FIX: use white color explicitly so name is visible on dark hero */}
          <h1 style={{ color: "#fff" }}>
            {loading ? "Staff Portal" : `Welcome, ${profile?.first_name || "Staff"}`}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>
            {deptName}{empRecord?.job_title ? ` — ${empRecord.job_title}` : ""}
          </p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">← Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        {loading ? <div className="ss-loading">Loading your information…</div> : (
          <>
            <div className="ss-tabs">
              {tabs.map(t => (
                <button key={t.id} className={`ss-tab ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
            {feedback && <div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}
            {renderContent()}
          </>
        )}
      </div>

      {renewalMember && (
        <RenewalModal
          member={renewalMember}
          notify={notify}
          onClose={() => setRenewalMember(null)}
          onSuccess={() => {
            setTabData(prev => ({ ...prev, members: undefined }));
            setActiveTab("profile");
            setTimeout(() => setActiveTab("members"), 100);
          }}
        />
      )}
    </div>
  );
}