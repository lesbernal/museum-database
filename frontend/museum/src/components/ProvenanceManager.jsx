// components/ProvenanceManager.jsx
// canDelete gates the Delete button — regular employees can Edit only.

import { useState, useEffect } from "react";
import { getArtworks } from "../services/api";
import "../styles/ProvenanceManager.css";

const SuccessToast = ({ show, message, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ {message}</div>;
};

const ProvenanceFormModal = ({ isOpen, editingProvenance, formData, artworks, errors, isSubmitting, onSubmit, onCancel, onChange }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content provenance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProvenance ? "Edit Provenance" : "Add Provenance Record"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={onSubmit} className="provenance-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Artwork *</label>
              <select name="artwork_id" value={formData.artwork_id} onChange={onChange} className={errors.artwork_id ? "error" : ""}>
                <option value="">Select Artwork</option>
                {artworks.map(artwork => (
                  <option key={artwork.artwork_id} value={artwork.artwork_id}>
                    {artwork.title} ({artwork.creation_year || "Year unknown"})
                  </option>
                ))}
              </select>
              {errors.artwork_id && <span className="error-message">{errors.artwork_id}</span>}
            </div>
            <div className="form-group full-width">
              <label>Owner Name *</label>
              <input type="text" name="owner_name" value={formData.owner_name} onChange={onChange} placeholder="e.g., Private Collection, New York" className={errors.owner_name ? "error" : ""} />
              {errors.owner_name && <span className="error-message">{errors.owner_name}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Acquisition Date *</label>
                <input type="date" name="acquisition_date" value={formData.acquisition_date} onChange={onChange} className={errors.acquisition_date ? "error" : ""} />
                {errors.acquisition_date && <span className="error-message">{errors.acquisition_date}</span>}
              </div>
              <div className="form-group">
                <label>Transfer Date *</label>
                <input type="date" name="transfer_date" value={formData.transfer_date} onChange={onChange} className={errors.transfer_date ? "error" : ""} />
                {errors.transfer_date && <span className="error-message">{errors.transfer_date}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Acquisition Method *</label>
                <select name="acquisition_method" value={formData.acquisition_method} onChange={onChange} className={errors.acquisition_method ? "error" : ""}>
                  <option value="">Select Method</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Donation">Donation</option>
                  <option value="Inheritance">Inheritance</option>
                  <option value="Bequest">Bequest</option>
                  <option value="Exchange">Exchange</option>
                  <option value="Transfer">Transfer</option>
                </select>
                {errors.acquisition_method && <span className="error-message">{errors.acquisition_method}</span>}
              </div>
              <div className="form-group">
                <label>Price Paid ($)</label>
                <input type="number" name="price_paid" value={formData.price_paid} onChange={onChange} placeholder="25000000" step="0.01" />
                {errors.price_paid && <span className="error-message">{errors.price_paid}</span>}
              </div>
            </div>
          </div>
          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingProvenance ? "Update Provenance" : "Add Provenance")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProvenanceManager({
  provenance: externalProvenance,
  onAdd,
  onUpdate,
  onDelete,
  loading: externalLoading,
  error: externalError,
  // canDelete gates the Delete button — only managers can delete provenance records
  canDelete = true,
}) {
  const [isFormOpen,        setIsFormOpen]        = useState(false);
  const [editingProvenance, setEditingProvenance] = useState(null);
  const [artworks,          setArtworks]          = useState([]);
  const [showSuccessToast,  setShowSuccessToast]  = useState(false);
  const [toastMessage,      setToastMessage]      = useState("");
  const [formData, setFormData] = useState({ artwork_id:"", owner_name:"", acquisition_date:"", acquisition_method:"", price_paid:"", transfer_date:"" });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { getArtworks().then(setArtworks).catch(console.error); }, []);

  useEffect(() => {
    if (editingProvenance) {
      setFormData({
        artwork_id:         editingProvenance.artwork_id,
        owner_name:         editingProvenance.owner_name || "",
        acquisition_date:   editingProvenance.acquisition_date   ? new Date(editingProvenance.acquisition_date).toISOString().split("T")[0]   : "",
        acquisition_method: editingProvenance.acquisition_method || "",
        price_paid:         editingProvenance.price_paid          || "",
        transfer_date:      editingProvenance.transfer_date       ? new Date(editingProvenance.transfer_date).toISOString().split("T")[0]       : "",
      });
    } else {
      setFormData({ artwork_id:"", owner_name:"", acquisition_date:"", acquisition_method:"", price_paid:"", transfer_date:"" });
    }
  }, [editingProvenance]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.artwork_id)             newErrors.artwork_id         = "Artwork is required";
    if (!formData.owner_name.trim())      newErrors.owner_name         = "Owner name is required";
    if (!formData.acquisition_date)       newErrors.acquisition_date   = "Acquisition date is required";
    if (!formData.acquisition_method)     newErrors.acquisition_method = "Acquisition method is required";
    if (!formData.transfer_date)          newErrors.transfer_date      = "Transfer date is required";
    if (formData.price_paid) {
      const p = parseFloat(formData.price_paid);
      if (isNaN(p) || p < 0) newErrors.price_paid = "Please enter a valid amount";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingProvenance) {
        await onUpdate(editingProvenance.provenance_id, formData);
        setToastMessage("Provenance record updated successfully!");
      } else {
        await onAdd(formData);
        setToastMessage("Provenance record added successfully!");
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingProvenance(null);
      setFormData({ artwork_id:"", owner_name:"", acquisition_date:"", acquisition_method:"", price_paid:"", transfer_date:"" });
    } catch (err) {
      setErrors(prev => ({ ...prev, submit:"Failed to save provenance record. Please try again." }));
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (provenanceId) => {
    if (window.confirm("Delete this provenance record? This action cannot be undone.")) {
      await onDelete(provenanceId);
      setToastMessage("Provenance record deleted.");
      setShowSuccessToast(true);
    }
  };

  const handleAddClick  = () => { setEditingProvenance(null); setFormData({ artwork_id:"", owner_name:"", acquisition_date:"", acquisition_method:"", price_paid:"", transfer_date:"" }); setErrors({}); setIsFormOpen(true); };
  const handleEditClick = (record) => { setEditingProvenance(record); setIsFormOpen(true); };
  const handleCancel    = () => { setIsFormOpen(false); setEditingProvenance(null); setErrors({}); };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:0, maximumFractionDigits:0 }).format(price);
  };

  const ProvenanceTable = () => {
    if (externalProvenance.length === 0) return <div className="empty-state">No provenance records found</div>;
    return (
      <div className="provenance-table-container">
        <table className="provenance-table">
          <thead>
            <tr><th>ID</th><th>Artwork</th><th>Owner</th><th>Acquisition Date</th><th>Method</th><th>Price Paid</th><th>Transfer Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {externalProvenance.map(record => (
              <tr key={record.provenance_id}>
                <td>{record.provenance_id}</td>
                <td className="artwork-cell">{record.artwork_title || `Artwork #${record.artwork_id}`}</td>
                <td>{record.owner_name}</td>
                <td>{record.acquisition_date || "—"}</td>
                <td><span className={`method-badge method-${record.acquisition_method?.toLowerCase()}`}>{record.acquisition_method || "—"}</span></td>
                <td>{formatPrice(record.price_paid)}</td>
                <td>{record.transfer_date || "—"}</td>
                <td className="actions">
                  {/* Edit — always available to anyone with tab access */}
                  <button className="edit-btn" onClick={() => handleEditClick(record)} title="Edit">Edit</button>
                  {/* Delete — managers only (canDelete) */}
                  {canDelete && (
                    <button className="delete-btn" onClick={() => handleDelete(record.provenance_id)} title="Delete">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="provenance-manager">
      <SuccessToast show={showSuccessToast} message={toastMessage} onClose={() => setShowSuccessToast(false)} />
      <div className="provenance-manager-header">
        <button className="add-btn" onClick={handleAddClick}>+ Add Provenance Record</button>
      </div>
      <div className="content-area">
        {externalError ? <div className="error-message">{externalError}</div> : <ProvenanceTable />}
      </div>
      <ProvenanceFormModal isOpen={isFormOpen} editingProvenance={editingProvenance} formData={formData} artworks={artworks} errors={errors} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={handleCancel} onChange={handleChange} />
    </div>
  );
}