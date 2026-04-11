import { useEffect, useMemo, useState } from "react";
import "../styles/OperationsManagement.css";

function formatValue(value, field) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (field?.type === "datetime") {
    return String(value).replace("T", " ").slice(0, 19);
  }

  return String(value);
}

function buildInitialForm(fields, record = null) {
  return fields.reduce((acc, field) => {
    if (record && record[field.name] !== undefined && record[field.name] !== null) {
      acc[field.name] = field.type === "date"
        ? String(record[field.name]).slice(0, 10)
        : field.type === "datetime"
          ? String(record[field.name]).replace("T", " ").slice(0, 19)
          : String(record[field.name]);
    } else {
      acc[field.name] = field.defaultValue ?? "";
    }
    return acc;
  }, {});
}

function RecordFormModal({ resource, record, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(resource.fields, record));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(resource.fields, record));
  }, [resource, record]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content operations-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{record ? `Edit ${resource.label}` : `Add ${resource.label}`}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form className="operations-form" onSubmit={handleSubmit}>
          <div className="operations-form-grid">
            {resource.fields.map((field) => {
              const isDisabled = record && field.readOnlyOnEdit;

              return (
                <div
                  className={`form-group ${field.fullWidth ? "full-width" : ""}`}
                  key={field.name}
                >
                  <label>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      disabled={isDisabled}
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "datetime" ? "text" : field.type || "text"}
                      name={field.name}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      disabled={isDisabled}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {error && <div className="error-message submit-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Saving..." : record ? `Update ${resource.label}` : `Add ${resource.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OperationsManagement({ title, description, resources }) {
  const [activeResourceId, setActiveResourceId] = useState(resources[0].id);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const activeResource = resources.find((resource) => resource.id === activeResourceId);

  async function loadResource(resource) {
    const records = await resource.load();
    setData((prev) => ({ ...prev, [resource.id]: records }));
  }

  async function loadAllResources() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(resources.map((resource) => resource.load()));
      const nextData = {};
      const errors = [];

      results.forEach((result, index) => {
        const resource = resources[index];
        if (result.status === "fulfilled") {
          nextData[resource.id] = result.value;
        } else {
          nextData[resource.id] = [];
          errors.push(`${resource.labelPlural}: ${result.reason.message}`);
        }
      });

      setData(nextData);
      setError(errors.join(" | "));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllResources();
  }, []);

  const filteredRecords = useMemo(() => {
    const records = data[activeResourceId] || [];
    if (!searchTerm.trim()) {
      return records;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return records.filter((record) =>
      activeResource.searchKeys.some((key) =>
        String(record[key] ?? "").toLowerCase().includes(lowerSearch)
      )
    );
  }, [activeResource, activeResourceId, data, searchTerm]);

  async function handleSave(form) {
    if (editingRecord) {
      await activeResource.update(editingRecord[activeResource.idKey], form);
    } else {
      await activeResource.create(form);
    }

    await loadResource(activeResource);
    setShowModal(false);
    setEditingRecord(null);
  }

  async function handleDelete(recordId) {
    const confirmed = window.confirm(`Delete this ${activeResource.label.toLowerCase()}?`);
    if (!confirmed) return;

    try {
      await activeResource.remove(recordId);
      setError("");
      await loadResource(activeResource);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="operations-management">
      <header className="operations-header">
        <div>
          <h1>{title}</h1>
          <p className="admin-subtitle">{description}</p>
        </div>
      </header>

      <div className="resource-tabs">
        {resources.map((resource) => (
          <button
            key={resource.id}
            className={`resource-tab ${activeResourceId === resource.id ? "active" : ""}`}
            onClick={() => {
              setActiveResourceId(resource.id);
              setSearchTerm("");
              setEditingRecord(null);
              setShowModal(false);
            }}
          >
            {resource.labelPlural}
          </button>
        ))}
      </div>

      <div className="operations-toolbar">
        <input
          type="text"
          placeholder={`Search ${activeResource.labelPlural.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="add-btn"
          onClick={() => {
            setEditingRecord(null);
            setShowModal(true);
          }}
        >
          Add {activeResource.label}
        </button>
      </div>

      {error && <div className="error-message dashboard-error">{error}</div>}

      <div className="content-area">
        {loading ? (
          <div className="loading-spinner">Loading {activeResource.labelPlural.toLowerCase()}...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">No {activeResource.labelPlural.toLowerCase()} found</div>
        ) : (
          <div className="operations-table-container">
            <table className="operations-table">
              <thead>
                <tr>
                  {activeResource.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record[activeResource.idKey]}>
                    {activeResource.columns.map((column) => (
                      <td key={column.key}>
                        {formatValue(record[column.key], column)}
                      </td>
                    ))}
                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingRecord(record);
                          setShowModal(true);
                        }}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(record[activeResource.idKey])}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <RecordFormModal
          resource={activeResource}
          record={editingRecord}
          onClose={() => {
            setShowModal(false);
            setEditingRecord(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
