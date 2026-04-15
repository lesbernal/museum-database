import { formatToCST } from "../utils/dateUtils";
// components/ExhibitionManager.jsx
import { useState, useEffect } from "react";
import { getGalleries, getArtworks } from "../services/api";
import "../styles/ExhibitionManager.css";

const EXHIBITION_TYPES = ["Permanent", "Temporary", "Traveling"];

// Toast Component
const SuccessToast = ({ show, editingExhibition, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return (
    <div className="toast success">
      ✅ Exhibition {editingExhibition ? "updated" : "added"} successfully!
    </div>
  );
};

// Form Modal Component
const ExhibitionFormModal = ({
  isOpen, editingExhibition, formData, exhibitionArtworks, galleries, artworks,
  errors, isSubmitting, selectedArtworkIds, onSubmit, onCancel,
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
            {/* Gallery */}
            <div className="form-group full-width">
              <label>Gallery *</label>
              <select
                name="gallery_id"
                value={formData.gallery_id}
                onChange={onChange}
                className={errors.gallery_id ? "error" : ""}
              >
                <option value="">Select Gallery</option>
                {galleries.map((gallery) => (
                  <option key={gallery.gallery_id} value={gallery.gallery_id}>
                    {gallery.gallery_name}
                  </option>
                ))}
              </select>
              {errors.gallery_id && <span className="error-message">{errors.gallery_id}</span>}
            </div>

            {/* Title */}
            <div className="form-group full-width">
              <label>Title *</label>
              <input
                type="text"
                name="exhibition_name"
                value={formData.exhibition_name}
                onChange={onChange}
                className={errors.exhibition_name ? "error" : ""}
                placeholder="e.g., Impressionism and the Sea"
              />
              {errors.exhibition_name && <span className="error-message">{errors.exhibition_name}</span>}
            </div>

            {/* Type */}
            <div className="form-group full-width">
              <label>Exhibition Type *</label>
              <select
                name="exhibition_type"
                value={formData.exhibition_type}
                onChange={onChange}
                className={errors.exhibition_type ? "error" : ""}
              >
                <option value="">Select Type</option>
                {EXHIBITION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.exhibition_type && <span className="error-message">{errors.exhibition_type}</span>}
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={onChange}
                  className={errors.start_date ? "error" : ""}
                />
                {errors.start_date && <span className="error-message">{errors.start_date}</span>}
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={onChange}
                  className={errors.end_date ? "error" : ""}
                />
                {errors.end_date && <span className="error-message">{errors.end_date}</span>}
              </div>
            </div>

            {/* Artworks */}
            <div className="form-group full-width">
              <div className="section-header">
                <label>Artworks in this Exhibition</label>
                <button type="button" className="add-row-btn" onClick={onAddArtworkRow}>
                  + Add Artwork
                </button>
              </div>
              <p className="field-hint">
                Optionally set display dates per artwork — leave blank to inherit the exhibition dates.
              </p>
              {exhibitionArtworks.length === 0 ? (
                <p className="empty-hint">No artworks added yet.</p>
              ) : (
                <div className="artwork-rows">
                  {exhibitionArtworks.map((row, idx) => (
                    <div key={idx} className="artwork-row">
                      <div className="artwork-row-fields">
                        <div className="form-group artwork-select-group">
                          <label>Artwork *</label>
                          <select
                            value={row.artwork_id}
                            onChange={(e) => onArtworkRowChange(idx, "artwork_id", e.target.value)}
                            className={errors.artworks?.[idx]?.artwork_id ? "error" : ""}
                          >
                            <option value="">Select Artwork</option>
                            {artworks.map((artwork) => {
                              const isSelectedElsewhere =
                                selectedArtworkIds.includes(String(artwork.artwork_id)) &&
                                String(artwork.artwork_id) !== String(row.artwork_id);
                              return (
                                <option
                                  key={artwork.artwork_id}
                                  value={artwork.artwork_id}
                                  disabled={isSelectedElsewhere}
                                >
                                  {artwork.title}
                                  {isSelectedElsewhere ? " (already added)" : ""}
                                </option>
                              );
                            })}
                          </select>
                          {errors.artworks?.[idx]?.artwork_id && (
                            <span className="error-message">{errors.artworks[idx].artwork_id}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Display Start</label>
                          <input
                            type="date"
                            value={row.display_start_date}
                            onChange={(e) => onArtworkRowChange(idx, "display_start_date", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Display End</label>
                          <input
                            type="date"
                            value={row.display_end_date}
                            onChange={(e) => onArtworkRowChange(idx, "display_end_date", e.target.value)}
                            className={errors.artworks?.[idx]?.display_end_date ? "error" : ""}
                          />
                          {errors.artworks?.[idx]?.display_end_date && (
                            <span className="error-message">{errors.artworks[idx].display_end_date}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => onRemoveArtworkRow(idx)}
                        title="Remove artwork"
                      >
                        ✕
                      </button>
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
  onAdd,
  onUpdate,
  onDelete,
  onArchive,
  loading: externalLoading,
  error: externalError
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [exhibitionArtworks, setExhibitionArtworks] = useState([]);
  const [formData, setFormData] = useState({
    gallery_id: "",
    exhibition_name: "",
    start_date: "",
    end_date: "",
    exhibition_type: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dropdowns
  useEffect(() => {
    loadGalleries();
    loadArtworks();
  }, []);

  // Prefill for edit
  useEffect(() => {
    if (editingExhibition) {
      setFormData({
        gallery_id: editingExhibition.gallery_id || "",
        exhibition_name: editingExhibition.exhibition_name || "",
        start_date: editingExhibition.start_date
          ? new Date(editingExhibition.start_date).toISOString().split("T")[0]
          : "",
        end_date: editingExhibition.end_date
          ? new Date(editingExhibition.end_date).toISOString().split("T")[0]
          : "",
        exhibition_type: editingExhibition.exhibition_type || "",
      });
      if (editingExhibition.artworks) {
        setExhibitionArtworks(
          editingExhibition.artworks.map((a) => ({
            artwork_id: String(a.artwork_id),
            display_start_date: a.display_start_date
              ? new Date(a.display_start_date).toISOString().split("T")[0]
              : "",
            display_end_date: a.display_end_date
              ? new Date(a.display_end_date).toISOString().split("T")[0]
              : "",
          }))
        );
      } else {
        setExhibitionArtworks([]);
      }
    } else {
      setFormData({
        gallery_id: "",
        exhibition_name: "",
        start_date: "",
        end_date: "",
        exhibition_type: "",
      });
      setExhibitionArtworks([]);
    }
  }, [editingExhibition]);

  const loadGalleries = async () => {
    try {
      const data = await getGalleries();
      setGalleries(data);
    } catch (err) {
      console.error("Failed to load galleries:", err);
    }
  };

  const loadArtworks = async () => {
    try {
      const data = await getArtworks();
      setArtworks(data);
    } catch (err) {
      console.error("Failed to load artworks:", err);
    }
  };

  // Filter exhibitions based on search term
  const filteredExhibitions = externalExhibitions.filter(exhibition =>
    exhibition.exhibition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.exhibition_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.gallery_id) newErrors.gallery_id = "Gallery is required";
    if (!formData.exhibition_name.trim()) newErrors.exhibition_name = "Title is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";
    if (!formData.exhibition_type) newErrors.exhibition_type = "Exhibition type is required";
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date must be after start date";
    }
    const artworkErrors = {};
    exhibitionArtworks.forEach((row, idx) => {
      const rowErrors = {};
      if (!row.artwork_id) rowErrors.artwork_id = "Select an artwork";
      if (row.display_start_date && row.display_end_date && row.display_end_date < row.display_start_date) {
        rowErrors.display_end_date = "End must be after start";
      }
      if (Object.keys(rowErrors).length > 0) artworkErrors[idx] = rowErrors;
    });
    if (Object.keys(artworkErrors).length > 0) newErrors.artworks = artworkErrors;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddArtworkRow = () => {
    setExhibitionArtworks([
      ...exhibitionArtworks,
      { artwork_id: "", display_start_date: "", display_end_date: "" },
    ]);
  };

  const handleRemoveArtworkRow = (idx) => {
    setExhibitionArtworks(exhibitionArtworks.filter((_, i) => i !== idx));
    if (errors.artworks?.[idx]) {
      const updated = { ...errors.artworks };
      delete updated[idx];
      setErrors({ ...errors, artworks: updated });
    }
  };

  const handleArtworkRowChange = (idx, field, value) => {
    const updated = exhibitionArtworks.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setExhibitionArtworks(updated);

    // Check for duplicate artwork selection
    if (field === "artwork_id" && value) {
      const isDuplicate = exhibitionArtworks.some(
        (row, i) => i !== idx && String(row.artwork_id) === String(value)
      );
      const updatedErrors = {
        ...errors,
        artworks: {
          ...errors.artworks,
          [idx]: {
            ...errors.artworks?.[idx],
            artwork_id: isDuplicate ? "Artwork is already in this exhibition" : null,
          },
        },
      };
      setErrors(updatedErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingExhibition) {
        await onUpdate(editingExhibition.exhibition_id, { ...formData, artworks: exhibitionArtworks });
      } else {
        await onAdd({ ...formData, artworks: exhibitionArtworks });
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingExhibition(null);
      setFormData({
        gallery_id: "",
        exhibition_name: "",
        start_date: "",
        end_date: "",
        exhibition_type: "",
      });
      setExhibitionArtworks([]);
    } catch (err) {
      console.error("Error saving exhibition:", err);
      setErrors(prev => ({ ...prev, submit: "Failed to save exhibition. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClick = () => {
    setEditingExhibition(null);
    setFormData({
      gallery_id: "",
      exhibition_name: "",
      start_date: "",
      end_date: "",
      exhibition_type: "",
    });
    setExhibitionArtworks([]);
    setErrors({});
    setIsFormOpen(true);
  };

  const handleEditClick = async (exhibition) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/exhibitionartwork/${exhibition.exhibition_id}`);
      const artworks = await res.json();
      setEditingExhibition({ ...exhibition, artworks });
    } catch (err) {
      console.error("Failed to load exhibition artworks:", err);
      setEditingExhibition(exhibition);
    }
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingExhibition(null);
    setErrors({});
  };

  const handleToastClose = () => {
    setShowSuccessToast(false);
  };

  const selectedArtworkIds = exhibitionArtworks.map((r) => String(r.artwork_id)).filter(Boolean);

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Permanent": return "badge-permanent";
      case "Temporary": return "badge-temporary";
      case "Traveling": return "badge-traveling";
      default: return "";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const getDateRangeStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return { label: "Upcoming", cls: "date-upcoming" };
    if (now > end) return { label: "Ended", cls: "date-ended" };
    return { label: "Active", cls: "date-active" };
  };

  // Exhibition Table Component
  const ExhibitionTable = () => {
    if (filteredExhibitions.length === 0) {
      return <div className="empty-state">No exhibitions found</div>;
    }

    return (
      <div className="exhibition-table-container">
        <table className="exhibition-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Gallery</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExhibitions.map((exhibition) => {
              const dateStatus = getDateRangeStatus(exhibition.start_date, exhibition.end_date);
              return (
                <tr key={exhibition.exhibition_id}>
                  <td>{exhibition.exhibition_id}</td>
                  <td className="title-cell">{exhibition.exhibition_name}</td>
                  <td>{exhibition.gallery_name || "—"}</td>
                  <td>
                    <span className={`status-badge ${getTypeBadgeClass(exhibition.exhibition_type)}`}>
                      {exhibition.exhibition_type || "Unknown"}
                    </span>
                  </td>
                  <td>{formatDate(exhibition.start_date)}</td>
                  <td>{formatDate(exhibition.end_date)}</td>
                  <td>
                    <span className={`date-status ${dateStatus.cls}`}>
                      {dateStatus.label}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="edit-btn" onClick={() => handleEditClick(exhibition)} title="Edit">Edit</button>
                    <button className="archive-btn" onClick={() => onArchive(exhibition.exhibition_id)} title="Archive">Archive</button>
                    <button className="delete-btn" onClick={() => onDelete(exhibition.exhibition_id)} title="Delete">Delete</button>
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
      <SuccessToast show={showSuccessToast} editingExhibition={editingExhibition} onClose={handleToastClose} />

      <div className="exhibition-manager-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search exhibitions by title, type, or gallery..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          + Add New Exhibition
        </button>
      </div>

      <div className="content-area">
        {externalLoading ? (
          <div className="loading-spinner">Loading exhibitions...</div>
        ) : externalError ? (
          <div className="error-message">{externalError}</div>
        ) : (
          <ExhibitionTable />
        )}
      </div>

      <ExhibitionFormModal
        isOpen={isFormOpen}
        editingExhibition={editingExhibition}
        formData={formData}
        exhibitionArtworks={exhibitionArtworks}
        galleries={galleries}
        artworks={artworks}
        errors={errors}
        isSubmitting={isSubmitting}
        selectedArtworkIds={selectedArtworkIds}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={handleChange}
        onAddArtworkRow={handleAddArtworkRow}
        onRemoveArtworkRow={handleRemoveArtworkRow}
        onArtworkRowChange={handleArtworkRowChange}
      />
    </div>
  );
}