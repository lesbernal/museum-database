// pages/EmployeeDashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  getMyEmployeeRecord, getMembers, getCafeTransactions,
  getGiftShopTransactions, getArtworks, getExhibitions,
  getEvents, getArtists, getProvenance, getDonations,
  getVisitors, getTickets, getGalleries,
  createMembershipTransaction,
  createArtist, updateArtist,
  createArtwork, updateArtwork,
  createProvenance, updateProvenance,
  createExhibition, updateExhibition,
  createEvent, updateEvent,
  updateCafeItem, createCafeItem,
  updateGiftShopItem, createGiftShopItem,
  updateUser, deleteMember, updateMember,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";
import "../styles/EmployeeDashboard.css";

// ── Department permissions ─────────────────────────────────────────────────────
const DEPT_PERMISSIONS = {
  1: { name: "Administration",         tabs: ['profile','jobinfo','artists','artwork','provenance','exhibitions','galleries','events','cafe','giftshop','members','transactions','visitors','donations','reports','password'], canEdit: ['artists','artwork','provenance','exhibitions','galleries','events','cafe','giftshop','members'], canViewTeam: true, canViewReports: true },
  2: { name: "Curatorial & Collections", tabs: ['profile','jobinfo','artists','artwork','provenance','exhibitions','password'], canEdit: ['artists','artwork','provenance','exhibitions'], canViewTeam: false },
  3: { name: "Exhibitions & Galleries", tabs: ['profile','jobinfo','exhibitions','galleries','events','password'], canEdit: ['exhibitions','galleries','events'], canViewTeam: false },
  4: { name: "Visitor Services",        tabs: ['profile','jobinfo','visitors','tickets','events','password'], canEdit: ['events'], canViewTeam: true },
  5: { name: "Retail",                  tabs: ['profile','jobinfo','giftshop','transactions','password'], canEdit: ['giftshop'], canViewTeam: false },
  6: { name: "Cafe & Hospitality",      tabs: ['profile','jobinfo','cafe','transactions','password'], canEdit: ['cafe'], canViewTeam: false },
  7: { name: "Development & Membership",tabs: ['profile','jobinfo','members','donations','transactions','password'], canEdit: ['members'], canViewTeam: true, canManageMemberships: true },
};

// ── Timezone-safe date formatter ───────────────────────────────────────────────
const fmt = dateStr => {
  if (!dateStr) return "—";
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const currency = val => val === null || val === undefined ? "—" : `$${parseFloat(val).toFixed(2)}`;

// ── Reusable table ─────────────────────────────────────────────────────────────
function DataTable({ columns, rows, keyField, onEdit, canEdit = false }) {
  if (!rows || rows.length === 0) return <div className="ss-empty">No records found.</div>;
  return (
    <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding: "0.625rem 1rem", textAlign: c.right ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {c.label}
              </th>
            ))}
            {canEdit && <th style={{ padding: "0.625rem 1rem", width: 80 }}>Edit</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[keyField] ?? i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: "0.625rem 1rem", color: "#374151", textAlign: c.right ? "right" : "left" }}>
                  {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
                </td>
              ))}
              {canEdit && (
                <td style={{ padding: "0.625rem 1rem" }}>
                  <button onClick={() => onEdit(r)} className="emp-edit-btn">Edit</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────────
function EditModal({ isOpen, item, fields, onSave, onClose }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (item) setForm(item); }, [item]);
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Edit {item?.title || item?.item_name || item?.exhibition_name || item?.event_name || "Record"}</h3>
          <button className="um-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <div className="um-form-grid">
              {fields.map(f => (
                <div key={f.key} className={`um-form-group ${f.full ? "full" : ""}`}>
                  <label>{f.label}{f.required && " *"}</label>
                  {f.type === "select" ? (
                    <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                      <option value="">Select...</option>
                      {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} />
                  ) : (
                    <input type={f.type || "text"} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="um-modal-footer">
            <button type="button" className="um-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="um-save-btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Membership Action Modal ────────────────────────────────────────────────────
const TIER_ORDER  = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const TIER_PRICES = { Bronze: 75, Silver: 150, Gold: 300, Platinum: 600 };

function MembershipActionModal({ isOpen, member, onClose, onSuccess, notify }) {
  const [action,      setAction]      = useState('renew');
  const [selectedTier, setSelectedTier] = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      setSelectedTier(member.membership_level || 'Bronze');
      setAction('renew');
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const currentLevel = member.membership_level;
  const currentIdx   = TIER_ORDER.indexOf(currentLevel);

  const availableTiers = () => {
    if (action === 'upgrade')   return TIER_ORDER.slice(currentIdx + 1);
    if (action === 'downgrade') return TIER_ORDER.slice(0, currentIdx);
    if (action === 'renew')     return [currentLevel];
    return TIER_ORDER;
  };

  const tiers     = availableTiers();
  const canProceed = action === 'cancel' || (selectedTier && tiers.includes(selectedTier));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (action === 'cancel') {
        if (!confirm(`Cancel ${member.first_name} ${member.last_name}'s membership?`)) {
          setLoading(false); return;
        }
        await updateMember(member.user_id, {
          ...member,
          expiration_date: new Date().toISOString().slice(0, 10),
        });
        await updateUser(member.user_id, { role: 'visitor' });
        await createMembershipTransaction({
          user_id: member.user_id,
          membership_level: currentLevel,
          amount: 0,
          payment_method: "Admin Processed",
          transaction_type: 'Cancellation',
        });
        notify(`Membership cancelled for ${member.first_name} ${member.last_name}`);
        onSuccess(); onClose();
        return;
      }

      const type = action === 'upgrade' ? 'Upgrade' : action === 'downgrade' ? 'Downgrade' : 'Renewal';
      if (!confirm(`${type}: ${member.first_name} ${member.last_name}\nTier: ${selectedTier}\nAmount: $${TIER_PRICES[selectedTier]}\n\nContinue?`)) {
        setLoading(false); return;
      }
      await createMembershipTransaction({
        user_id: member.user_id,
        membership_level: selectedTier,
        amount: TIER_PRICES[selectedTier],
        payment_method: "Admin Processed",
        transaction_type: type,
      });
      notify(`${type} processed for ${member.first_name} ${member.last_name}`);
      onSuccess(); onClose();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Manage — {member.first_name} {member.last_name}</h3>
          <button className="um-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="um-modal-body">
          <div className="um-form-grid">
            <div className="um-form-group full">
              <label>Current Level</label>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f3e8ff', color: '#6b21a8', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                {currentLevel || 'None'}
              </div>
              {member.expiration_date && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Expires: {fmt(member.expiration_date)}
                </div>
              )}
            </div>
            <div className="um-form-group full">
              <label>Action</label>
              <select value={action} onChange={e => setAction(e.target.value)}>
                <option value="renew">Renew Membership</option>
                {currentIdx < TIER_ORDER.length - 1 && <option value="upgrade">Upgrade Membership</option>}
                {currentIdx > 0 && <option value="downgrade">Downgrade Membership</option>}
                <option value="cancel">Cancel Membership</option>
              </select>
            </div>
            {action !== 'cancel' && (
              <div className="um-form-group full">
                <label>Tier</label>
                <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} disabled={action === 'renew'}>
                  {tiers.map(t => (
                    <option key={t} value={t}>{t} — ${TIER_PRICES[t]}/year</option>
                  ))}
                </select>
              </div>
            )}
            {action === 'cancel' && (
              <div className="um-form-group full">
                <div style={{ padding: 12, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#991b1b' }}>
                  ⚠️ This will expire the membership today. The user will become a visitor.
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="um-modal-footer">
          <button type="button" className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="um-save-btn" onClick={handleSubmit} disabled={!canProceed || loading}>
            {loading ? 'Processing...' : action === 'cancel' ? 'Cancel Membership' : action === 'upgrade' ? 'Upgrade' : action === 'downgrade' ? 'Downgrade' : 'Renew'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const [profile,      setProfile]      = useState(null);
  const [empRecord,    setEmpRecord]     = useState(null);
  const [activeTab,    setActiveTab]     = useState("profile");
  const [loading,      setLoading]       = useState(true);
  const [saving,       setSaving]        = useState(false);
  const [feedback,     setFeedback]      = useState(null);
  const [form,         setForm]          = useState({});
  const [pwForm,       setPwForm]        = useState({ new_password: "", confirm_password: "" });
  const [pwErrors,     setPwErrors]      = useState({});
  const [teamMembers,  setTeamMembers]   = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingItem,  setEditingItem]   = useState(null);
  const [editType,     setEditType]      = useState(null);

  // Data
  const [artists,        setArtists]        = useState([]);
  const [artworks,       setArtworks]       = useState([]);
  const [provenance,     setProvenance]     = useState([]);
  const [exhibitions,    setExhibitions]    = useState([]);
  const [galleries,      setGalleries]      = useState([]);
  const [events,         setEvents]         = useState([]);
  const [members,        setMembers]        = useState([]);
  const [cafeTransactions, setCafeTransactions] = useState([]);
  const [giftTransactions,  setGiftTransactions] = useState([]);
  const [donations,      setDonations]      = useState([]);
  const [visitors,       setVisitors]       = useState([]);
  const [tickets,        setTickets]        = useState([]);

  const deptId      = empRecord?.department_id;
  const permissions = DEPT_PERMISSIONS[deptId] || DEPT_PERMISSIONS[4];
  const isManager   = !!empRecord?.is_manager;
  const canEdit     = tab => permissions.canEdit?.includes(tab) || false;

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshMembers = async () => {
    const data = await getMembers();
    setMembers(data);
  };

  // ── Load profile + employee record ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, emp] = await Promise.allSettled([getMyProfile(), getMyEmployeeRecord()]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (emp.status  === "fulfilled") setEmpRecord(emp.value?.user_id ? emp.value : null);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // ── Load team if manager ────────────────────────────────────────────────────
  useEffect(() => {
    if (!empRecord || !isManager) return;
    fetch(`${API_BASE}/employees`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then(all => setTeamMembers(all.filter(e => Number(e.department_id) === Number(empRecord.department_id))))
      .catch(() => {});
  }, [empRecord, isManager]);

  // ── Load department data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!empRecord) return;
    async function loadData() {
      try {
        if (permissions.tabs.includes('artists'))      setArtists(await getArtists());
        if (permissions.tabs.includes('artwork'))      setArtworks(await getArtworks());
        if (permissions.tabs.includes('provenance'))   setProvenance(await getProvenance());
        if (permissions.tabs.includes('exhibitions'))  setExhibitions(await getExhibitions());
        if (permissions.tabs.includes('galleries'))    setGalleries(await getGalleries());
        if (permissions.tabs.includes('events'))       setEvents(await getEvents());
        if (permissions.tabs.includes('members'))      setMembers(await getMembers());
        if (permissions.tabs.includes('donations'))    setDonations(await getDonations());
        if (permissions.tabs.includes('visitors'))     setVisitors(await getVisitors());
        if (permissions.tabs.includes('tickets'))      setTickets(await getTickets());
        if (permissions.tabs.includes('transactions')) {
          const [cafe, shop] = await Promise.all([getCafeTransactions(), getGiftShopTransactions()]);
          setCafeTransactions(cafe);
          setGiftTransactions(shop);
        }
      } catch (err) { console.error("Failed to load data:", err); }
    }
    loadData();
  }, [empRecord]);

  function handleLogout() {
    ["token","role","user_id","user_email"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        first_name:     form.first_name?.trim(),
        last_name:      form.last_name?.trim(),
        email:          form.email?.trim(),
        phone_number:   form.phone_number,
        street_address: form.street_address?.trim(),
        city:           form.city?.trim(),
        state:          form.state,
        zip_code:       form.zip_code?.trim(),
        date_of_birth:  form.date_of_birth?.slice(0, 10),
      });
      notify("Profile updated successfully");
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.new_password.length < 6) { setPwErrors({ new_password: "Min. 6 characters" }); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwErrors({ confirm_password: "Passwords do not match" }); return; }
    setPwErrors({});
    setSaving(true);
    try {
      await changeMyPassword(pwForm.new_password);
      notify("Password changed successfully");
      setPwForm({ new_password: "", confirm_password: "" });
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  const handleEdit = (item, type) => { setEditingItem(item); setEditType(type); };

  const handleSaveEdit = async (updated) => {
    switch (editType) {
      case 'artist':     await updateArtist(updated.artist_id, updated);       setArtists(await getArtists()); break;
      case 'artwork':    await updateArtwork(updated.artwork_id, updated);      setArtworks(await getArtworks()); break;
      case 'provenance': await updateProvenance(updated.provenance_id, updated);setProvenance(await getProvenance()); break;
      case 'exhibition': await updateExhibition(updated.exhibition_id, updated);setExhibitions(await getExhibitions()); break;
      case 'gallery':    await updateGallery(updated.gallery_id, updated);      setGalleries(await getGalleries()); break;
      case 'event':      await updateEvent(updated.event_id, updated);          setEvents(await getEvents()); break;
      case 'cafeItem':   await updateCafeItem(updated.item_id, updated); break;
      case 'giftItem':   await updateGiftShopItem(updated.item_id, updated); break;
    }
    notify("Record updated successfully");
  };

  const getEditFields = type => ({
    artist:     [{ key:"first_name",label:"First Name",required:true},{key:"last_name",label:"Last Name",required:true},{key:"birth_year",label:"Birth Year",type:"number"},{key:"death_year",label:"Death Year",type:"number"},{key:"nationality",label:"Nationality"},{key:"biography",label:"Biography",type:"textarea",full:true}],
    artwork:    [{ key:"title",label:"Title",required:true,full:true},{key:"creation_year",label:"Year",type:"number"},{key:"medium",label:"Medium"},{key:"dimensions",label:"Dimensions"},{key:"current_display_status",label:"Status",type:"select",options:["On Display","In Storage","On Loan","Under Restoration"]}],
    exhibition: [{ key:"exhibition_name",label:"Name",required:true,full:true},{key:"exhibition_type",label:"Type",type:"select",options:["Permanent","Temporary","Traveling"]},{key:"start_date",label:"Start Date",type:"date"},{key:"end_date",label:"End Date",type:"date"}],
    gallery:    [{ key:"gallery_name",label:"Name",required:true,full:true},{key:"floor_number",label:"Floor",type:"number"},{key:"square_footage",label:"Sq Footage",type:"number"},{key:"climate_controlled",label:"Climate Controlled",type:"select",options:["0","1"]}],
    event:      [{ key:"event_name",label:"Name",required:true,full:true},{key:"description",label:"Description",type:"textarea",full:true},{key:"event_date",label:"Date",type:"date"},{key:"capacity",label:"Capacity",type:"number"},{key:"member_only",label:"Members Only",type:"select",options:["0","1"]}],
    cafeItem:   [{ key:"item_name",label:"Item Name",required:true,full:true},{key:"category",label:"Category"},{key:"price",label:"Price",type:"number"},{key:"stock_quantity",label:"Stock",type:"number"}],
    giftItem:   [{ key:"item_name",label:"Item Name",required:true,full:true},{key:"category",label:"Category"},{key:"price",label:"Price",type:"number"},{key:"stock_quantity",label:"Stock",type:"number"}],
  }[type] || []);

  // ── Tab content ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      case "profile":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Profile</h2>
            <form className="ss-form" onSubmit={handleProfileSave}>
              <div className="ss-form-grid">
                <div className="ss-form-group"><label>First Name *</label><input name="first_name" value={form.first_name||""} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Last Name *</label><input name="last_name" value={form.last_name||""} onChange={e=>setForm(p=>({...p,last_name:e.target.value}))} /></div>
                <div className="ss-form-group full"><label>Email *</label><input name="email" type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Phone *</label><PhoneInput name="phone_number" value={form.phone_number||""} onChange={e=>setForm(p=>({...p,phone_number:e.target.value}))} /></div>
                <div className="ss-form-group">
                  <label>Date of Birth</label>
                  <input name="date_of_birth" type="date" value={form.date_of_birth?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,date_of_birth:e.target.value}))} disabled={!!profile?.date_of_birth} />
                  {profile?.date_of_birth && <span style={{fontSize:"0.75rem",color:"#9ca3af"}}>Cannot be changed after being set.</span>}
                </div>
                <div className="ss-form-group full"><label>Street Address</label><input name="street_address" value={form.street_address||""} onChange={e=>setForm(p=>({...p,street_address:e.target.value}))} /></div>
                <div className="ss-form-group"><label>City</label><input name="city" value={form.city||""} onChange={e=>setForm(p=>({...p,city:e.target.value}))} /></div>
                <div className="ss-form-group"><label>State</label><StateSelect name="state" value={form.state||""} onChange={e=>setForm(p=>({...p,state:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Zip</label><ZipInput name="zip_code" value={form.zip_code||""} onChange={e=>setForm(p=>({...p,zip_code:e.target.value}))} /></div>
              </div>
              <div className="ss-form-actions">
                <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>{saving?"Saving…":"Save Changes"}</button>
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
                {isManager && <div className="emp-manager-badge">Department Manager</div>}
                <div className="ss-stat-grid">
                  <div className="ss-stat"><span className="ss-stat-value">{permissions.name}</span><span className="ss-stat-label">Department</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{empRecord.job_title||"—"}</span><span className="ss-stat-label">Job Title</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{empRecord.employment_type||"—"}</span><span className="ss-stat-label">Type</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{fmt(empRecord.hire_date)}</span><span className="ss-stat-label">Hire Date</span></div>
                </div>
              </>
            ) : <div className="ss-empty">No employee record found.</div>}
          </div>
        );

      case "artists":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Artists</h2>
            <DataTable keyField="artist_id" rows={artists} canEdit={canEdit('artists')} onEdit={r=>handleEdit(r,'artist')}
              columns={[{key:"artist_id",label:"ID"},{key:"first_name",label:"First Name"},{key:"last_name",label:"Last Name"},{key:"nationality",label:"Nationality"},{key:"birth_year",label:"Born"}]} />
          </div>
        );

      case "artwork":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Artworks</h2>
            <DataTable keyField="artwork_id" rows={artworks} canEdit={canEdit('artwork')} onEdit={r=>handleEdit(r,'artwork')}
              columns={[{key:"artwork_id",label:"ID"},{key:"title",label:"Title"},{key:"medium",label:"Medium"},{key:"creation_year",label:"Year"},{key:"current_display_status",label:"Status"}]} />
          </div>
        );

      case "exhibitions":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Exhibitions</h2>
            <DataTable keyField="exhibition_id" rows={exhibitions} canEdit={canEdit('exhibitions')} onEdit={r=>handleEdit(r,'exhibition')}
              columns={[{key:"exhibition_id",label:"ID"},{key:"exhibition_name",label:"Name"},{key:"exhibition_type",label:"Type"},{key:"start_date",label:"Start",render:fmt},{key:"end_date",label:"End",render:fmt}]} />
          </div>
        );

      case "galleries":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Galleries</h2>
            <DataTable keyField="gallery_id" rows={galleries} canEdit={canEdit('galleries')} onEdit={r=>handleEdit(r,'gallery')}
              columns={[{key:"gallery_id",label:"ID"},{key:"gallery_name",label:"Name"},{key:"floor_number",label:"Floor"},{key:"square_footage",label:"Sq Ft"}]} />
          </div>
        );

      case "events":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Events</h2>
            <DataTable keyField="event_id" rows={events} canEdit={canEdit('events')} onEdit={r=>handleEdit(r,'event')}
              columns={[{key:"event_id",label:"ID"},{key:"event_name",label:"Name"},{key:"event_date",label:"Date",render:fmt},{key:"capacity",label:"Capacity"}]} />
          </div>
        );

      case "members": {
        const active  = members.filter(m => m.expiration_date && new Date(String(m.expiration_date).slice(0,10)+"T00:00:00") > new Date()).length;
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Member Management</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{members.length}</span><span className="ss-stat-label">Total Members</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{active}</span><span className="ss-stat-label">Active</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{members.length - active}</span><span className="ss-stat-label">Expired</span></div>
            </div>
            {/* No "Action" column — removed per request. Management via Manage button only */}
            <DataTable keyField="user_id" rows={members}
              columns={[
                {key:"user_id",label:"ID"},
                {key:"first_name",label:"First Name"},
                {key:"last_name",label:"Last Name"},
                {key:"email",label:"Email"},
                {key:"membership_level",label:"Level"},
                {key:"join_date",label:"Joined",render:fmt},
                {key:"expiration_date",label:"Expires",render:fmt},
                {key:"_manage",label:"",render:(_,member)=>(
                  <button className="member-manage-btn" onClick={()=>{setSelectedMember(member);setActionModalOpen(true);}}>
                    Manage
                  </button>
                )},
              ]}
            />
          </div>
        );
      }

      case "donations": {
        const total = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Donations</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{donations.length}</span><span className="ss-stat-label">Total Donations</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(total)}</span><span className="ss-stat-label">Total Amount</span></div>
            </div>
            {/* Show donor name instead of user_id */}
            <DataTable keyField="donation_id" rows={donations}
              columns={[
                {key:"donation_id",label:"ID"},
                // Show donor name if joined, otherwise fallback
                {key:"first_name",label:"Donor",render:(_,d)=>
                  d.first_name
                    ? `${d.first_name} ${d.last_name}`
                    : `User #${d.user_id}`
                },
                {key:"email",label:"Email",render:(_,d)=>d.email||"—"},
                {key:"donation_date",label:"Date",render:fmt},
                {key:"donation_type",label:"Type"},
                {key:"amount",label:"Amount",right:true,render:v=>currency(v)},
              ]}
            />
          </div>
        );
      }

      case "transactions": {
        const cafeTotal = cafeTransactions.reduce((s,t)=>s+parseFloat(t.total_amount||0),0);
        const giftTotal = giftTransactions.reduce((s,t)=>s+parseFloat(t.total_amount||0),0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Transactions</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{cafeTransactions.length}</span><span className="ss-stat-label">Cafe Orders</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(cafeTotal)}</span><span className="ss-stat-label">Cafe Revenue</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{giftTransactions.length}</span><span className="ss-stat-label">Shop Orders</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(giftTotal)}</span><span className="ss-stat-label">Shop Revenue</span></div>
            </div>
          </div>
        );
      }

      case "visitors": {
        const totalVisits = visitors.reduce((s,v)=>s+(v.total_visits||0),0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Visitor Statistics</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{visitors.length}</span><span className="ss-stat-label">Registered Visitors</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{totalVisits}</span><span className="ss-stat-label">Total Visits</span></div>
            </div>
            {isManager && (
              <DataTable keyField="user_id" rows={visitors.slice(0,20)}
                columns={[{key:"first_name",label:"First"},{key:"last_name",label:"Last"},{key:"total_visits",label:"Visits"},{key:"last_visit_date",label:"Last Visit",render:fmt}]} />
            )}
          </div>
        );
      }

      case "team":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Team — {permissions.name}</h2>
            <DataTable keyField="user_id" rows={teamMembers}
              columns={[{key:"first_name",label:"First"},{key:"last_name",label:"Last"},{key:"job_title",label:"Title"},{key:"employment_type",label:"Type"},{key:"hire_date",label:"Hired",render:fmt},{key:"is_manager",label:"Mgr",render:v=>v?"✓":""}]} />
          </div>
        );

      case "cafe":
        return <div className="ss-card"><h2 className="ss-section-title">Cafe Management</h2><p className="emp-note">📦 Low stock alerts appear when items are below 20 units.</p></div>;

      case "giftshop":
        return <div className="ss-card"><h2 className="ss-section-title">Gift Shop Management</h2><p className="emp-note">📦 Low stock alerts appear when items are below 20 units.</p></div>;

      case "password":
        return (
          <div className="ss-card" style={{ maxWidth: 420 }}>
            <h2 className="ss-section-title">Change Password</h2>
            <form className="ss-form" onSubmit={handlePasswordChange}>
              <div className="ss-form-group">
                <label>New Password (min. 6 characters)</label>
                <PasswordInput value={pwForm.new_password} onChange={e=>setPwForm(p=>({...p,new_password:e.target.value}))} />
                {pwErrors.new_password && <span style={{color:"#dc2626",fontSize:11}}>{pwErrors.new_password}</span>}
              </div>
              <div className="ss-form-group">
                <label>Confirm New Password</label>
                <PasswordInput value={pwForm.confirm_password} onChange={e=>setPwForm(p=>({...p,confirm_password:e.target.value}))} />
                {pwErrors.confirm_password && <span style={{color:"#dc2626",fontSize:11}}>{pwErrors.confirm_password}</span>}
              </div>
              <div className="ss-form-actions">
                <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>{saving?"Updating…":"Update Password"}</button>
              </div>
            </form>
          </div>
        );

      default:
        return <div className="ss-empty">Select a tab from above</div>;
    }
  };

  // ── Build tab list ─────────────────────────────────────────────────────────
  let baseTabs = [...permissions.tabs];
  if (isManager && !baseTabs.includes('team')) baseTabs.push('team');
  baseTabs = baseTabs.filter(t => t !== 'password');
  const displayTabs = [...baseTabs, 'password'];

  const tabLabel = t => ({
    jobinfo: "Job Info", artwork: "Artworks", giftshop: "Gift Shop",
    transactions: "Transactions", password: "Change Password",
  }[t] || t.charAt(0).toUpperCase() + t.slice(1));

  return (
    <div className="dashboard-page employee-dashboard">

      {/* ── Hero — matches member/visitor layout ── */}
      <div className="dashboard-hero employee-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge employee-badge-hero">
            {isManager ? "Manager" : "Employee"} · {permissions.name}
          </span>
          <h1>{loading ? "Staff Portal" : `Welcome, ${profile?.first_name || "Staff"}`}</h1>
          <p>{empRecord?.job_title || ""}</p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">← Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        {loading ? <div className="ss-loading">Loading…</div> : (
          <>
            <div className="ss-tabs">
              {displayTabs.map(tab => (
                <button key={tab} className={`ss-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}>
                  {tabLabel(tab)}
                </button>
              ))}
            </div>
            {feedback && <div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}
            {renderContent()}
          </>
        )}
      </div>

      <EditModal isOpen={!!editingItem} item={editingItem} fields={getEditFields(editType)} onSave={handleSaveEdit} onClose={()=>setEditingItem(null)} />
      <MembershipActionModal isOpen={actionModalOpen} member={selectedMember}
        onClose={()=>{setActionModalOpen(false);setSelectedMember(null);}}
        onSuccess={refreshMembers} notify={notify} />
    </div>
  );
}