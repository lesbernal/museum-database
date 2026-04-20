// components/ArtworkManager.jsx
// canDelete prop gates the Archive button — regular employees can Edit only.

import { useState, useEffect, useRef } from "react";
import { getArtists } from "../services/api";
import "../styles/ArtworkManager.css";

const mediumOptions = [
  "Oil on canvas","Oil on panel","Oil on masonite","Oil on wood",
  "Acrylic on canvas","Watercolor on paper","Pastel on paper",
  "Silkscreen ink on canvas","Synthetic polymer paint on canvas",
  "Enamel on canvas","Oil, enamel, aluminum paint on canvas",
  "Bronze","Steel, silver, tapestry, wood","Color engraving on wood",
  "Fresco study","Photograph","Digital print","Mixed media","Sculpture","Installation"
];

const ArtworkFormModal = ({ isOpen, editingArtwork, form, errors, isSubmitting, uploading, imagePreview, fileInputRef, artists, onSubmit, onCancel, onChange, onImageUpload }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content artwork-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingArtwork ? "Edit Artwork" : "➕ Add New Artwork"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={onSubmit} className="artwork-form">
          <div className="form-image-section artwork-image-section">
            <div className="image-preview">
              {imagePreview ? <img src={imagePreview} alt="Artwork preview" /> : <div className="image-placeholder"><span>🖼️</span><p>No image</p></div>}
            </div>
            <div className="image-upload-controls">
              <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "📸 Upload Image"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display:"none" }} />
              <p className="upload-hint">Or paste image URL below:</p>
              <input type="text" name="image_url" placeholder="https://example.com/artwork-image.jpg" value={form.image_url} onChange={onChange} className="image-url-input" />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Artist *</label>
              <select name="artist_id" value={form.artist_id} onChange={onChange} className={errors.artist_id ? "error" : ""}>
                <option value="">Select Artist</option>
                {artists.map(a => <option key={a.artist_id} value={a.artist_id}>{a.first_name} {a.last_name}</option>)}
              </select>
              {errors.artist_id && <span className="error-message">{errors.artist_id}</span>}
            </div>
            <div className="form-group full-width">
              <label>Title *</label>
              <input type="text" name="title" value={form.title} onChange={onChange} className={errors.title ? "error" : ""} placeholder="e.g., Water Lilies" />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={onChange} placeholder="Describe the artwork..." rows="4" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Creation Year</label>
                <input type="number" name="creation_year" value={form.creation_year} onChange={onChange} placeholder="1916" min="0" max={new Date().getFullYear()} />
                {errors.creation_year && <span className="error-message">{errors.creation_year}</span>}
              </div>
              <div className="form-group">
                <label>Medium *</label>
                <select name="medium" value={form.medium} onChange={onChange} className={errors.medium ? "error" : ""}>
                  <option value="">Select medium</option>
                  {mediumOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.medium && <span className="error-message">{errors.medium}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dimensions *</label>
                <input type="text" name="dimensions" value={form.dimensions} onChange={onChange} placeholder="24 x 30 in" className={errors.dimensions ? "error" : ""} />
                {errors.dimensions && <span className="error-message">{errors.dimensions}</span>}
              </div>
              <div className="form-group">
                <label>Acquisition Date *</label>
                <input type="date" name="acquisition_date" value={form.acquisition_date} onChange={onChange} className={errors.acquisition_date ? "error" : ""} />
                {errors.acquisition_date && <span className="error-message">{errors.acquisition_date}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Insurance Value ($)</label>
                <input type="number" name="insurance_value" value={form.insurance_value} onChange={onChange} placeholder="25000000" step="0.01" />
                {errors.insurance_value && <span className="error-message">{errors.insurance_value}</span>}
              </div>
              <div className="form-group">
                <label>Display Status</label>
                <select name="current_display_status" value={form.current_display_status} onChange={onChange}>
                  <option value="On Display">On Display</option>
                  <option value="In Storage">In Storage</option>
                  <option value="On Loan">On Loan</option>
                  <option value="Under Restoration">Under Restoration</option>
                  <option value="Deaccessioned">Deaccessioned</option>
                </select>
              </div>
            </div>
          </div>
          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingArtwork ? "Update Artwork" : "Add Artwork")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuccessToast = ({ show, message, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ {message}</div>;
};

export default function ArtworkManager({
  artworks: externalArtworks,
  onAdd,
  onUpdate,
  onArchive,
  loading: externalLoading,
  error: externalError,
  // canDelete gates Archive — only managers can archive artworks
  canDelete = true,
}) {
  const [isFormOpen,       setIsFormOpen]       = useState(false);
  const [editingArtwork,   setEditingArtwork]   = useState(null);
  const [artists,          setArtists]          = useState([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage,     setToastMessage]     = useState("");
  const [form, setForm] = useState({
    artist_id:"", title:"", description:"", creation_year:"", medium:"",
    dimensions:"", acquisition_date:"", insurance_value:"",
    current_display_status:"On Display", image_url:"",
  });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { getArtists().then(setArtists).catch(console.error); }, []);

  useEffect(() => {
    if (editingArtwork) {
      let formattedDate = "";
      if (editingArtwork.acquisition_date) {
        formattedDate = editingArtwork.acquisition_date.includes("T")
          ? editingArtwork.acquisition_date.split("T")[0]
          : editingArtwork.acquisition_date;
      }
      setForm({ artist_id:editingArtwork.artist_id||"", title:editingArtwork.title||"", description:editingArtwork.description||"", creation_year:editingArtwork.creation_year||"", medium:editingArtwork.medium||"", dimensions:editingArtwork.dimensions||"", acquisition_date:formattedDate, insurance_value:editingArtwork.insurance_value||"", current_display_status:editingArtwork.current_display_status||"On Display", image_url:editingArtwork.image_url||"" });
      if (editingArtwork.image_url) setImagePreview(editingArtwork.image_url);
    } else {
      setForm({ artist_id:"", title:"", description:"", creation_year:"", medium:"", dimensions:"", acquisition_date:"", insurance_value:"", current_display_status:"On Display", image_url:"" });
      setImagePreview(null);
    }
  }, [editingArtwork]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.artist_id)         newErrors.artist_id        = "Artist is required";
    if (!form.title.trim())      newErrors.title            = "Title is required";
    if (!form.medium.trim())     newErrors.medium           = "Medium is required";
    if (!form.dimensions.trim()) newErrors.dimensions       = "Dimensions are required";
    if (!form.acquisition_date)  newErrors.acquisition_date = "Acquisition date is required";
    if (form.creation_year) {
      const y = parseInt(form.creation_year);
      if (isNaN(y) || y < 0 || y > new Date().getFullYear()) newErrors.creation_year = "Please enter a valid year";
    }
    if (form.insurance_value) {
      const v = parseFloat(form.insurance_value);
      if (isNaN(v) || v < 0) newErrors.insurance_value = "Please enter a valid amount";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method:"POST", body:formData });
      const data = await response.json();
      if (data.success) { setImagePreview(data.data.url); setForm(prev => ({ ...prev, image_url:data.data.url })); }
      else alert("Upload failed: " + (data.error?.message || "Unknown error"));
    } catch (error) { alert("Upload failed: " + error.message); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingArtwork) {
        await onUpdate(editingArtwork.artwork_id, form);
        setToastMessage(`Artwork "${form.title}" updated successfully!`);
      } else {
        await onAdd(form);
        setToastMessage(`Artwork "${form.title}" added successfully!`);
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingArtwork(null);
    } catch (error) {
      setErrors(prev => ({ ...prev, submit:"Failed to save artwork. Please try again." }));
    } finally { setIsSubmitting(false); }
  };

  const handleArchive = async (artworkId, artworkTitle) => {
    if (window.confirm(`Archive "${artworkTitle}"? This artwork will be hidden from active views.`)) {
      await onArchive(artworkId);
      setToastMessage(`Artwork "${artworkTitle}" archived.`);
      setShowSuccessToast(true);
    }
  };

  const handleAddClick  = () => { setEditingArtwork(null); setIsFormOpen(true); };
  const handleEditClick = (artwork) => { setEditingArtwork(artwork); setIsFormOpen(true); };
  const handleCancel    = () => { setIsFormOpen(false); setEditingArtwork(null); setErrors({}); };

  const getStatusBadgeClass = (status) => ({
    "On Display":"badge-display","In Storage":"badge-storage","On Loan":"badge-loan",
    "Under Restoration":"badge-restoration","Deaccessioned":"badge-deaccessioned"
  }[status] || "");

  const ArtworkTable = () => {
    if (externalArtworks.length === 0) return <div className="empty-state">No artworks found</div>;
    return (
      <div className="artwork-table-container">
        <table className="artwork-table">
          <thead>
            <tr><th>Image</th><th>ID</th><th>Title</th><th>Artist</th><th>Year</th><th>Medium</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {externalArtworks.map(artwork => (
              <tr key={artwork.artwork_id}>
                <td className="image-cell">
                  {artwork.image_url
                    ? <img src={artwork.image_url} alt={artwork.title} className="thumbnail-image" onError={(e) => { e.target.onerror=null; e.target.style.display="none"; }} />
                    : <div className="thumbnail-placeholder">🖼️</div>}
                </td>
                <td>{artwork.artwork_id}</td>
                <td className="title-cell">{artwork.title}</td>
                <td>{artwork.artist_name || `${artwork.first_name} ${artwork.last_name}`}</td>
                <td>{artwork.creation_year || "—"}</td>
                <td>{artwork.medium || "—"}</td>
                <td><span className={`status-badge ${getStatusBadgeClass(artwork.current_display_status)}`}>{artwork.current_display_status || "Unknown"}</span></td>
                <td className="actions">
                  {/* Edit — always shown to anyone with tab access */}
                  <button className="edit-btn" onClick={() => handleEditClick(artwork)} title="Edit">Edit</button>
                  {/* Archive — managers only (canDelete) */}
                  {canDelete && (
                    <button className="archive-btn" onClick={() => handleArchive(artwork.artwork_id, artwork.title)} title="Archive">Archive</button>
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
    <div className="artwork-manager">
      <SuccessToast show={showSuccessToast} message={toastMessage} onClose={() => setShowSuccessToast(false)} />
      <div className="artwork-manager-header">
        <button className="add-btn" onClick={handleAddClick}>+ Add New Artwork</button>
      </div>
      <div className="content-area">
        {externalError ? <div className="error-message">{externalError}</div> : <ArtworkTable />}
      </div>
      <ArtworkFormModal isOpen={isFormOpen} editingArtwork={editingArtwork} form={form} errors={errors} isSubmitting={isSubmitting} uploading={uploading} imagePreview={imagePreview} fileInputRef={fileInputRef} artists={artists} onSubmit={handleSubmit} onCancel={handleCancel} onChange={handleChange} onImageUpload={handleImageUpload} />
    </div>
  );
}