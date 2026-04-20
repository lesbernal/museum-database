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
  createProvenance, updateProvenance, deleteProvenance,
  createExhibition, updateExhibition, deleteExhibition,
  createGallery, updateGallery, deleteGallery,
  createEvent, updateEvent, deleteEvent,
  updateUser, updateMember,
} from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";

import ArtistManager      from "../components/ArtistManager";
import ArtworkManager     from "../components/ArtworkManager";
import ProvenanceManager  from "../components/ProvenanceManager";
import ExhibitionManager  from "../components/ExhibitionManager";
import GalleryManager     from "../components/GalleryManager";
import EventManager       from "../components/EventManager";
import CafeAdminPanel     from "../components/CafeAdminPanel";
import GiftShopAdminPanel from "../components/GiftShopAdminPanel";

import "../styles/Dashboard.css";
import "../styles/SelfService.css";
import "../styles/EmployeeDashboard.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEPT = {
  1: { name:"Administration",           tabs:["profile","jobinfo","team","artists","artwork","provenance","exhibitions","galleries","events","members","donations","visitors","transactions","pending","password"], canEdit:["artists","artwork","provenance","exhibitions","galleries","events","members"], pendingDept:null },
  2: { name:"Curatorial & Collections", tabs:["profile","jobinfo","artists","artwork","provenance","exhibitions","password"],                                                                                        canEdit:["artists","artwork","provenance","exhibitions"],              pendingDept:null },
  3: { name:"Exhibitions & Galleries",  tabs:["profile","jobinfo","exhibitions","galleries","events","password"],                                                                                                    canEdit:["exhibitions","galleries","events"],                         pendingDept:null },
  4: { name:"Visitor Services",         tabs:["profile","jobinfo","visitors","tickets","events","pending","password"],                                                                                               canEdit:["events"],                                                   pendingDept:4    },
  5: { name:"Retail",                   tabs:["profile","jobinfo","giftshop","transactions","pending","password"],                                                                                                   canEdit:["giftshop"],                                                 pendingDept:5    },
  6: { name:"Cafe & Hospitality",       tabs:["profile","jobinfo","cafe","transactions","pending","password"],                                                                                                       canEdit:["cafe"],                                                     pendingDept:6    },
  7: { name:"Development & Membership", tabs:["profile","jobinfo","members","donations","transactions","password"],                                                                                                  canEdit:["members"],                                                  pendingDept:null },
  8: { name:"Security",                 tabs:["profile","jobinfo","visitors","tickets","password"],                                                                                                                  canEdit:[],                                                           pendingDept:null },
};

const fmt = dateStr => {
  if (!dateStr) return "—";
  const [y,m,d] = String(dateStr).slice(0,10).split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${d}, ${y}`;
};
const currency = v => v == null ? "—" : `$${parseFloat(v).toFixed(2)}`;

function validateProfile(form) {
  const required = [
    { key:"first_name",     label:"First name"     },
    { key:"last_name",      label:"Last name"       },
    { key:"email",          label:"Email"           },
    { key:"phone_number",   label:"Phone number"    },
    { key:"street_address", label:"Street address"  },
    { key:"city",           label:"City"            },
    { key:"state",          label:"State"           },
    { key:"zip_code",       label:"Zip code"        },
  ];
  for (const field of required) {
    if (!(form[field.key] || "").trim()) return `${field.label} is required.`;
  }
  if ((form.phone_number || "").replace(/\D/g,"").length !== 10) return "Phone number must be exactly 10 digits.";
  if (!/^\d{5}$/.test((form.zip_code || "").trim())) return "Zip code must be exactly 5 digits.";
  return null;
}

function DataTable({ columns, rows, keyField, onEdit, canEdit=false }) {
  if (!rows?.length) return <div className="ss-empty">No records found.</div>;
  return (
    <div style={{ border:"1px solid #e5e7eb", overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:"0.625rem 1rem", textAlign:c.right?"right":"left", color:"#6b7280", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {c.label}
              </th>
            ))}
            {canEdit && <th style={{ padding:"0.625rem 1rem", width:80 }}>Edit</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i) => (
            <tr key={r[keyField]??i} style={{ borderBottom:i<rows.length-1?"1px solid #f3f4f6":"none" }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:"0.625rem 1rem", color:"#374151", textAlign:c.right?"right":"left" }}>
                  {c.render ? c.render(r[c.key],r) : (r[c.key]??"—")}
                </td>
              ))}
              {canEdit && <td style={{ padding:"0.625rem 1rem" }}><button onClick={() => onEdit(r)} className="emp-edit-btn">Edit</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TIER_ORDER  = ["Bronze","Silver","Gold","Platinum"];
const TIER_PRICES = { Bronze:75, Silver:150, Gold:300, Platinum:600 };

function MembershipActionModal({ isOpen, member, onClose, onSuccess, notify }) {
  const [action,       setAction]       = useState("renew");
  const [selectedTier, setSelectedTier] = useState("");
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    if (isOpen && member) { setSelectedTier(member.membership_level||"Bronze"); setAction("renew"); }
  }, [isOpen, member]);

  if (!isOpen||!member) return null;

  const currentIdx = TIER_ORDER.indexOf(member.membership_level);
  const tiers = action==="upgrade" ? TIER_ORDER.slice(currentIdx+1) : action==="downgrade" ? TIER_ORDER.slice(0,currentIdx) : [member.membership_level];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (action==="cancel") {
        await updateMember(member.user_id, { ...member, expiration_date:new Date().toISOString().slice(0,10) });
        await updateUser(member.user_id, { role:"visitor" });
        await createMembershipTransaction({ user_id:member.user_id, membership_level:member.membership_level, amount:0, payment_method:"Staff Processed", transaction_type:"Cancellation" });
        notify(`Membership cancelled for ${member.first_name} ${member.last_name}`);
      } else {
        const type = action==="upgrade"?"Upgrade":action==="downgrade"?"Downgrade":"Renewal";
        await createMembershipTransaction({ user_id:member.user_id, membership_level:selectedTier, amount:TIER_PRICES[selectedTier], payment_method:"Staff Processed", transaction_type:type });
        notify(`${type} processed for ${member.first_name} ${member.last_name}`);
      }
      onSuccess(); onClose();
    } catch (err) { notify(err.message,"error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" style={{ maxWidth:440 }} onClick={e=>e.stopPropagation()}>
        <div className="um-modal-header"><h3>Manage — {member.first_name} {member.last_name}</h3><button className="um-modal-close" onClick={onClose}>×</button></div>
        <div className="um-modal-body">
          <div className="um-form-grid">
            <div className="um-form-group full"><label>Current Level</label><span style={{ padding:"4px 12px", background:"#f3e8ff", color:"#6b21a8", borderRadius:20, fontSize:13, fontWeight:500 }}>{member.membership_level||"None"}</span></div>
            <div className="um-form-group full"><label>Action</label>
              <select value={action} onChange={e=>setAction(e.target.value)}>
                <option value="renew">Renew</option>
                {currentIdx<TIER_ORDER.length-1&&<option value="upgrade">Upgrade</option>}
                {currentIdx>0&&<option value="downgrade">Downgrade</option>}
                <option value="cancel">Cancel</option>
              </select>
            </div>
            {action!=="cancel"&&(
              <div className="um-form-group full"><label>Tier</label>
                <select value={selectedTier} onChange={e=>setSelectedTier(e.target.value)} disabled={action==="renew"}>
                  {tiers.map(t=><option key={t} value={t}>{t} — ${TIER_PRICES[t]}/yr</option>)}
                </select>
              </div>
            )}
            {action==="cancel"&&<div className="um-form-group full"><div style={{ padding:12, background:"#fee2e2", border:"1px solid #fecaca", borderRadius:6, fontSize:13, color:"#991b1b" }}>This will expire the membership today. The user will become a visitor.</div></div>}
          </div>
        </div>
        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-save-btn" onClick={handleSubmit} disabled={loading}>{loading?"Processing...":action==="cancel"?"Cancel Membership":action==="upgrade"?"Upgrade":action==="downgrade"?"Downgrade":"Renew"}</button>
        </div>
      </div>
    </div>
  );
}

function PendingOrdersPanel({ deptId, employeeUserId, notify }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const load = () => {
    setLoading(true);
    fetch(`${BASE_URL}/pending-orders?department_id=${deptId}&status=pending`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.ok?r.json():[]).then(data=>setOrders(Array.isArray(data)?data:[])).catch(()=>setOrders([])).finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, [deptId]);

  async function act(pendingId, action) {
    try {
      const res  = await fetch(`${BASE_URL}/pending-orders/${pendingId}/${action}`, { method:"PATCH", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body:JSON.stringify({ reviewed_by:employeeUserId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||`Failed to ${action}`);
      notify(data.message);
      load();
    } catch (err) { notify(err.message,"error"); }
  }

  const typeLabel = { tickets:"Tickets", cafe:"Cafe Order", giftshop:"Gift Shop Order" };
  if (loading) return <div className="ss-loading">Loading pending orders…</div>;

  return (
    <div className="ss-card">
      <h2 className="ss-section-title">
        Pending Orders
        {orders.length>0&&<span style={{ marginLeft:12, background:"#dc2626", color:"#fff", borderRadius:999, fontSize:11, padding:"2px 8px", fontWeight:600 }}>{orders.length}</span>}
      </h2>
      <p style={{ fontSize:13, color:"#6b7280", marginBottom:20, lineHeight:1.6 }}>
        These orders exceed the $400 threshold and require approval before processing. All employees in this department can approve or reject.
      </p>
      {orders.length===0 ? <div className="ss-empty">No pending orders. All caught up!</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {orders.map(o=>(
            <div key={o.pending_id} style={{ border:"1px solid #e5e7eb", borderLeft:"4px solid #c9a84c", padding:"1rem 1.25rem", background:"#fff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.5rem" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>{typeLabel[o.order_type]||o.order_type}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{o.first_name} {o.last_name} ({o.email}) · {fmt(o.submitted_at)} · {o.item_count} items · {currency(o.total_amount)}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>act(o.pending_id,"approve")} style={{ padding:"0.4rem 1rem", background:"#d1fae5", color:"#065f46", border:"1px solid #6ee7b7", cursor:"pointer", fontSize:13, fontWeight:600, borderRadius:4 }}>Approve</button>
                  <button onClick={()=>act(o.pending_id,"reject")}  style={{ padding:"0.4rem 1rem", background:"#fee2e2", color:"#991b1b", border:"1px solid #fca5a5", cursor:"pointer", fontSize:13, fontWeight:600, borderRadius:4 }}>Reject</button>
                </div>
              </div>
              {o.order_data?.tickets&&<div style={{ marginTop:8, fontSize:12, color:"#6b7280" }}>Visit date: {o.order_data.visitDate} · {o.item_count} tickets</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [empRecord,    setEmpRecord]     = useState(null);
  const [activeTab,    setActiveTab]     = useState("profile");
  const [loading,      setLoading]       = useState(true);
  const [saving,       setSaving]        = useState(false);
  const [feedback,     setFeedback]      = useState(null);
  const [form,         setForm]          = useState({});
  const [pwForm,       setPwForm]        = useState({ new_password:"", confirm_password:"" });
  const [pwErrors,     setPwErrors]      = useState({});
  const [pendingCount, setPendingCount]  = useState(0);

  const [artists,          setArtists]          = useState([]);
  const [artworks,         setArtworks]         = useState([]);
  const [provenance,       setProvenance]       = useState([]);
  const [exhibitions,      setExhibitions]      = useState([]);
  const [galleries,        setGalleries]        = useState([]);
  const [events,           setEvents]           = useState([]);
  const [members,          setMembers]          = useState([]);
  const [donations,        setDonations]        = useState([]);
  const [visitors,         setVisitors]         = useState([]);
  const [tickets,          setTickets]          = useState([]);
  const [cafeTransactions, setCafeTransactions] = useState([]);
  const [giftTransactions, setGiftTransactions] = useState([]);
  const [teamMembers,      setTeamMembers]      = useState([]);

  const [selectedMember,  setSelectedMember]  = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  const [cafeAlerts,      setCafeAlerts]      = useState([]);
  const [giftShopAlerts,  setGiftShopAlerts]  = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState({});

  const notify = (msg, type="success") => { setFeedback({ msg, type }); };

  const token  = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, emp] = await Promise.allSettled([getMyProfile(), getMyEmployeeRecord()]);
        if (prof.status==="fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (emp.status ==="fulfilled") setEmpRecord(emp.value?.user_id ? emp.value : null);
      } catch(e) { notify(e.message,"error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!empRecord) return;
    const deptId = empRecord.department_id;
    const perm   = DEPT[deptId] || DEPT[4];
    const has    = tab => perm.tabs.includes(tab);

    async function loadData() {
      const results = await Promise.allSettled([
        has("artists")      ? getArtists()             : Promise.resolve([]),
        has("artwork")      ? getArtworks()             : Promise.resolve([]),
        has("provenance")   ? getProvenance()           : Promise.resolve([]),
        has("exhibitions")  ? getExhibitions()          : Promise.resolve([]),
        has("galleries")    ? getGalleries()            : Promise.resolve([]),
        has("events")       ? getEvents()               : Promise.resolve([]),
        has("members")      ? getMembers()              : Promise.resolve([]),
        has("donations")    ? getDonations()            : Promise.resolve([]),
        (has("visitors")||has("tickets")) ? getVisitors() : Promise.resolve([]),
        has("tickets")      ? getTickets()              : Promise.resolve([]),
        has("transactions") ? getCafeTransactions()     : Promise.resolve([]),
        has("transactions") ? getGiftShopTransactions() : Promise.resolve([]),
      ]);
      const [r0,r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11] = results;
      if (r0.status ==="fulfilled") setArtists(r0.value||[]);
      if (r1.status ==="fulfilled") setArtworks(r1.value||[]);
      if (r2.status ==="fulfilled") setProvenance(r2.value||[]);
      if (r3.status ==="fulfilled") setExhibitions(r3.value||[]);
      if (r4.status ==="fulfilled") setGalleries(r4.value||[]);
      if (r5.status ==="fulfilled") setEvents(r5.value||[]);
      if (r6.status ==="fulfilled") setMembers(r6.value||[]);
      if (r7.status ==="fulfilled") setDonations(r7.value||[]);
      if (r8.status ==="fulfilled") setVisitors(r8.value||[]);
      if (r9.status ==="fulfilled") setTickets(r9.value||[]);
      if (r10.status==="fulfilled") setCafeTransactions(r10.value||[]);
      if (r11.status==="fulfilled") setGiftTransactions(r11.value||[]);

      if ([1,5,6].includes(deptId)) {
        try {
          const { getCafeItems, getGiftShopItems } = await import("../services/api");
          const [cafeItems, giftItems] = await Promise.all([getCafeItems(), getGiftShopItems()]);
          if (deptId===6||deptId===1) setCafeAlerts(cafeItems.filter(i=>Number(i.low_stock_alert)===1).map(i=>({ name:i.item_name, stock:Number(i.stock_quantity) })));
          if (deptId===5||deptId===1) setGiftShopAlerts(giftItems.filter(i=>Number(i.low_stock_alert)===1).map(i=>({ name:i.item_name, stock:Number(i.stock_quantity) })));
        } catch { /* silent */ }
      }
    }
    loadData();

    if (empRecord.is_manager) {
      fetch(`${BASE_URL}/employees`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(all => setTeamMembers(all.filter(e => Number(e.department_id) === Number(empRecord.department_id))))
        .catch(() => {});
    }

    if (perm.pendingDept) {
      fetch(`${BASE_URL}/pending-orders?department_id=${perm.pendingDept}&status=pending`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.ok?r.json():[]).then(d=>setPendingCount(Array.isArray(d)?d.length:0)).catch(()=>{});
    }
  }, [empRecord]);

  const deptId    = empRecord?.department_id;
  const perm      = DEPT[deptId] || DEPT[4];
  const isManager = !!empRecord?.is_manager;
  const canDel    = tab => isManager && (perm.canEdit?.includes(tab)||false);
  const canEd     = tab => perm.canEdit?.includes(tab)||false;

  // ── Auto-refresh helpers — called after every successful CRUD operation ─────
  // Each re-fetches only the array that changed so the table updates instantly.
  const refreshArtists     = async () => { try { setArtists(await getArtists());         } catch { /* silent */ } };
  const refreshArtworks    = async () => { try { setArtworks(await getArtworks());       } catch { /* silent */ } };
  const refreshProvenance  = async () => { try { setProvenance(await getProvenance());   } catch { /* silent */ } };
  const refreshExhibitions = async () => { try { setExhibitions(await getExhibitions()); } catch { /* silent */ } };
  const refreshGalleries   = async () => { try { setGalleries(await getGalleries());     } catch { /* silent */ } };
  const refreshEvents      = async () => { try { setEvents(await getEvents());           } catch { /* silent */ } };

  // Wrap an API call so the table re-fetches automatically on success.
  // Usage: wrap(createArtist, refreshArtists)
  const wrap = (apiFn, refresh) => async (...args) => {
    await apiFn(...args);
    await refresh();
  };

  // Archive via deactivate endpoint then refresh
  const archiveRecord = (endpoint, refresh) => async (id) => {
    await fetch(`${BASE_URL}${endpoint}/${id}/deactivate`, { method:"PATCH" });
    await refresh();
  };
  const restoreRecord = (endpoint, refresh) => async (id) => {
    await fetch(`${BASE_URL}${endpoint}/restore/${id}`, { method:"PATCH" });
    await refresh();
  };

  function handleLogout() {
    ["token","role","user_id","user_email"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    const validationError = validateProfile(form);
    if (validationError) { notify(validationError,"error"); return; }
    setSaving(true);
    try {
      const next = { first_name:form.first_name?.trim(), last_name:form.last_name?.trim(), email:form.email?.trim(), phone_number:form.phone_number, street_address:form.street_address?.trim(), city:form.city?.trim(), state:form.state, zip_code:form.zip_code?.trim(), date_of_birth:form.date_of_birth?.slice(0,10)||null };
      await updateMyProfile(next);
      setProfile(prev => ({ ...prev, ...next }));
      setForm(prev => ({ ...prev, ...next }));
      notify("Profile updated successfully");
    } catch(e) { notify(e.message,"error"); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.new_password.length < 6)                        { setPwErrors({ new_password:"Min. 6 characters" }); return; }
    if (pwForm.new_password !== pwForm.confirm_password)       { setPwErrors({ confirm_password:"Passwords do not match" }); return; }
    setPwErrors({});
    setSaving(true);
    try {
      await changeMyPassword(pwForm.new_password);
      notify("Password changed successfully");
      setPwForm({ new_password:"", confirm_password:"" });
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setForm(refreshed);
    } catch(e) { notify(e.message,"error"); }
    finally { setSaving(false); }
  }

  const renderContent = () => {
    switch (activeTab) {

      case "profile":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Profile</h2>
            <form onSubmit={handleProfileSave}>
              <div className="ss-form-grid">
                <div className="ss-form-group"><label>First Name *</label><input value={form.first_name||""} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Last Name *</label><input value={form.last_name||""} onChange={e=>setForm(p=>({...p,last_name:e.target.value}))} /></div>
                <div className="ss-form-group full"><label>Email *</label><input type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Phone *</label><PhoneInput value={form.phone_number||""} onChange={e=>setForm(p=>({...p,phone_number:e.target.value}))} /></div>
                <div className="ss-form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={form.date_of_birth?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,date_of_birth:e.target.value}))} disabled={!!profile?.date_of_birth} />
                  {profile?.date_of_birth&&<span style={{fontSize:11,color:"#9ca3af"}}>Cannot be changed after being set.</span>}
                </div>
                <div className="ss-form-group full"><label>Street Address *</label><input value={form.street_address||""} onChange={e=>setForm(p=>({...p,street_address:e.target.value}))} /></div>
                <div className="ss-form-group"><label>City *</label><input value={form.city||""} onChange={e=>setForm(p=>({...p,city:e.target.value}))} /></div>
                <div className="ss-form-group"><label>State *</label><StateSelect value={form.state||""} onChange={e=>setForm(p=>({...p,state:e.target.value}))} /></div>
                <div className="ss-form-group"><label>Zip *</label><ZipInput value={form.zip_code||""} onChange={e=>setForm(p=>({...p,zip_code:e.target.value}))} /></div>
              </div>
              <div className="ss-form-actions"><button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>{saving?"Saving…":"Save Changes"}</button></div>
            </form>
          </div>
        );

      case "jobinfo":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Job Information</h2>
            {empRecord ? (
              <>
                {isManager&&<div className="emp-manager-badge">Department Manager</div>}
                <div className="ss-stat-grid">
                  <div className="ss-stat"><span className="ss-stat-value">{perm.name}</span><span className="ss-stat-label">Department</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{empRecord.job_title||"—"}</span><span className="ss-stat-label">Job Title</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{empRecord.employment_type||"—"}</span><span className="ss-stat-label">Type</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{fmt(empRecord.hire_date)}</span><span className="ss-stat-label">Hire Date</span></div>
                </div>
                {!isManager && perm.canEdit?.length > 0 && (
                  <p className="emp-note" style={{marginTop:16}}>
                    You can add and edit records in your department. Record deletion and archiving are restricted to department managers.
                  </p>
                )}
              </>
            ) : <div className="ss-empty">No employee record found.</div>}
          </div>
        );

      case "team":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Team — {perm.name}</h2>
            {teamMembers.length===0 ? <div className="ss-empty">No team members found.</div> : (
              <DataTable keyField="user_id" rows={teamMembers}
                columns={[
                  { key:"first_name",      label:"First"    },
                  { key:"last_name",       label:"Last"     },
                  { key:"job_title",       label:"Title"    },
                  { key:"employment_type", label:"Type"     },
                  { key:"hire_date",       label:"Hired",   render:fmt },
                  { key:"is_manager",      label:"Manager", render:v=>v?"✓":"" },
                ]}
              />
            )}
          </div>
        );

      // ── Artists: Edit always; Archive/Restore managers only ───────────────────
      case "artists":
        return (
          <ArtistManager
            artists={artists}
            onAdd={canEd("artists")  ? wrap(createArtist,  refreshArtists)  : null}
            onUpdate={canEd("artists") ? wrap(updateArtist, refreshArtists)  : null}
            onArchive={canDel("artists") ? archiveRecord("/artists", refreshArtists)  : null}
            onRestore={canDel("artists") ? restoreRecord("/artists", refreshArtists)  : null}
            canDelete={canDel("artists")}
          />
        );

      // ── Artwork: Edit always; Archive managers only ───────────────────────────
      case "artwork":
        return (
          <ArtworkManager
            artworks={artworks}
            onAdd={canEd("artwork")    ? wrap(createArtwork, refreshArtworks) : null}
            onUpdate={canEd("artwork") ? wrap(updateArtwork, refreshArtworks) : null}
            onArchive={canDel("artwork") ? archiveRecord("/artwork", refreshArtworks) : null}
            canDelete={canDel("artwork")}
          />
        );

      // ── Provenance: Edit always; Delete managers only ─────────────────────────
      case "provenance":
        return (
          <ProvenanceManager
            provenance={provenance}
            onAdd={canEd("provenance")    ? wrap(createProvenance, refreshProvenance) : null}
            onUpdate={canEd("provenance") ? wrap(updateProvenance, refreshProvenance) : null}
            onDelete={canDel("provenance") ? wrap(deleteProvenance, refreshProvenance) : null}
            canDelete={canDel("provenance")}
          />
        );

      // ── Exhibitions: Edit+Archive always; Delete managers only ────────────────
      case "exhibitions":
        return (
          <ExhibitionManager
            exhibitions={exhibitions}
            onAdd={canEd("exhibitions")    ? wrap(createExhibition, refreshExhibitions) : null}
            onUpdate={canEd("exhibitions") ? wrap(updateExhibition, refreshExhibitions) : null}
            onDelete={canDel("exhibitions") ? wrap(deleteExhibition, refreshExhibitions) : null}
            onArchive={canEd("exhibitions") ? archiveRecord("/exhibitions", refreshExhibitions) : null}
            canDelete={canDel("exhibitions")}
          />
        );

      // ── Galleries: Edit+Archive always; Delete managers only ──────────────────
      case "galleries":
        return (
          <GalleryManager
            galleries={galleries}
            onAdd={canEd("galleries")    ? wrap(createGallery, refreshGalleries) : null}
            onUpdate={canEd("galleries") ? wrap(updateGallery, refreshGalleries) : null}
            onDelete={canDel("galleries") ? wrap(deleteGallery, refreshGalleries) : null}
            onArchive={canEd("galleries") ? archiveRecord("/galleries", refreshGalleries) : null}
            canDelete={canDel("galleries")}
          />
        );

      // ── Events: Edit+Archive always; Delete managers only ─────────────────────
      case "events":
        return (
          <EventManager
            events={events}
            onAdd={canEd("events")    ? wrap(createEvent, refreshEvents) : null}
            onUpdate={canEd("events") ? wrap(updateEvent, refreshEvents) : null}
            onDelete={canDel("events") ? wrap(deleteEvent, refreshEvents) : null}
            onArchive={canEd("events") ? archiveRecord("/events", refreshEvents) : null}
            canDelete={canDel("events")}
          />
        );

      case "cafe":
        return <CafeAdminPanel canEdit={canEd("cafe")} canDelete={canDel("cafe")} />;

      case "giftshop":
        return <GiftShopAdminPanel canEdit={canEd("giftshop")} canDelete={canDel("giftshop")} />;

      case "members": {
        const todayStr = new Date().toISOString().slice(0,10);
        const active   = members.filter(m=>m.expiration_date&&String(m.expiration_date).slice(0,10)>=todayStr).length;
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Member Management</h2>
            {members.length===0 ? <div className="ss-empty">No data loaded.</div> : (
              <>
                <div className="ss-stat-grid" style={{marginBottom:20}}>
                  <div className="ss-stat"><span className="ss-stat-value">{members.length}</span><span className="ss-stat-label">Total</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{active}</span><span className="ss-stat-label">Active</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{members.length-active}</span><span className="ss-stat-label">Expired</span></div>
                </div>
                <DataTable keyField="user_id" rows={members}
                  columns={[
                    {key:"user_id",label:"ID"},
                    {key:"first_name",label:"First"},
                    {key:"last_name",label:"Last"},
                    {key:"email",label:"Email"},
                    {key:"membership_level",label:"Level"},
                    {key:"expiration_date",label:"Expires",render:fmt},
                    {key:"_manage",label:"",render:(_,m)=>(
                      <button className="member-manage-btn" onClick={()=>{setSelectedMember(m);setMemberModalOpen(true);}}>Manage</button>
                    )},
                  ]}
                />
              </>
            )}
          </div>
        );
      }

      case "donations": {
        const total = donations.reduce((s,d)=>s+parseFloat(d.amount||0),0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Donations</h2>
            {donations.length===0 ? <div className="ss-empty">No data loaded.</div> : (
              <>
                <div className="ss-stat-grid" style={{marginBottom:20}}>
                  <div className="ss-stat"><span className="ss-stat-value">{donations.length}</span><span className="ss-stat-label">Total Donations</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{currency(total)}</span><span className="ss-stat-label">Total Amount</span></div>
                </div>
                <DataTable keyField="donation_id" rows={donations}
                  columns={[
                    {key:"donation_id",label:"ID"},
                    {key:"first_name",label:"Donor",render:(_,d)=>d.first_name?`${d.first_name} ${d.last_name}`:`User #${d.user_id}`},
                    {key:"donation_date",label:"Date",render:fmt},
                    {key:"donation_type",label:"Type"},
                    {key:"amount",label:"Amount",right:true,render:currency},
                  ]}
                />
              </>
            )}
          </div>
        );
      }

      case "visitors": {
        const totalVisits = visitors.reduce((s,v)=>s+(v.total_visits||0),0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Visitor Statistics</h2>
            {visitors.length===0 ? <div className="ss-empty">No data loaded.</div> : (
              <>
                <div className="ss-stat-grid" style={{marginBottom:20}}>
                  <div className="ss-stat"><span className="ss-stat-value">{visitors.length}</span><span className="ss-stat-label">Registered Visitors</span></div>
                  <div className="ss-stat"><span className="ss-stat-value">{totalVisits}</span><span className="ss-stat-label">Total Visits</span></div>
                </div>
                <DataTable keyField="user_id" rows={visitors.slice(0,50)}
                  columns={[
                    {key:"first_name",label:"First"},
                    {key:"last_name",label:"Last"},
                    {key:"total_visits",label:"Visits"},
                    {key:"last_visit_date",label:"Last Visit",render:fmt},
                  ]}
                />
              </>
            )}
          </div>
        );
      }

      case "tickets":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Recent Tickets</h2>
            {tickets.length===0 ? <div className="ss-empty">No data loaded.</div> : (
              <DataTable keyField="ticket_id" rows={tickets.slice(0,50)}
                columns={[
                  {key:"ticket_id",label:"ID"},
                  {key:"user_id",label:"User"},
                  {key:"ticket_type",label:"Type"},
                  {key:"visit_date",label:"Visit",render:fmt},
                  {key:"final_price",label:"Price",right:true,render:currency},
                  {key:"discount_type",label:"Discount"},
                ]}
              />
            )}
          </div>
        );

      case "transactions": {
        const cafeTotal = cafeTransactions.reduce((s,t)=>s+parseFloat(t.total_amount||0),0);
        const giftTotal = giftTransactions.reduce((s,t)=>s+parseFloat(t.total_amount||0),0);
        const showCafe  = deptId===6||deptId===1;
        const showGift  = deptId===5||deptId===1;
        const showAll   = deptId===7||deptId===1;
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Transactions</h2>
            <div className="ss-stat-grid" style={{marginBottom:20}}>
              {(showCafe||showAll)&&<><div className="ss-stat"><span className="ss-stat-value">{cafeTransactions.length}</span><span className="ss-stat-label">Cafe Orders</span></div><div className="ss-stat"><span className="ss-stat-value">{currency(cafeTotal)}</span><span className="ss-stat-label">Cafe Revenue</span></div></>}
              {(showGift||showAll)&&<><div className="ss-stat"><span className="ss-stat-value">{giftTransactions.length}</span><span className="ss-stat-label">Shop Orders</span></div><div className="ss-stat"><span className="ss-stat-value">{currency(giftTotal)}</span><span className="ss-stat-label">Shop Revenue</span></div></>}
            </div>
          </div>
        );
      }

      case "pending":
        return perm.pendingDept
          ? <PendingOrdersPanel deptId={perm.pendingDept} employeeUserId={Number(userId)} notify={notify} />
          : <div className="ss-empty">No pending orders for your department.</div>;

      case "password":
        return (
          <div className="ss-card" style={{maxWidth:420}}>
            <h2 className="ss-section-title">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="ss-form-group">
                <label>New Password (min. 6 characters)</label>
                <PasswordInput value={pwForm.new_password} onChange={e=>setPwForm(p=>({...p,new_password:e.target.value}))} />
                {pwErrors.new_password&&<span style={{color:"#dc2626",fontSize:11}}>{pwErrors.new_password}</span>}
              </div>
              <div className="ss-form-group">
                <label>Confirm New Password</label>
                <PasswordInput value={pwForm.confirm_password} onChange={e=>setPwForm(p=>({...p,confirm_password:e.target.value}))} />
                {pwErrors.confirm_password&&<span style={{color:"#dc2626",fontSize:11}}>{pwErrors.confirm_password}</span>}
              </div>
              <div className="ss-form-actions"><button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>{saving?"Updating…":"Update Password"}</button></div>
            </form>
          </div>
        );

      default:
        return <div className="ss-empty">Select a tab above.</div>;
    }
  };

  // Team tab injected after jobinfo for managers
  const baseTabs  = perm.tabs.filter(t => t !== "team");
  const withTeam  = isManager
    ? [ ...baseTabs.slice(0, baseTabs.indexOf("jobinfo")+1), "team", ...baseTabs.slice(baseTabs.indexOf("jobinfo")+1) ]
    : baseTabs;
  const displayTabs = withTeam;

  const tabLabel = t => ({
    jobinfo:"Job Info", artwork:"Artworks", giftshop:"Gift Shop", team:"My Team",
    transactions:"Transactions", pending:"Pending Orders", password:"Change Password",
    provenance:"Provenance", exhibitions:"Exhibitions", galleries:"Galleries",
    visitors:"Visitors", tickets:"Tickets", members:"Members", donations:"Donations",
    artists:"Artists", cafe:"Cafe", events:"Events",
  }[t] || t.charAt(0).toUpperCase()+t.slice(1));

  if (loading) return <div className="dashboard-loading">Loading…</div>;

  return (
    <div className="dashboard-page employee-dashboard">
      {/* Stock alert toasts */}
      {cafeAlerts.length > 0 && !dismissedAlerts.cafe && (
        <div className="dashboard-toast cafe-toast" style={{ position:"fixed", top:"80px", right:"20px", zIndex:1000, maxWidth:"350px" }}>
          <div className="dashboard-toast-content">
            <div className="dashboard-toast-header">
              <span className="toast-icon">☕</span>
              <span className="toast-title">Cafe Inventory Alert</span>
              <button className="toast-close" onClick={() => setDismissedAlerts(p=>({...p,cafe:true}))}>×</button>
            </div>
            <div className="dashboard-toast-body">
              <p>{cafeAlerts.length} item{cafeAlerts.length!==1?"s are":" is"} running low on stock.</p>
              <div className="toast-items-list">
                {cafeAlerts.slice(0,3).map(a=><div key={a.name} className="toast-item"><span className="toast-item-name">{a.name}</span><span className="toast-item-stock low">{a.stock} left</span></div>)}
                {cafeAlerts.length>3&&<div className="toast-item-more">+{cafeAlerts.length-3} more items</div>}
              </div>
            </div>
            <div className="dashboard-toast-footer">
              <button className="toast-resolve-btn" onClick={()=>{ setActiveTab("cafe"); setDismissedAlerts(p=>({...p,cafe:true})); }}>Go to Cafe Inventory →</button>
              <button className="toast-dismiss-btn" onClick={()=>setDismissedAlerts(p=>({...p,cafe:true}))}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {giftShopAlerts.length > 0 && !dismissedAlerts.gift && (
        <div className="dashboard-toast gift-toast" style={{ position:"fixed", top:"160px", right:"20px", zIndex:1000, maxWidth:"350px" }}>
          <div className="dashboard-toast-content">
            <div className="dashboard-toast-header">
              <span className="toast-icon">🎁</span>
              <span className="toast-title">Gift Shop Inventory Alert</span>
              <button className="toast-close" onClick={() => setDismissedAlerts(p=>({...p,gift:true}))}>×</button>
            </div>
            <div className="dashboard-toast-body">
              <p>{giftShopAlerts.length} item{giftShopAlerts.length!==1?"s are":" is"} running low on stock.</p>
              <div className="toast-items-list">
                {giftShopAlerts.slice(0,3).map(a=><div key={a.name} className="toast-item"><span className="toast-item-name">{a.name}</span><span className="toast-item-stock low">{a.stock} left</span></div>)}
                {giftShopAlerts.length>3&&<div className="toast-item-more">+{giftShopAlerts.length-3} more items</div>}
              </div>
            </div>
            <div className="dashboard-toast-footer">
              <button className="toast-resolve-btn" onClick={()=>{ setActiveTab("giftshop"); setDismissedAlerts(p=>({...p,gift:true})); }}>Go to Gift Shop Inventory →</button>
              <button className="toast-dismiss-btn" onClick={()=>setDismissedAlerts(p=>({...p,gift:true}))}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-hero employee-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge employee-badge-hero">
            {isManager?"Manager":"Employee"} · {perm.name}
          </span>
          <h1>Welcome, {profile?.first_name||"Staff"}</h1>
          <p>{empRecord?.job_title||""}</p>
          <div className="dashboard-hero-actions">
            <Link to="/" className="dashboard-back-btn">← Back to Home</Link>
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="ss-tabs" style={{ overflowY:"hidden" }}>
          {displayTabs.map(tab=>(
            <button key={tab} className={`ss-tab ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
              {tabLabel(tab)}
              {tab==="pending"&&pendingCount>0&&(
                <span style={{ marginLeft:6, background:"#dc2626", color:"#fff", borderRadius:999, fontSize:10, padding:"1px 6px", fontWeight:700, verticalAlign:"middle" }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {feedback&&<div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}
        {renderContent()}
      </div>

      <MembershipActionModal
        isOpen={memberModalOpen}
        member={selectedMember}
        onClose={()=>{ setMemberModalOpen(false); setSelectedMember(null); }}
        onSuccess={async()=>setMembers(await getMembers())}
        notify={notify}
      />
    </div>
  );
}