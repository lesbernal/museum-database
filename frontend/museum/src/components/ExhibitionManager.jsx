// components/ExhibitionManager.jsx
// canDelete gates Delete only — Archive is available to all editors.
// Removed stale: import { formatToCST } from "../utils/dateUtils";

import { useState, useEffect } from "react";
import { getGalleries, getArtworks } from "../services/api";
import "../styles/ExhibitionManager.css";

const EXHIBITION_TYPES = ["Permanent", "Temporary", "Traveling"];

const SuccessToast = ({ show, editingExhibition, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ Exhibition {editingExhibition ? "updated" : "added"} successfully!</div>;
};

const ExhibitionFormModal = ({
  isOpen, editingExhibition, formData, exhibitionArtworks, galleries, artworks,
  errors, isSubmitting, selectedArtworkIds, allExhibitionArtworkIds, onSubmit, onCancel,
  onChange, onAddArtworkRow, onRemoveArtworkRow, onArtworkRowChange
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content exhibition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingExhibition ? " Edit Exhibition" : "➕ Add New Exhibition"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={onSubmit} className="exhibition-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Gallery *</label>
              <select name="gallery_id" value={formData.gallery_id} onChange={onChange} className={errors.gallery_id ? "error" : ""}>
                <option value="">Select Gallery</option>
                {galleries.map((g) => <option key={g.gallery_id} value={g.gallery_id}>{g.gallery_name}</option>)}
              </select>
              {errors.gallery_id && <span className="error-message">{errors.gallery_id}</span>}
            </div>
            <div className="form-group full-width">
              <label>Title *</label>
              <input type="text" name="exhibition_name" value={formData.exhibition_name} onChange={onChange} className={errors.exhibition_name ? "error" : ""} placeholder="e.g., Impressionism and the Sea" />
              {errors.exhibition_name && <span className="error-message">{errors.exhibition_name}</span>}
            </div>
            <div className="form-group full-width">
              <label>Exhibition Type *</label>
              <select name="exhibition_type" value={formData.exhibition_type} onChange={onChange} className={errors.exhibition_type ? "error" : ""}>
                <option value="">Select Type</option>
                {EXHIBITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.exhibition_type && <span className="error-message">{errors.exhibition_type}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={onChange} className={errors.start_date ? "error" : ""} />
                {errors.start_date && <span className="error-message">{errors.start_date}</span>}
              </div>
              <div className="form-group">
                <label>End Date {formData.exhibition_type !== "Permanent" && "*"}</label>
                <input type="date" name="end_date" value={formData.exhibition_type === "Permanent" ? "" : formData.end_date} onChange={onChange} disabled={formData.exhibition_type === "Permanent"} placeholder={formData.exhibition_type === "Permanent" ? "Ongoing" : ""} className={errors.end_date ? "error" : ""} />
                {formData.exhibition_type === "Permanent" && <span style={{ fontSize:11, color:"#9ca3af", marginTop:4, display:"block" }}>Permanent exhibitions are ongoing</span>}
                {errors.end_date && <span className="error-message">{errors.end_date}</span>}
              </div>
            </div>
            <div className="form-group full-width">
              <div className="section-header">
                <label>Artworks in this Exhibition</label>
                <button type="button" className="add-row-btn" onClick={onAddArtworkRow}>+ Add Artwork</button>
              </div>
              <p className="field-hint">Optionally set display dates per artwork — leave blank to inherit the exhibition dates.</p>
              {exhibitionArtworks.length === 0 ? <p className="empty-hint">No artworks added yet.</p> : (
                <div className="artwork-rows">
                  {exhibitionArtworks.map((row, idx) => (
                    <div key={idx} className="artwork-row">
                      <div className="artwork-row-fields">
                        <div className="form-group artwork-select-group">
                          <label>Artwork *</label>
                          <select value={row.artwork_id} onChange={(e) => onArtworkRowChange(idx, "artwork_id", e.target.value)} className={errors.artworks?.[idx]?.artwork_id ? "error" : ""}>
                            <option value="">Select Artwork</option>
                            {artworks.map((artwork) => {
                              const isSelectedElsewhere = selectedArtworkIds.includes(String(artwork.artwork_id)) && String(artwork.artwork_id) !== String(row.artwork_id);
                              const isInAnother = allExhibitionArtworkIds.includes(String(artwork.artwork_id)) && !selectedArtworkIds.includes(String(artwork.artwork_id));
                              return (
                                <option key={artwork.artwork_id} value={artwork.artwork_id} disabled={isSelectedElsewhere || isInAnother}>
                                  {artwork.title}{isSelectedElsewhere ? " (already added)" : ""}{isInAnother ? " (in another exhibition)" : ""}
                                </option>
                              );
                            })}
                          </select>
                          {errors.artworks?.[idx]?.artwork_id && <span className="error-message">{errors.artworks[idx].artwork_id}</span>}
                        </div>
                        <div className="form-group">
                          <label>Display Start</label>
                          <input type="date" value={row.display_start_date} onChange={(e) => onArtworkRowChange(idx, "display_start_date", e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Display End</label>
                          <input type="date" value={row.display_end_date} onChange={(e) => onArtworkRowChange(idx, "display_end_date", e.target.value)} className={errors.artworks?.[idx]?.display_end_date ? "error" : ""} />
                          {errors.artworks?.[idx]?.display_end_date && <span className="error-message">{errors.artworks[idx].display_end_date}</span>}
                        </div>
                      </div>
                      <button type="button" className="remove-row-btn" onClick={() => onRemoveArtworkRow(idx)} title="Remove artwork">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingExhibition ? "Update Exhibition" : "Add Exhibition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ExhibitionManager({
  exhibitions: externalExhibitions,
  onAdd, onUpdate, onDelete, onArchive,
  loading: externalLoading,
  error: externalError,
  canDelete = true,
}) {
  const [isFormOpen,             setIsFormOpen]             = useState(false);
  const [editingExhibition,      setEditingExhibition]      = useState(null);
  const [galleries,              setGalleries]              = useState([]);
  const [artworks,               setArtworks]               = useState([]);
  const [searchTerm,             setSearchTerm]             = useState("");
  const [showSuccessToast,       setShowSuccessToast]       = useState(false);
  const [exhibitionArtworks,     setExhibitionArtworks]     = useState([]);
  const [allExhibitionArtworkIds,setAllExhibitionArtworkIds]= useState([]);
  const [formData, setFormData] = useState({ gallery_id:"", exhibition_name:"", start_date:"", end_date:"", exhibition_type:"" });
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { getGalleries().then(setGalleries).catch(console.error); }, []);
  useEffect(() => { getArtworks().then(setArtworks).catch(console.error); }, []);

  useEffect(() => {
    if (editingExhibition) {
      setFormData({ gallery_id:editingExhibition.gallery_id||"", exhibition_name:editingExhibition.exhibition_name||"", start_date:editingExhibition.start_date?new Date(editingExhibition.start_date).toISOString().split("T")[0]:"", end_date:editingExhibition.end_date?new Date(editingExhibition.end_date).toISOString().split("T")[0]:"", exhibition_type:editingExhibition.exhibition_type||"" });
      setExhibitionArtworks((editingExhibition.artworks||[]).map((a) => ({ artwork_id:String(a.artwork_id), display_start_date:a.display_start_date?new Date(a.display_start_date).toISOString().split("T")[0]:"", display_end_date:a.display_end_date?new Date(a.display_end_date).toISOString().split("T")[0]:"" })));
    } else {
      setFormData({ gallery_id:"", exhibition_name:"", start_date:"", end_date:"", exhibition_type:"" });
      setExhibitionArtworks([]);
    }
  }, [editingExhibition]);

  const filteredExhibitions = externalExhibitions.filter(e =>
    e.exhibition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.exhibition_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.gallery_id) newErrors.gallery_id = "Gallery is required";
    if (!formData.exhibition_name.trim()) newErrors.exhibition_name = "Title is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date && formData.exhibition_type !== "Permanent") newErrors.end_date = "End date is required";
    if (!formData.exhibition_type) newErrors.exhibition_type = "Exhibition type is required";
    if (formData.start_date && formData.end_date && formData.exhibition_type !== "Permanent" && formData.end_date < formData.start_date) newErrors.end_date = "End date must be after start date";
    const artworkErrors = {};
    exhibitionArtworks.forEach((row, idx) => {
      const rowErrors = {};
      if (!row.artwork_id) rowErrors.artwork_id = "Select an artwork";
      if (row.display_start_date && row.display_end_date && row.display_end_date < row.display_start_date) rowErrors.display_end_date = "End must be after start";
      if (Object.keys(rowErrors).length > 0) artworkErrors[idx] = rowErrors;
    });
    if (Object.keys(artworkErrors).length > 0) newErrors.artworks = artworkErrors;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "exhibition_type") {
      if (value === "Permanent") {
        const today = new Date().toISOString().split("T")[0];
        setFormData(prev => ({ ...prev, exhibition_type:value, start_date:prev.start_date||today, end_date:"2099-12-31" }));
      } else {
        setFormData(prev => ({ ...prev, exhibition_type:value, end_date:prev.end_date==="2099-12-31"?"":prev.end_date }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddArtworkRow    = () => setExhibitionArtworks(prev => [...prev, { artwork_id:"", display_start_date:"", display_end_date:"" }]);
  const handleRemoveArtworkRow = (idx) => setExhibitionArtworks(prev => prev.filter((_, i) => i !== idx));
  const handleArtworkRowChange = (idx, field, value) => {
    setExhibitionArtworks(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    if (field === "artwork_id" && value) {
      const isDuplicate = exhibitionArtworks.some((row, i) => i !== idx && String(row.artwork_id) === String(value));
      setErrors(prev => ({ ...prev, artworks: { ...prev.artworks, [idx]: { ...prev.artworks?.[idx], artwork_id: isDuplicate ? "Artwork is already in this exhibition" : null } } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingExhibition) await onUpdate(editingExhibition.exhibition_id, { ...formData, artworks: exhibitionArtworks });
      else                   await onAdd({ ...formData, artworks: exhibitionArtworks });
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingExhibition(null);
      setFormData({ gallery_id:"", exhibition_name:"", start_date:"", end_date:"", exhibition_type:"" });
      setExhibitionArtworks([]);
    } catch (err) {
      setErrors(prev => ({ ...prev, submit:"Failed to save exhibition. Please try again." }));
    } finally { setIsSubmitting(false); }
  };

  const handleAddClick = async () => {
    setEditingExhibition(null);
    setFormData({ gallery_id:"", exhibition_name:"", start_date:"", end_date:"", exhibition_type:"" });
    setExhibitionArtworks([]);
    setErrors({});
    try {
      const results = await Promise.all(externalExhibitions.map(e => fetch(`${import.meta.env.VITE_API_URL}/exhibitionartwork/${e.exhibition_id}`).then(r => r.json())));
      setAllExhibitionArtworkIds(results.flat().map(a => String(a.artwork_id)));
    } catch { /* ignore */ }
    setIsFormOpen(true);
  };

  const handleEditClick = async (exhibition) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/exhibitionartwork/${exhibition.exhibition_id}`);
      const artworksData = await res.json();
      setEditingExhibition({ ...exhibition, artworks: artworksData });
      const others = externalExhibitions.filter(e => e.exhibition_id !== exhibition.exhibition_id);
      const results = await Promise.all(others.map(e => fetch(`${import.meta.env.VITE_API_URL}/exhibitionartwork/${e.exhibition_id}`).then(r => r.json())));
      setAllExhibitionArtworkIds(results.flat().map(a => String(a.artwork_id)));
    } catch { setEditingExhibition(exhibition); }
    setIsFormOpen(true);
  };

  // ── Delete with warning confirm ───────────────────────────────────────────
  const handleDelete = async (exhibition) => {
    if (!window.confirm(
      `Permanently delete "${exhibition.exhibition_name}"?\n\n` +
      `This will also remove all artwork associations for this exhibition. This action cannot be undone.\n\n` +
      `To hide it temporarily instead, use Archive.`
    )) return;
    await onDelete(exhibition.exhibition_id);
  };

  const handleCancel = () => { setIsFormOpen(false); setEditingExhibition(null); setErrors({}); };
  const selectedArtworkIds = exhibitionArtworks.map((r) => String(r.artwork_id)).filter(Boolean);

  const getTypeBadgeClass = (type) => ({ Permanent:"badge-permanent", Temporary:"badge-temporary", Traveling:"badge-traveling" }[type] || "");
  const formatDate = (dateStr) => { if (!dateStr) return "—"; return new Date(dateStr).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }); };
  const getDateRangeStatus = (startDate, endDate) => {
    const now = new Date();
    if (now < new Date(startDate)) return { label:"Upcoming", cls:"date-upcoming" };
    if (now > new Date(endDate))   return { label:"Ended",    cls:"date-ended" };
    return { label:"Active", cls:"date-active" };
  };

  const ExhibitionTable = () => {
    if (filteredExhibitions.length === 0) return <div className="empty-state">No exhibitions found</div>;
    return (
      <div className="exhibition-table-container">
        <table className="exhibition-table">
          <thead><tr><th>ID</th><th>Title</th><th>Gallery</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredExhibitions.map((exhibition) => {
              const dateStatus = getDateRangeStatus(exhibition.start_date, exhibition.end_date);
              return (
                <tr key={exhibition.exhibition_id}>
                  <td>{exhibition.exhibition_id}</td>
                  <td className="title-cell">{exhibition.exhibition_name}</td>
                  <td>{exhibition.gallery_name || "—"}</td>
                  <td><span className={`status-badge ${getTypeBadgeClass(exhibition.exhibition_type)}`}>{exhibition.exhibition_type || "Unknown"}</span></td>
                  <td>{formatDate(exhibition.start_date)}</td>
                  <td>{formatDate(exhibition.end_date)}</td>
                  <td><span className={`date-status ${dateStatus.cls}`}>{dateStatus.label}</span></td>
                  <td className="actions">
                    <button className="edit-btn" onClick={() => handleEditClick(exhibition)} title="Edit">Edit</button>
                    <button className="archive-btn" onClick={() => onArchive(exhibition.exhibition_id)} title="Archive">Archive</button>
                    {canDelete && (
                      <button className="delete-btn" onClick={() => handleDelete(exhibition)} title="Delete">Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="exhibition-manager">
      <SuccessToast show={showSuccessToast} editingExhibition={editingExhibition} onClose={() => setShowSuccessToast(false)} />
      <div className="exhibition-manager-header">
        <div className="search-bar">
          <input type="text" placeholder="Search exhibitions by title, type, or gallery..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="add-btn" onClick={handleAddClick}>+ Add New Exhibition</button>
      </div>
      <div className="content-area">
        {externalError ? <div className="error-message">{externalError}</div> : <ExhibitionTable />}
      </div>
      <ExhibitionFormModal isOpen={isFormOpen} editingExhibition={editingExhibition} formData={formData} exhibitionArtworks={exhibitionArtworks} galleries={galleries} artworks={artworks} errors={errors} isSubmitting={isSubmitting} selectedArtworkIds={selectedArtworkIds} allExhibitionArtworkIds={allExhibitionArtworkIds} onSubmit={handleSubmit} onCancel={handleCancel} onChange={handleChange} onAddArtworkRow={handleAddArtworkRow} onRemoveArtworkRow={handleRemoveArtworkRow} onArtworkRowChange={handleArtworkRowChange} />
    </div>
  );
}