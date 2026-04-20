// components/GalleryManager.jsx
// canDelete gates Delete only — Archive is available to all editors.
// Removed stale: import { formatToCST } from "../utils/dateUtils";

import { useState, useEffect } from "react";
import { getBuildings } from "../services/api";
import "../styles/GalleryManager.css";

const SuccessToast = ({ show, editingGallery, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ Gallery {editingGallery ? "updated" : "added"} successfully!</div>;
};

const GalleryFormModal = ({ isOpen, editingGallery, formData, buildings, errors, isSubmitting, onSubmit, onCancel, onChange }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingGallery ? "Edit Gallery" : "Add New Gallery"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={onSubmit} className="gallery-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Gallery Name *</label>
              <input type="text" name="gallery_name" value={formData.gallery_name} onChange={onChange} placeholder="e.g., Impressionist Wing" className={errors.gallery_name ? "error" : ""} />
              {errors.gallery_name && <span className="error-message">{errors.gallery_name}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Floor Number *</label>
                <input type="number" name="floor_number" value={formData.floor_number} onChange={onChange} placeholder="e.g., 2" min="1" max="10" className={errors.floor_number ? "error" : ""} />
                {errors.floor_number && <span className="error-message">{errors.floor_number}</span>}
              </div>
              <div className="form-group">
                <label>Square Footage *</label>
                <input type="number" name="square_footage" value={formData.square_footage} onChange={onChange} placeholder="e.g., 3500" min="1" max="10000" className={errors.square_footage ? "error" : ""} />
                {errors.square_footage && <span className="error-message">{errors.square_footage}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Climate Controlled *</label>
                <select name="climate_controlled" value={formData.climate_controlled} onChange={onChange} className={errors.climate_controlled ? "error" : ""}>
                  <option value="">Select...</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
                {errors.climate_controlled && <span className="error-message">{errors.climate_controlled}</span>}
              </div>
              <div className="form-group">
                <label>Museum Building *</label>
                <select name="building_id" value={formData.building_id} onChange={onChange} className={errors.building_id ? "error" : ""}>
                  <option value="">Select Building</option>
                  {buildings.map((b) => <option key={b.building_id} value={b.building_id}>{b.building_name}</option>)}
                </select>
                {errors.building_id && <span className="error-message">{errors.building_id}</span>}
              </div>
            </div>
          </div>
          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingGallery ? "Update Gallery" : "Add Gallery")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function GalleryManager({
  galleries: externalGalleries,
  onAdd, onUpdate, onDelete, onArchive,
  loading: externalLoading,
  error: externalError,
  canDelete = true,
}) {
  const [isFormOpen,       setIsFormOpen]       = useState(false);
  const [editingGallery,   setEditingGallery]   = useState(null);
  const [buildings,        setBuildings]        = useState([]);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formData, setFormData] = useState({ gallery_name:"", floor_number:"", square_footage:"", climate_controlled:"", building_id:"" });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { getBuildings().then(setBuildings).catch(console.error); }, []);

  useEffect(() => {
    if (editingGallery) {
      setFormData({ gallery_name:editingGallery.gallery_name||"", floor_number:editingGallery.floor_number??"", square_footage:editingGallery.square_footage||"", climate_controlled:editingGallery.climate_controlled??"", building_id:editingGallery.building_id||"" });
    } else {
      setFormData({ gallery_name:"", floor_number:"", square_footage:"", climate_controlled:"", building_id:"" });
    }
  }, [editingGallery]);

  const filteredGalleries = externalGalleries.filter(g =>
    g.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.gallery_name.trim()) newErrors.gallery_name = "Gallery name is required";
    if (formData.floor_number === "" || formData.floor_number === null) newErrors.floor_number = "Floor number is required";
    else if (isNaN(parseInt(formData.floor_number))) newErrors.floor_number = "Floor number must be a number";
    else if (parseInt(formData.floor_number) < 1 || parseInt(formData.floor_number) > 100) newErrors.floor_number = "Floor number must be between 1 and 100";
    if (!formData.square_footage) newErrors.square_footage = "Square footage is required";
    else if (isNaN(parseFloat(formData.square_footage)) || parseFloat(formData.square_footage) <= 0) newErrors.square_footage = "Please enter a valid square footage";
    else if (parseFloat(formData.square_footage) > 10000) newErrors.square_footage = "Square footage seems too large";
    if (formData.climate_controlled === "") newErrors.climate_controlled = "Climate control is required";
    if (!formData.building_id) newErrors.building_id = "Building is required";
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
      if (editingGallery) await onUpdate(editingGallery.gallery_id, formData);
      else                await onAdd(formData);
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingGallery(null);
      setFormData({ gallery_name:"", floor_number:"", square_footage:"", climate_controlled:"", building_id:"" });
    } catch (err) {
      setErrors(prev => ({ ...prev, submit:"Failed to save gallery. Please try again." }));
    } finally { setIsSubmitting(false); }
  };

  // ── Delete with warning confirm ───────────────────────────────────────────
  const handleDelete = async (gallery) => {
    if (!window.confirm(
      `Permanently delete "${gallery.gallery_name}"?\n\n` +
      `This will also delete all exhibitions and events associated with this gallery. This action cannot be undone.\n\n` +
      `To hide it temporarily instead, use Archive.`
    )) return;
    await onDelete(gallery.gallery_id);
  };

  const handleAddClick  = () => { setEditingGallery(null); setFormData({ gallery_name:"", floor_number:"", square_footage:"", climate_controlled:"", building_id:"" }); setErrors({}); setIsFormOpen(true); };
  const handleEditClick = (gallery) => { setEditingGallery(gallery); setIsFormOpen(true); };
  const handleCancel    = () => { setIsFormOpen(false); setEditingGallery(null); setErrors({}); };

  const formatSquareFootage = (sqft) => { if (!sqft) return "—"; return Number(sqft).toLocaleString() + " sq ft"; };
  const getOrdinalFloor = (floor) => {
    if (floor === null || floor === undefined || floor === "") return "—";
    const n = parseInt(floor);
    if (n === 0) return "Ground";
    if (n < 0) return `Basement ${Math.abs(n)}`;
    const suffix = ["th","st","nd","rd"];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  const GalleryTable = () => {
    if (filteredGalleries.length === 0) return <div className="empty-state">No galleries found</div>;
    return (
      <div className="gallery-table-container">
        <table className="gallery-table">
          <thead><tr><th>ID</th><th>Gallery Name</th><th>Building</th><th>Floor</th><th>Square Footage</th><th>Climate Control</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredGalleries.map((gallery) => (
              <tr key={gallery.gallery_id}>
                <td>{gallery.gallery_id}</td>
                <td className="title-cell">{gallery.gallery_name}</td>
                <td>{gallery.building_name || "—"}</td>
                <td>{getOrdinalFloor(gallery.floor_number)}</td>
                <td>{formatSquareFootage(gallery.square_footage)}</td>
                <td><span className={`status-badge ${gallery.climate_controlled ? "badge-standard" : "badge-none"}`}>{gallery.climate_controlled ? "Yes" : "No"}</span></td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => handleEditClick(gallery)} title="Edit">Edit</button>
                  <button className="archive-btn" onClick={() => onArchive(gallery.gallery_id)} title="Archive">Archive</button>
                  {canDelete && (
                    <button className="delete-btn" onClick={() => handleDelete(gallery)} title="Delete">Delete</button>
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
    <div className="gallery-manager">
      <SuccessToast show={showSuccessToast} editingGallery={editingGallery} onClose={() => setShowSuccessToast(false)} />
      <div className="gallery-manager-header">
        <div className="search-bar">
          <input type="text" placeholder="Search galleries by name or building..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="add-btn" onClick={handleAddClick}>+ Add New Gallery</button>
      </div>
      <div className="content-area">
        {externalError ? <div className="error-message">{externalError}</div> : <GalleryTable />}
      </div>
      <GalleryFormModal isOpen={isFormOpen} editingGallery={editingGallery} formData={formData} buildings={buildings} errors={errors} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={handleCancel} onChange={handleChange} />
    </div>
  );
}