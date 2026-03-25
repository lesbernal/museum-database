// components/UserManagement.jsx
// Drop-in for the "coming soon" users tab in AdminDashboard.
// Import and use where the coming-soon div is.

import { useState, useEffect, useCallback } from "react";
import {
  getUsers,     createUser,     updateUser,     deleteUser,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getVisitors,  createVisitor,  updateVisitor,  deleteVisitor,
  getMembers,   createMember,   updateMember,   deleteMember,
} from "../services/api";
import "../styles/UserManagement.css";

const SUB_TABS = [
  { id: "users",     label: "Users",     icon: "👤" },
  { id: "employees", label: "Employees", icon: "🏢" },
  { id: "visitors",  label: "Visitors",  icon: "🏛️" },
  { id: "members",   label: "Members",   icon: "⭐" },
];

const FIELDS = {
  users: [
    { key: "first_name",     label: "First Name",    required: true },
    { key: "last_name",      label: "Last Name",     required: true },
    { key: "email",          label: "Email",         required: true, type: "email" },
    { key: "password",       label: "Password",      required: true, type: "password", addOnly: true },
    { key: "role",           label: "Role",          type: "select",
      options: ["visitor", "member", "employee", "admin"] },
    { key: "phone_number",   label: "Phone" },
    { key: "street_address", label: "Street Address", full: true },
    { key: "city",           label: "City" },
    { key: "state",          label: "State" },
    { key: "zip_code",       label: "Zip Code" },
    { key: "date_of_birth",  label: "Date of Birth", type: "date" },
  ],
  employees: [
    { key: "user_id",         label: "User ID",         required: true, editDisabled: true },
    { key: "department_id",   label: "Department ID",   required: true, type: "number" },
    { key: "job_title",       label: "Job Title",       required: true },
    { key: "hire_date",       label: "Hire Date",       required: true, type: "date" },
    { key: "salary",          label: "Salary",          required: true, type: "number" },
    { key: "employment_type", label: "Employment Type", type: "select",
      options: ["Full-Time", "Part-Time", "Contract", "Intern"] },
  ],
  visitors: [
    { key: "user_id",         label: "User ID",           required: true, editDisabled: true },
    { key: "last_visit_date", label: "Last Visit Date",   required: true, type: "date" },
    { key: "total_visits",    label: "Total Visits",      required: true, type: "number" },
  ],
  members: [
    { key: "user_id",          label: "User ID",          required: true, editDisabled: true },
    { key: "membership_level", label: "Membership Level", required: true, type: "select",
      options: ["Bronze", "Silver", "Gold", "Platinum"] },
    { key: "join_date",        label: "Join Date",        required: true, type: "date" },
    { key: "expiration_date",  label: "Expiration Date",  required: true, type: "date" },
  ],
};

const TABLE_COLS = {
  users:     ["user_id", "first_name", "last_name", "email", "role", "city"],
  employees: ["user_id", "first_name", "last_name", "job_title", "department_id", "employment_type", "salary"],
  visitors:  ["user_id", "first_name", "last_name", "email", "last_visit_date", "total_visits"],
  members:   ["user_id", "first_name", "last_name", "email", "membership_level", "join_date", "expiration_date"],
};

const API = {
  users:     { get: getUsers,     create: createUser,     update: updateUser,     del: deleteUser },
  employees: { get: getEmployees, create: createEmployee, update: updateEmployee, del: deleteEmployee },
  visitors:  { get: getVisitors,  create: createVisitor,  update: updateVisitor,  del: deleteVisitor },
  members:   { get: getMembers,   create: createMember,   update: updateMember,   del: deleteMember },
};

export default function UserManagement() {
  const [subTab,       setSubTab]       = useState("users");
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await API[subTab].get();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => { load(); setSearch(""); }, [load]);

  const fields    = FIELDS[subTab];
  const tableCols = TABLE_COLS[subTab];

  const filtered = records.filter(r =>
    tableCols.some(col =>
      String(r[col] ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd    = () => { setForm({}); setModal("add"); };
  const openEdit   = (r) => { setForm({ ...r }); setSelected(r); setModal("edit"); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        await API[subTab].create(form);
        notify("Record created");
      } else {
        await API[subTab].update(selected.user_id, form);
        notify("Record updated");
      }
      closeModal();
      load();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (r) => { setDeleteTarget(r); setModal("confirm"); };
  const handleDelete  = async () => {
    try {
      await API[subTab].del(deleteTarget.user_id);
      notify("Record deleted");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setDeleteTarget(null);
      setModal(null);
      load();
    }
  };

  return (
    <div className="um-wrap">
      {/* Sub-tab bar */}
      <div className="um-subtabs">
        {SUB_TABS.map(t => (
          <button key={t.id}
            className={`um-subtab ${subTab === t.id ? "active" : ""}`}
            onClick={() => { setSubTab(t.id); closeModal(); }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="um-toolbar">
        <input className="um-search" placeholder={`Search ${subTab}…`}
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="um-btn um-btn-primary" onClick={openAdd}>
          + Add {subTab.slice(0, -1)}
        </button>
        <button className="um-btn" onClick={load}>↻ Refresh</button>
      </div>

      {feedback && <div className={`um-feedback ${feedback.type}`}>{feedback.msg}</div>}

      {/* Table */}
      <div className="um-table-wrap">
        {loading ? (
          <div className="um-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="um-empty">No records found</div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                {tableCols.map(c => <th key={c}>{c.replace(/_/g, " ")}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.user_id}>
                  {tableCols.map(c => (
                    <td key={c}>
                      {c === "salary" && r[c]
                        ? `$${Number(r[c]).toLocaleString()}`
                        : c === "role"
                        ? <span className={`um-badge um-badge-${r[c]}`}>{r[c]}</span>
                        : c === "membership_level"
                        ? <span className="um-badge um-badge-member">{r[c]}</span>
                        : String(r[c] ?? "—").slice(0, 10)}
                    </td>
                  ))}
                  <td>
                    <div className="um-actions">
                      <button className="um-btn um-btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="um-btn um-btn-sm um-btn-danger" onClick={() => confirmDelete(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="um-overlay" onClick={closeModal}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{modal === "add" ? `Add ${subTab.slice(0,-1)}` : `Edit ${subTab.slice(0,-1)}`}</h3>
              <button className="um-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-grid">
                {fields
                  .filter(f => !(f.addOnly && modal === "edit"))
                  .map(f => (
                  <div className={`um-form-group${f.full ? " full" : ""}`} key={f.key}>
                    <label>{f.label}{f.required ? " *" : ""}</label>
                    {f.type === "select" ? (
                      <select value={form[f.key] || ""}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                        <option value="">— Select —</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={form[f.key] || ""}
                        disabled={f.editDisabled && modal === "edit"}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={closeModal}>Cancel</button>
              <button className="um-btn um-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {modal === "confirm" && deleteTarget && (
        <div className="um-overlay" onClick={() => { setModal(null); setDeleteTarget(null); }}>
          <div className="um-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Confirm Delete</h3>
              <button className="um-modal-close" onClick={() => { setModal(null); setDeleteTarget(null); }}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Delete record #{deleteTarget.user_id}? This cannot be undone.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={() => { setModal(null); setDeleteTarget(null); }}>Cancel</button>
              <button className="um-btn um-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}