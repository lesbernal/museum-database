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
} from "../services/api";
import { updateUser, deleteMember, updateMember } from "../services/api";
import { PasswordInput, PhoneInput, StateSelect, ZipInput } from "../components/FormUtils";
import "../styles/Dashboard.css";
import "../styles/SelfService.css";
import "../styles/EmployeeDashboard.css";

// Department-based permissions
const DEPT_PERMISSIONS = {
  1: {  // Administration
    name: "Administration",
    tabs: ['profile', 'jobinfo', 'artists', 'artwork', 'provenance', 'exhibitions', 'galleries', 'events', 'cafe', 'giftshop', 'members', 'transactions', 'visitors', 'donations', 'reports', 'password'],
    canEdit: ['artists', 'artwork', 'provenance', 'exhibitions', 'galleries', 'events', 'cafe', 'giftshop', 'members'],
    canDelete: false,
    canViewTeam: true,
    canViewReports: true,
  },
  2: {  // Curatorial & Collections
    name: "Curatorial & Collections",
    tabs: ['profile', 'jobinfo', 'artists', 'artwork', 'provenance', 'exhibitions', 'password'],
    canEdit: ['artists', 'artwork', 'provenance', 'exhibitions'],
    canDelete: false,
    canViewTeam: false,
    canViewReports: false,
  },
  3: {  // Exhibitions & Galleries
    name: "Exhibitions & Galleries",
    tabs: ['profile', 'jobinfo', 'exhibitions', 'galleries', 'events', 'password'],
    canEdit: ['exhibitions', 'galleries', 'events'],
    canDelete: false,
    canViewTeam: false,
    canViewReports: false,
  },
  4: {  // Visitor Services
    name: "Visitor Services",
    tabs: ['profile', 'jobinfo', 'visitors', 'tickets', 'events', 'password'],
    canEdit: ['events'],
    canDelete: false,
    canViewTeam: true,
    canViewReports: false,
  },
  5: {  // Retail
    name: "Retail",
    tabs: ['profile', 'jobinfo', 'giftshop', 'transactions', 'password'],
    canEdit: ['giftshop'],
    canDelete: false,
    canViewTeam: false,
    canViewReports: false,
  },
  6: {  // Cafe & Hospitality
    name: "Cafe & Hospitality",
    tabs: ['profile', 'jobinfo', 'cafe', 'transactions', 'password'],
    canEdit: ['cafe'],
    canDelete: false,
    canViewTeam: false,
    canViewReports: false,
  },
  7: {  // Development & Membership
    name: "Development & Membership",
    tabs: ['profile', 'jobinfo', 'members', 'donations', 'transactions', 'password'],
    canEdit: ['members'],
    canDelete: false,
    canViewTeam: true,
    canViewReports: false,
    canManageMemberships: true,
  },
};

const fmt = dateStr => {
  if (!dateStr) return "—";
  const date = String(dateStr).slice(0, 10);
  const [year, month, day] = date.split("-");
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const currency = val => val === null || val === undefined ? "—" : `$${parseFloat(val).toFixed(2)}`;

function DataTable({ columns, rows, keyField, onEdit, canEdit = false }) {
  if (!rows || rows.length === 0)
    return <div className="ss-empty">No records found.</div>;
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
            {canEdit && <th style={{ padding: "0.625rem 1rem" }}>Actions</th>}
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

function EditModal({ isOpen, item, fields, onSave, onClose }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setForm(item);
  }, [item]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
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

// Membership Action Modal Component
const MembershipActionModal = ({ isOpen, member, onClose, onSuccess, notify }) => {
  const [action, setAction] = useState('renew');
  const [selectedTier, setSelectedTier] = useState('');
  const [loading, setLoading] = useState(false);

  const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const TIER_PRICES = { Bronze: 75, Silver: 150, Gold: 300, Platinum: 600 };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && member) {
      setSelectedTier(member.membership_level || 'Bronze');
      setAction('renew');
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const currentLevel = member.membership_level;
  const currentIndex = TIER_ORDER.indexOf(currentLevel);

  // Get available tiers based on action
  const getAvailableTiers = () => {
    switch (action) {
      case 'upgrade':
        return TIER_ORDER.slice(currentIndex + 1);
      case 'downgrade':
        return TIER_ORDER.slice(0, currentIndex);
      case 'renew':
        return [currentLevel];
      default:
        return TIER_ORDER;
    }
  };

  const availableTiers = getAvailableTiers();
  const canProceed = action === 'cancel' || (selectedTier && availableTiers.includes(selectedTier));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (action === 'cancel') {
        if (confirm(`Cancel ${member.first_name} ${member.last_name}'s ${currentLevel} membership? They will become a regular visitor.`)) {
          await deleteMember(member.user_id);
          notify(`Membership cancelled for ${member.first_name} ${member.last_name}`);
          onSuccess();
          onClose();
        }
        setLoading(false);
        return;
      }

      let transactionType = action === 'upgrade' ? 'Upgrade' : (action === 'downgrade' ? 'Downgrade' : 'Renewal');
      const amount = TIER_PRICES[selectedTier];

      const confirmMsg = `${action.toUpperCase()} MEMBERSHIP\n\nMember: ${member.first_name} ${member.last_name}\nCurrent: ${currentLevel}\nNew: ${selectedTier}\nAmount: $${amount}\n\nContinue?`;

      if (confirm(confirmMsg)) {
        await createMembershipTransaction({
          user_id: member.user_id,
          membership_level: selectedTier,
          amount: amount,
          payment_method: "Admin Processed",
          transaction_type: transactionType,
        });
        notify(`${action} processed for ${member.first_name} ${member.last_name}`);
        onSuccess();
        onClose();
      }
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
          <h3>Manage Membership — {member.first_name} {member.last_name}</h3>
          <button className="um-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="um-modal-body">
          <div className="um-form-grid">
            <div className="um-form-group full">
              <label>Current Level</label>
              <div className="current-level-badge" style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: '#f3e8ff',
                color: '#6b21a8',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500
              }}>
                {currentLevel || 'None'}
              </div>
              {member.expiration_date && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Expires: {new Date(member.expiration_date).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="um-form-group full">
              <label>Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="renew">🔄 Renew Membership</option>
                {currentIndex < TIER_ORDER.length - 1 && (
                  <option value="upgrade">⬆️ Upgrade Membership</option>
                )}
                {currentIndex > 0 && (
                  <option value="downgrade">⬇️ Downgrade Membership</option>
                )}
                <option value="cancel">❌ Cancel Membership</option>
              </select>
            </div>

            {action !== 'cancel' && (
              <div className="um-form-group full">
                <label>Select Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  disabled={action === 'renew'}
                >
                  {availableTiers.map(tier => (
                    <option key={tier} value={tier}>
                      {tier} — ${TIER_PRICES[tier]}/year
                    </option>
                  ))}
                </select>
                {action === 'renew' && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Renewing at same tier: ${TIER_PRICES[currentLevel]}/year
                  </div>
                )}
              </div>
            )}

            {action === 'cancel' && (
              <div className="um-form-group full">
                <div className="warning-box" style={{
                  padding: '12px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#991b1b'
                }}>
                  ⚠️ Warning: This will permanently delete the member record.
                  The user will become a regular visitor.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="um-modal-footer">
          <button type="button" className="um-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="um-save-btn"
            onClick={handleSubmit}
            disabled={!canProceed || loading}
          >
            {loading ? 'Processing...' :
              action === 'cancel' ? 'Cancel Membership' :
                action === 'upgrade' ? 'Upgrade' :
                  action === 'downgrade' ? 'Downgrade' : 'Renew'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const [profile, setProfile] = useState(null);
  const [empRecord, setEmpRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  // Data states
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [cafeTransactions, setCafeTransactions] = useState([]);
  const [giftTransactions, setGiftTransactions] = useState([]);
  const [donations, setDonations] = useState([]);
  const [cafeItems, setCafeItems] = useState([]);
  const [giftItems, setGiftItems] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [tickets, setTickets] = useState([]);

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(null);

  // ========== ADD MEMBERSHIP CONSTANTS HERE ==========
  const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const TIER_PRICES = { Bronze: 75, Silver: 150, Gold: 300, Platinum: 600 };

  // ========== ADD HANDLER FUNCTIONS HERE (after state declarations, before useEffect) ==========
  const refreshMembers = async () => {
    const data = await getMembers();
    setMembers(data);
  };

  const handleEditMember = async (member) => {
    // Open edit modal for member's user info
    setEditingItem(member);
    setEditType('member');
  };

  const handleMembershipAction = async (member, action) => {
    const currentLevel = member.membership_level;
    const currentIndex = TIER_ORDER.indexOf(currentLevel);

    let newLevel = currentLevel;
    let transactionType = 'Renewal';

    switch (action) {
      case 'renew':
        newLevel = currentLevel;
        transactionType = 'Renewal';
        break;
      case 'upgrade':
        if (currentIndex >= TIER_ORDER.length - 1) {
          alert(`${currentLevel} is already the highest tier.`);
          return;
        }
        newLevel = TIER_ORDER[currentIndex + 1];
        transactionType = 'Upgrade';
        break;
      case 'downgrade':
        if (currentIndex <= 0) {
          alert(`${currentLevel} is already the lowest tier.`);
          return;
        }
        newLevel = TIER_ORDER[currentIndex - 1];
        transactionType = 'Downgrade';
        break;
      case 'cancel':
        if (confirm(`Cancel ${member.first_name} ${member.last_name}'s ${currentLevel} membership? They will become a regular visitor.`)) {
          try {
            // Option A: Just expire the membership (keep record for history)
            await updateMember(member.user_id, {
              ...member,
              expiration_date: new Date().toISOString().slice(0, 10), // Set expiration to today
            });

            // Update user role to visitor
            await updateUser(member.user_id, { role: 'visitor' });

            // Record cancellation
            await createMembershipTransaction({
              user_id: member.user_id,
              membership_level: currentLevel,
              amount: 0,
              payment_method: "Admin Processed",
              transaction_type: 'Cancellation',
            });

            notify(`Membership cancelled for ${member.first_name} ${member.last_name}`);
            refreshMembers();
          } catch (err) {
            notify(err.message, "error");
          }
        }
        return;
    }

    // Process renewal/upgrade/downgrade
    const confirmMsg = `${action.toUpperCase()}: ${member.first_name} ${member.last_name}\n\nCurrent: ${currentLevel}\nNew: ${newLevel}\nAmount: $${TIER_PRICES[newLevel]}\n\nContinue?`;

    if (confirm(confirmMsg)) {
      try {
        await createMembershipTransaction({
          user_id: member.user_id,
          membership_level: newLevel,
          amount: TIER_PRICES[newLevel],
          payment_method: "Admin Processed",
          transaction_type: transactionType,
        });
        notify(`${action} processed for ${member.first_name} ${member.last_name}`);
        refreshMembers();
      } catch (err) {
        notify(err.message, "error");
      }
    }
  };

  const deptId = empRecord?.department_id;
  const permissions = DEPT_PERMISSIONS[deptId] || DEPT_PERMISSIONS[4]; // Default to Visitor Services
  const isManager = !!empRecord?.is_manager;
  const canEdit = (tab) => permissions.canEdit?.includes(tab) || false;

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Load employee data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, emp] = await Promise.allSettled([
          getMyProfile(), getMyEmployeeRecord(),
        ]);
        if (prof.status === "fulfilled") { setProfile(prof.value); setForm(prof.value); }
        if (emp.status === "fulfilled") setEmpRecord(emp.value?.user_id ? emp.value : null);
      } catch (e) { notify(e.message, "error"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Load team members if manager
  useEffect(() => {
    if (!empRecord || !isManager) return;
    async function loadTeam() {
      try {
        const res = await fetch(`${API_BASE}/employees`, { headers: authHeader() });
        const all = res.ok ? await res.json() : [];
        setTeamMembers(all.filter(e => Number(e.department_id) === Number(empRecord.department_id)));
      } catch (err) {
        console.error("Failed to load team:", err);
      }
    }
    loadTeam();
  }, [empRecord, isManager]);

  // Load data based on department permissions
  useEffect(() => {
    if (!empRecord) return;

    async function loadData() {
      try {
        if (permissions.tabs.includes('artists')) {
          const data = await getArtists();
          setArtists(data);
        }
        if (permissions.tabs.includes('artwork')) {
          const data = await getArtworks();
          setArtworks(data);
        }
        if (permissions.tabs.includes('provenance')) {
          const data = await getProvenance();
          setProvenance(data);
        }
        if (permissions.tabs.includes('exhibitions')) {
          const data = await getExhibitions();
          setExhibitions(data);
        }
        if (permissions.tabs.includes('galleries')) {
          const data = await getGalleries();
          setGalleries(data);
        }
        if (permissions.tabs.includes('events')) {
          const data = await getEvents();
          setEvents(data);
        }
        if (permissions.tabs.includes('members')) {
          const data = await getMembers();
          setMembers(data);
        }
        if (permissions.tabs.includes('transactions')) {
          const [cafe, shop] = await Promise.all([getCafeTransactions(), getGiftShopTransactions()]);
          setCafeTransactions(cafe);
          setGiftTransactions(shop);
        }
        if (permissions.tabs.includes('donations')) {
          const data = await getDonations();
          setDonations(data);
        }
        if (permissions.tabs.includes('visitors')) {
          const data = await getVisitors();
          setVisitors(data);
        }
        if (permissions.tabs.includes('tickets')) {
          const data = await getTickets();
          setTickets(data);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    }
    loadData();
  }, [empRecord]);

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
        first_name: form.first_name?.trim(),
        last_name: form.last_name?.trim(),
        email: form.email?.trim(),
        phone_number: form.phone_number,
        street_address: form.street_address?.trim(),
        city: form.city?.trim(),
        state: form.state,
        zip_code: form.zip_code?.trim(),
        date_of_birth: form.date_of_birth?.slice(0, 10),
      });
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
      await changeMyPassword(pwForm.new_password, profile);
      notify("Password changed successfully");
      setPwForm({ new_password: "", confirm_password: "" });
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setEditType(type);
  };

  const handleSaveEdit = async (updatedItem) => {
    switch (editType) {
      case 'artist':
        await updateArtist(updatedItem.artist_id, updatedItem);
        const newArtists = await getArtists();
        setArtists(newArtists);
        break;
      case 'artwork':
        await updateArtwork(updatedItem.artwork_id, updatedItem);
        const newArtworks = await getArtworks();
        setArtworks(newArtworks);
        break;
      case 'provenance':
        await updateProvenance(updatedItem.provenance_id, updatedItem);
        const newProvenance = await getProvenance();
        setProvenance(newProvenance);
        break;
      case 'exhibition':
        await updateExhibition(updatedItem.exhibition_id, updatedItem);
        const newExhibitions = await getExhibitions();
        setExhibitions(newExhibitions);
        break;
      case 'gallery':
        await updateGallery(updatedItem.gallery_id, updatedItem);
        const newGalleries = await getGalleries();
        setGalleries(newGalleries);
        break;
      case 'event':
        await updateEvent(updatedItem.event_id, updatedItem);
        const newEvents = await getEvents();
        setEvents(newEvents);
        break;
      case 'cafeItem':
        await updateCafeItem(updatedItem.item_id, updatedItem);
        break;
      case 'giftItem':
        await updateGiftShopItem(updatedItem.item_id, updatedItem);
        break;
    }
    notify(`${editType} updated successfully`);
  };

  const getEditFields = (type) => {
    const fields = {
      artist: [
        { key: "first_name", label: "First Name", required: true },
        { key: "last_name", label: "Last Name", required: true },
        { key: "birth_year", label: "Birth Year", type: "number" },
        { key: "death_year", label: "Death Year", type: "number" },
        { key: "nationality", label: "Nationality" },
        { key: "biography", label: "Biography", type: "textarea", full: true },
      ],
      artwork: [
        { key: "title", label: "Title", required: true, full: true },
        { key: "creation_year", label: "Year", type: "number" },
        { key: "medium", label: "Medium" },
        { key: "dimensions", label: "Dimensions" },
        { key: "current_display_status", label: "Status", type: "select", options: ["On Display", "In Storage", "On Loan", "Under Restoration"] },
      ],
      exhibition: [
        { key: "exhibition_name", label: "Name", required: true, full: true },
        { key: "exhibition_type", label: "Type", type: "select", options: ["Permanent", "Temporary", "Traveling"] },
        { key: "start_date", label: "Start Date", type: "date" },
        { key: "end_date", label: "End Date", type: "date" },
      ],
      gallery: [
        { key: "gallery_name", label: "Name", required: true, full: true },
        { key: "floor_number", label: "Floor", type: "number" },
        { key: "square_footage", label: "Square Footage", type: "number" },
        { key: "climate_controlled", label: "Climate Controlled", type: "select", options: ["0", "1"] },
      ],
      event: [
        { key: "event_name", label: "Name", required: true, full: true },
        { key: "description", label: "Description", type: "textarea", full: true },
        { key: "event_date", label: "Date", type: "date" },
        { key: "capacity", label: "Capacity", type: "number" },
        { key: "member_only", label: "Members Only", type: "select", options: ["0", "1"] },
      ],
      cafeItem: [
        { key: "item_name", label: "Item Name", required: true, full: true },
        { key: "category", label: "Category" },
        { key: "price", label: "Price", type: "number" },
        { key: "stock_quantity", label: "Stock Quantity", type: "number" },
      ],
      giftItem: [
        { key: "item_name", label: "Item Name", required: true, full: true },
        { key: "category", label: "Category" },
        { key: "price", label: "Price", type: "number" },
        { key: "stock_quantity", label: "Stock Quantity", type: "number" },
      ],
    };
    return fields[type] || [];
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Profile</h2>
            <form className="ss-form" onSubmit={handleProfileSave}>
              <div className="ss-form-grid">
                <div className="ss-form-group"><label>First Name *</label>
                  <input name="first_name" value={form.first_name || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>Last Name *</label>
                  <input name="last_name" value={form.last_name || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group full"><label>Email *</label>
                  <input name="email" type="email" value={form.email || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>Phone *</label>
                  <input name="phone_number" value={form.phone_number || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group">
                  <label>Date of Birth</label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth?.slice(0, 10) || ""}
                    onChange={handleFormChange}
                    disabled={!!profile?.date_of_birth}
                  />
                  {profile?.date_of_birth && (
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Date of birth cannot be changed after it has been set.
                    </span>
                  )}
                </div>
                <div className="ss-form-group full"><label>Street Address</label>
                  <input name="street_address" value={form.street_address || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>City</label>
                  <input name="city" value={form.city || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>State</label>
                  <StateSelect name="state" value={form.state || ""} onChange={handleFormChange} /></div>
                <div className="ss-form-group"><label>Zip</label>
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
                  <div className="emp-manager-badge">Department Manager</div>
                )}
                <div className="ss-stat-grid">
                  <div className="ss-stat">
                    <span className="ss-stat-value">{permissions.name}</span>
                    <span className="ss-stat-label">Department</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value">{empRecord.job_title || "—"}</span>
                    <span className="ss-stat-label">Job Title</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value">{empRecord.employment_type || "—"}</span>
                    <span className="ss-stat-label">Employment Type</span>
                  </div>
                  <div className="ss-stat">
                    <span className="ss-stat-value">{fmt(empRecord.hire_date)}</span>
                    <span className="ss-stat-label">Hire Date</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="ss-empty">No employee record found.</div>
            )}
          </div>
        );

      case "artists":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Artists</h2>
            <DataTable
              keyField="artist_id"
              rows={artists}
              canEdit={canEdit('artists')}
              onEdit={(item) => handleEdit(item, 'artist')}
              columns={[
                { key: "artist_id", label: "ID" },
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "nationality", label: "Nationality" },
                { key: "birth_year", label: "Born" },
              ]}
            />
            <p className="emp-note">⚠️ Employees can edit but cannot delete artists. Contact admin for deletions.</p>
          </div>
        );

      case "artwork":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Artworks</h2>
            <DataTable
              keyField="artwork_id"
              rows={artworks}
              canEdit={canEdit('artwork')}
              onEdit={(item) => handleEdit(item, 'artwork')}
              columns={[
                { key: "artwork_id", label: "ID" },
                { key: "title", label: "Title" },
                { key: "medium", label: "Medium" },
                { key: "creation_year", label: "Year" },
                { key: "current_display_status", label: "Status" },
              ]}
            />
          </div>
        );

      case "exhibitions":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Exhibitions</h2>
            <DataTable
              keyField="exhibition_id"
              rows={exhibitions}
              canEdit={canEdit('exhibitions')}
              onEdit={(item) => handleEdit(item, 'exhibition')}
              columns={[
                { key: "exhibition_id", label: "ID" },
                { key: "exhibition_name", label: "Name" },
                { key: "exhibition_type", label: "Type" },
                { key: "start_date", label: "Start", render: fmt },
                { key: "end_date", label: "End", render: fmt },
              ]}
            />
          </div>
        );

      case "galleries":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Galleries</h2>
            <DataTable
              keyField="gallery_id"
              rows={galleries}
              canEdit={canEdit('galleries')}
              onEdit={(item) => handleEdit(item, 'gallery')}
              columns={[
                { key: "gallery_id", label: "ID" },
                { key: "gallery_name", label: "Name" },
                { key: "floor_number", label: "Floor" },
                { key: "square_footage", label: "Sq Ft" },
              ]}
            />
          </div>
        );

      case "events":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Events</h2>
            <DataTable
              keyField="event_id"
              rows={events}
              canEdit={canEdit('events')}
              onEdit={(item) => handleEdit(item, 'event')}
              columns={[
                { key: "event_id", label: "ID" },
                { key: "event_name", label: "Name" },
                { key: "event_date", label: "Date", render: fmt },
                { key: "capacity", label: "Capacity" },
              ]}
            />
          </div>
        );

      case "members": {
        const activeMembers = members.filter(m => m.expiration_date && new Date(m.expiration_date) > new Date()).length;
        const allMembers = members;

        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Member Management</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{allMembers.length}</span><span className="ss-stat-label">Total Members</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{activeMembers}</span><span className="ss-stat-label">Active Members</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{allMembers.length - activeMembers}</span><span className="ss-stat-label">Expired Members</span></div>
            </div>

            <DataTable
              keyField="user_id"
              rows={allMembers}
              columns={[
                { key: "user_id", label: "ID" },
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "email", label: "Email" },
                { key: "membership_level", label: "Level" },
                { key: "join_date", label: "Joined", render: fmt },
                { key: "expiration_date", label: "Expires", render: fmt },
                {
                  key: "_actions",
                  label: "Actions",
                  render: (_, member) => (
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setActionModalOpen(true);
                      }}
                      className="member-manage-btn"
                    >
                      Manage
                    </button>
                  )
                },
              ]}
            />
          </div>
        );
      }

      case "cafe":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Cafe Management</h2>
            <p className="emp-note">📦 Low stock alerts appear when items are below 20 units.</p>
            {/* Add cafe inventory management here */}
          </div>
        );

      case "giftshop":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Gift Shop Management</h2>
            <p className="emp-note">📦 Low stock alerts appear when items are below 20 units.</p>
            {/* Add gift shop inventory management here */}
          </div>
        );

      case "transactions": {
        const cafeTotal = cafeTransactions.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
        const giftTotal = giftTransactions.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
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
        const totalVisits = visitors.reduce((s, v) => s + (v.total_visits || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Visitor Statistics</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{visitors.length}</span><span className="ss-stat-label">Registered Visitors</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{totalVisits}</span><span className="ss-stat-label">Total Visits</span></div>
            </div>
            {isManager && (
              <DataTable keyField="user_id" rows={visitors.slice(0, 20)} columns={[
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "total_visits", label: "Visits" },
                { key: "last_visit_date", label: "Last Visit", render: fmt },
              ]} />
            )}
          </div>
        );
      }

      case "team":
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">My Team — {permissions.name}</h2>
            <DataTable keyField="user_id" rows={teamMembers} columns={[
              { key: "first_name", label: "First Name" },
              { key: "last_name", label: "Last Name" },
              { key: "job_title", label: "Job Title" },
              { key: "employment_type", label: "Type" },
              { key: "hire_date", label: "Hired", render: fmt },
              { key: "is_manager", label: "Manager", render: v => v ? "✓" : "" },
            ]} />
          </div>
        );

      case "donations": {
        const total = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
        return (
          <div className="ss-card">
            <h2 className="ss-section-title">Donations</h2>
            <div className="ss-stat-grid" style={{ marginBottom: 24 }}>
              <div className="ss-stat"><span className="ss-stat-value">{donations.length}</span><span className="ss-stat-label">Total Donations</span></div>
              <div className="ss-stat"><span className="ss-stat-value">{currency(total)}</span><span className="ss-stat-label">Total Amount</span></div>
            </div>
          </div>
        );
      }

      case "password":
        return (
          <div className="ss-card" style={{ maxWidth: 420 }}>
            <h2 className="ss-section-title">Change Password</h2>
            <form className="ss-form" onSubmit={handlePasswordChange}>
              <div className="ss-form-group">
                <label>New Password (min. 6 characters)</label>
                <PasswordInput value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
                {pwErrors.new_password && <span className="error">{pwErrors.new_password}</span>}
              </div>
              <div className="ss-form-group">
                <label>Confirm New Password</label>
                <PasswordInput value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} />
                {pwErrors.confirm_password && <span className="error">{pwErrors.confirm_password}</span>}
              </div>
              <div className="ss-form-actions">
                <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
                  {saving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        );

      default:
        return <div className="ss-empty">Select a tab from above</div>;
    }
  };

  // Build tab list: base tabs + team tab if manager
  let baseTabs = [...permissions.tabs];
  if (isManager && !baseTabs.includes('team')) {
    baseTabs.push('team');
  }
  // Remove 'password' from base tabs (we'll add it at the end)
  baseTabs = baseTabs.filter(t => t !== 'password');
  const displayTabs = [...baseTabs, 'password'];

  return (
    <div className="dashboard-page employee-dashboard">
      <div className="dashboard-hero employee-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <span className="dashboard-role-badge employee-badge">
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
                  {tab === "jobinfo" ? "Job Info" :
                    tab === "artwork" ? "Artworks" :
                      tab === "giftshop" ? "Gift Shop" :
                        tab === "transactions" ? "Transactions" :
                          tab === "password" ? "Change Password" :
                            tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {feedback && <div className={`ss-feedback ${feedback.type}`}>{feedback.msg}</div>}
            {renderContent()}
          </>
        )}
      </div>

      <EditModal
        isOpen={!!editingItem}
        item={editingItem}
        fields={getEditFields(editType)}
        onSave={handleSaveEdit}
        onClose={() => setEditingItem(null)}
      />
      <MembershipActionModal
        isOpen={actionModalOpen}
        member={selectedMember}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={refreshMembers}
        notify={notify}
      />
    </div>
  );
}