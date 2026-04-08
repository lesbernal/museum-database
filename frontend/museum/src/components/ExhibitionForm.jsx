// components/ExhibitionForm.jsx
import { useState, useEffect } from "react";
import { getGalleries, getArtworks } from "../services/api";
import "../styles/ExhibitionForm.css";

const EXHIBITION_TYPES = [
  "Permanent",
  "Temporary",
  "Traveling",
];

export default function ExhibitionForm({ onSubmit, initialData = null, onCancel, isOpen = true }) {
  const [form, setForm] = useState({
    gallery_id: "",
    exhibition_name: "",
    start_date: "",
    end_date: "",
    exhibition_type: "",
  });

  const [exhibitionArtworks, setExhibitionArtworks] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    loadGalleries();
    loadArtworks();
  }, []);

  // Prefill for edit
  useEffect(() => {
    if (initialData) {
      setForm({
        gallery_id: initialData.gallery_id || "",
        exhibition_name: initialData.exhibition_name || "",
        start_date: initialData.start_date
          ? new Date(initialData.start_date).toISOString().split("T")[0]
          : "",
        end_date: initialData.end_date
          ? new Date(initialData.end_date).toISOString().split("T")[0]
          : "",
        exhibition_type: initialData.exhibition_type || "",
      });
      if (initialData.artworks) {
        setExhibitionArtworks(
          initialData.artworks.map((a) => ({
            artwork_id: String(a.artwork_id),
            display_start_date: a.display_start_date
              ? new Date(a.display_start_date).toISOString().split("T")[0]
              : "",
            display_end_date: a.display_end_date
              ? new Date(a.display_end_date).toISOString().split("T")[0]
              : "",
          }))
        );
      }
    }
  }, [initialData]);

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

  const validateForm = () => {
    const newErrors = {};
    if (!form.gallery_id) newErrors.gallery_id = "Gallery is required";
    if (!form.exhibition_name.trim()) newErrors.exhibition_name = "Title is required";
    if (!form.start_date) newErrors.start_date = "Start date is required";
    if (!form.end_date) newErrors.end_date = "End date is required";
    if (!form.exhibition_type) newErrors.exhibition_type = "Exhibition type is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  }

  function handleAddArtworkRow() {
    setExhibitionArtworks([
      ...exhibitionArtworks,
      { artwork_id: "", display_start_date: "", display_end_date: "" },
    ]);
  }

  function handleRemoveArtworkRow(idx) {
    setExhibitionArtworks(exhibitionArtworks.filter((_, i) => i !== idx));
    if (errors.artworks?.[idx]) {
      const updated = { ...errors.artworks };
      delete updated[idx];
      setErrors({ ...errors, artworks: updated });
    }
  }

  function handleArtworkRowChange(idx, field, value) {
    const updated = exhibitionArtworks.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setExhibitionArtworks(updated);
    if (errors.artworks?.[idx]?.[field]) {
      const updatedErrors = {
        ...errors,
        artworks: {
          ...errors.artworks,
          [idx]: { ...errors.artworks[idx], [field]: null },
        },
      };
      setErrors(updatedErrors);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ ...form, artworks: exhibitionArtworks });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      if (!initialData) {
        setForm({
          gallery_id: "",
          exhibition_name: "",
          start_date: "",
          end_date: "",
          exhibition_type: "",
        });
        setExhibitionArtworks([]);
      }
    } catch (error) {
      console.error("Error saving exhibition:", error);
      setErrors({ submit: "Failed to save exhibition. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const selectedArtworkIds = exhibitionArtworks.map((r) => String(r.artwork_id)).filter(Boolean);

  return (
    <>
      {showSuccessToast && (
        <div className="toast success">
          ✅ Exhibition {initialData ? "updated" : "added"} successfully!
        </div>
      )}

      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content exhibition-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{initialData ? "✏️ Edit Exhibition" : "➕ Add New Exhibition"}</h2>
            <button className="close-btn" onClick={onCancel}>&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="exhibition-form">
            <div className="form-grid">

              {/* Gallery */}
              <div className="form-group full-width">
                <label>Gallery *</label>
                <select
                  name="gallery_id"
                  value={form.gallery_id}
                  onChange={handleChange}
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
                  value={form.exhibition_name}
                  onChange={handleChange}
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
                  value={form.exhibition_type}
                  onChange={handleChange}
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
                    value={form.start_date}
                    onChange={handleChange}
                    className={errors.start_date ? "error" : ""}
                  />
                  {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className={errors.end_date ? "error" : ""}
                  />
                  {errors.end_date && <span className="error-message">{errors.end_date}</span>}
                </div>
              </div>

              {/* Artworks */}
              <div className="form-group full-width">
                <div className="section-header">
                  <label>Artworks in this Exhibition</label>
                  <button type="button" className="add-row-btn" onClick={handleAddArtworkRow}>
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
                              onChange={(e) => handleArtworkRowChange(idx, "artwork_id", e.target.value)}
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
                              onChange={(e) => handleArtworkRowChange(idx, "display_start_date", e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Display End</label>
                            <input
                              type="date"
                              value={row.display_end_date}
                              onChange={(e) => handleArtworkRowChange(idx, "display_end_date", e.target.value)}
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
                          onClick={() => handleRemoveArtworkRow(idx)}
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

            {errors.submit && (
              <div className="error-message submit-error">{errors.submit}</div>
            )}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Exhibition" : "Add Exhibition"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}