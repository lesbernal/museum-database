// components/DepartmentManagement.jsx

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/api";
import "../styles/UserManagement.css";

const TABLE_COLS = ["department_id", "department_name", "budget", "phone_extension"];

const FIELDS = [
  { key: "department_id", label: "Department ID", required: true, editDisabled: true },
  { key: "department_name", label: "Department Name", required: true, full: true },
  { key: "budget", label: "Budget ($)", required: true, type: "number" },
  { key: "phone_extension", label: "Phone Extension", required: true, type: "text", maxLength: 3 },
];

const DepartmentManagement = forwardRef(function DepartmentManagement({ searchTerm = "" }, ref) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const notify = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Expose openAdd to parent via ref
  useImperativeHandle(ref, () => ({
    openAdd: () => { setForm({}); setModal("add"); }
  }));

  const filtered = records.filter(r =>
    TABLE_COLS.some(col =>
      String(r[col] ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEdit = (r) => { setForm({ ...r }); setSelected(r); setModal("edit"); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        await createDepartment(form);
        notify("Department created");
      } else {
        await updateDepartment(selected.department_id, form);
        notify("Department updated");
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
  const handleDelete = async () => {
    try {
      await deleteDepartment(deleteTarget.department_id);
      notify("Department deleted");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setDeleteTarget(null);
      setModal(null);
      load();
    }
  };

  const renderCell = (r, col) => {
    if (col === "budget") return `$${Number(r[col]).toLocaleString()}`;
    return String(r[col] ?? "—");
  };

  return (
    <div className="um-wrap">
      {feedback && <div className={`um-feedback ${feedback.type}`}>{feedback.msg}</div>}

      <div className="um-table-container">
        {loading ? (
          <div className="um-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="um-empty">No departments found</div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                {TABLE_COLS.map(c => <th key={c}>{c.replace(/_/g, " ")}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.department_id}>
                  {TABLE_COLS.map(c => <td key={c}>{renderCell(r, c)}</td>)}
                  <td>
                    <div className="um-actions">
                      <button className="um-edit-btn" onClick={() => openEdit(r)} title="Edit">Edit</button>
                      <button className="um-delete-btn" onClick={() => confirmDelete(r)} title="Delete">Delete</button>
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
              <h3>{modal === "add" ? "Add Department" : "Edit Department"}</h3>
              <button className="um-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-grid">
                {FIELDS.map(f => (
                  <div className={`um-form-group${f.full ? " full" : ""}`} key={f.key}>
                    <label>{f.label}{f.required ? " *" : ""}</label>
                    <input
                      type={f.type || "text"}
                      value={form[f.key] || ""}
                      disabled={f.editDisabled && modal === "edit"}
                      maxLength={f.maxLength || undefined}
                      onChange={e => {
                        let val = e.target.value;
                        if (f.key === "phone_extension") {
                          val = val.replace(/\D/g, "").slice(0, 3);
                        }
                        setForm(p => ({ ...p, [f.key]: val }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="um-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {modal === "confirm" && deleteTarget && (
        <div className="um-overlay" onClick={() => { setModal(null); setDeleteTarget(null); }}>
          <div className="um-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Confirm Delete</h3>
              <button className="um-modal-close" onClick={() => { setModal(null); setDeleteTarget(null); }}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Delete <strong>{deleteTarget.department_name}</strong>? This cannot be undone.
                Employees assigned to this department will lose their department assignment.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="um-cancel-btn" onClick={() => { setModal(null); setDeleteTarget(null); }}>Cancel</button>
              <button className="um-delete-btn" style={{ padding: "0.625rem 1.25rem", borderRadius: 4 }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DepartmentManagement;