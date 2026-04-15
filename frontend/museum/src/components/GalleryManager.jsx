// components/GalleryManager.jsx
import { useState, useEffect } from "react";
import { getBuildings, getExhibitions } from "../services/api";
import "../styles/GalleryManager.css";

// Toast Component
const SuccessToast = ({ show, editingGallery, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return (
    <div className="toast success">
      ✅ Gallery {editingGallery ? "updated" : "added"} successfully!
    </div>
  );
};

// Form Modal Component
const GalleryFormModal = ({ isOpen, editingGallery, formData, buildings, exhibitions, errors, isSubmitting, onSubmit, onCancel, onChange, onExhibitionToggle }) => {
  if (!isOpen) return null;

  const formatSquareFootage = (sqft) => {
    if (!sqft) return "—";
    return Number(sqft).toLocaleString() + " sq ft";
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingGallery ? "✏️ Edit Gallery" : "➕ Add New Gallery"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={onSubmit} className="gallery-form">
          <div className="form-grid">
            {/* Gallery Name */}
            <div className="form-group full-width">
              <label>Gallery Name *</label>
              <input
                type="text"
                name="gallery_name"
                value={formData.gallery_name}
                onChange={onChange}
                placeholder="e.g., Impressionist Wing"
                className={errors.gallery_name ? "error" : ""}
              />
              {errors.gallery_name && <span className="error-message">{errors.gallery_name}</span>}
            </div>

            <div className="form-row">
              {/* Floor Number */}
              <div className="form-group">
                <label>Floor Number *</label>
                <input
                  type="number"
                  name="floor_number"
                  value={formData.floor_number}
                  onChange={onChange}
                  placeholder="e.g., 2"
                  className={errors.floor_number ? "error" : ""}
                />
                {errors.floor_number && <span className="error-message">{errors.floor_number}</span>}
              </div>

              {/* Square Footage */}
              <div className="form-group">
                <label>Square Footage *</label>
                <input
                  type="number"
                  name="square_footage"
                  value={formData.square_footage}
                  onChange={onChange}
                  placeholder="e.g., 3500"
                  className={errors.square_footage ? "error" : ""}
                />
                {errors.square_footage && <span className="error-message">{errors.square_footage}</span>}
              </div>
            </div>

            <div className="form-row">
              {/* Climate Controlled */}
              <div className="form-group">
                <label>Climate Controlled *</label>
                <select
                  name="climate_controlled"
                  value={formData.climate_controlled}
                  onChange={onChange}
                  className={errors.climate_controlled ? "error" : ""}
                >
                  <option value="">Select...</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
                {errors.climate_controlled && <span className="error-message">{errors.climate_controlled}</span>}
              </div>

              {/* Building */}
              <div className="form-group">
                <label>Museum Building *</label>
                <select
                  name="building_id"
                  value={formData.building_id}
                  onChange={onChange}
                  className={errors.building_id ? "error" : ""}
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.building_id} value={building.building_id}>
                      {building.building_name}
                    </option>
                  ))}
                </select>
                {errors.building_id && <span className="error-message">{errors.building_id}</span>}
              </div>
            </div>

            {/* Exhibitions Multi-Select */}
            <div className="form-group full-width">
              <label>Exhibitions in this Gallery</label>
              <p className="field-hint">Select all exhibitions currently displayed in this gallery.</p>
              {exhibitions.length === 0 ? (
                <p className="empty-hint">No exhibitions found in the database.</p>
              ) : (
                <div className="checkbox-list">
                  {exhibitions.map((exhibition) => {
                    const checked = formData.exhibition_ids
                      .map(String)
                      .includes(String(exhibition.exhibition_id));
                    return (
                      <label key={exhibition.exhibition_id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onExhibitionToggle(exhibition.exhibition_id)}
                        />
                        <span className="checkbox-label">
                          <span className="exhibition-name">{exhibition.exhibition_name}</span>
                          {exhibition.start_date && exhibition.end_date && (
                            <span className="exhibition-dates">
                              {new Date(exhibition.start_date).toLocaleDateString()} –{" "}
                              {new Date(exhibition.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
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
  onAdd,
  onUpdate,
  onDelete,
  onArchive,
  loading: externalLoading,
  error: externalError
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formData, setFormData] = useState({
    gallery_name: "",
    floor_number: "",
    square_footage: "",
    climate_controlled: "",
    building_id: "",
    exhibition_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dropdowns
  useEffect(() => {
    loadBuildings();
    loadExhibitions();
  }, []);

  // Prefill form for edit
  useEffect(() => {
    if (editingGallery) {
      setFormData({
        gallery_name: editingGallery.gallery_name || "",
        floor_number: editingGallery.floor_number ?? "",
        square_footage: editingGallery.square_footage || "",
        climate_controlled: editingGallery.climate_controlled ?? "",
        building_id: editingGallery.building_id || "",
        exhibition_ids: editingGallery.exhibition_ids || [],
      });
    } else {
      setFormData({
        gallery_name: "",
        floor_number: "",
        square_footage: "",
        climate_controlled: "",
        building_id: "",
        exhibition_ids: [],
      });
    }
  }, [editingGallery]);

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error("Failed to load buildings:", err);
    }
  };

  const loadExhibitions = async () => {
    try {
      const data = await getExhibitions();
      setExhibitions(data);
    } catch (err) {
      console.error("Failed to load exhibitions:", err);
    }
  };

  // Filter galleries based on search term
  const filteredGalleries = externalGalleries.filter(gallery =>
    gallery.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gallery.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.gallery_name.trim()) newErrors.gallery_name = "Gallery name is required";
    if (formData.floor_number === "" || formData.floor_number === null) {
      newErrors.floor_number = "Floor number is required";
    } else if (isNaN(parseInt(formData.floor_number))) {
      newErrors.floor_number = "Floor number must be a number";
    } else if (parseInt(formData.floor_number) < 1 || parseInt(formData.floor_number) > 100) {
      newErrors.floor_number = "Floor number must be between 1 and 100";
    }
    if (!formData.square_footage) {
      newErrors.square_footage = "Square footage is required";
    } else if (isNaN(parseFloat(formData.square_footage)) || parseFloat(formData.square_footage) <= 0) {
      newErrors.square_footage = "Please enter a valid square footage";
    } else if (parseFloat(formData.square_footage) > 10000) {
      newErrors.square_footage = "Square footage seems too large";
    }
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

  const handleExhibitionToggle = (exhibitionId) => {
    const id = String(exhibitionId);
    const current = formData.exhibition_ids.map(String);
    const updated = current.includes(id)
      ? current.filter((eid) => eid !== id)
      : [...current, id];
    setFormData(prev => ({ ...prev, exhibition_ids: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingGallery) {
        await onUpdate(editingGallery.gallery_id, formData);
      } else {
        await onAdd(formData);
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingGallery(null);
      setFormData({
        gallery_name: "",
        floor_number: "",
        square_footage: "",
        climate_controlled: "",
        building_id: "",
        exhibition_ids: [],
      });
    } catch (err) {
      console.error("Error saving gallery:", err);
      setErrors(prev => ({ ...prev, submit: "Failed to save gallery. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClick = () => {
    setEditingGallery(null);
    setFormData({
      gallery_name: "",
      floor_number: "",
      square_footage: "",
      climate_controlled: "",
      building_id: "",
      exhibition_ids: [],
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleEditClick = (gallery) => {
    setEditingGallery(gallery);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingGallery(null);
    setErrors({});
  };

  const handleToastClose = () => {
    setShowSuccessToast(false);
  };

  const formatSquareFootage = (sqft) => {
    if (!sqft) return "—";
    return Number(sqft).toLocaleString() + " sq ft";
  };

  const getOrdinalFloor = (floor) => {
    if (floor === null || floor === undefined || floor === "") return "—";
    const n = parseInt(floor);
    if (n === 0) return "Ground";
    if (n < 0) return `Basement ${Math.abs(n)}`;
    const suffix = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  // Gallery Table Component
  const GalleryTable = () => {
    if (filteredGalleries.length === 0) {
      return <div className="empty-state">No galleries found</div>;
    }

    return (
      <div className="gallery-table-container">
        <table className="gallery-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Gallery Name</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Square Footage</th>
              <th>Climate Control</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGalleries.map((gallery) => (
              <tr key={gallery.gallery_id}>
                <td>{gallery.gallery_id}</td>
                <td className="title-cell">{gallery.gallery_name}</td>
                <td>{gallery.building_name || "—"}</td>
                <td>{getOrdinalFloor(gallery.floor_number)}</td>
                <td>{formatSquareFootage(gallery.square_footage)}</td>
                <td>
                  <span className={`status-badge ${gallery.climate_controlled ? "badge-standard" : "badge-none"}`}>
                    {gallery.climate_controlled ? "Yes" : "No"}
                  </span>
                </td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => handleEditClick(gallery)} title="Edit">Edit</button>
                  <button className="archive-btn" onClick={() => onArchive(gallery.gallery_id)} title="Archive">Archive</button>
                  <button className="delete-btn" onClick={() => onDelete(gallery.gallery_id)} title="Delete">Delete</button>
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
      <SuccessToast show={showSuccessToast} editingGallery={editingGallery} onClose={handleToastClose} />

      <div className="gallery-manager-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search galleries by name or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          + Add New Gallery
        </button>
      </div>

      <div className="content-area">
        {externalLoading ? (
          <div className="loading-spinner">Loading galleries...</div>
        ) : externalError ? (
          <div className="error-message">{externalError}</div>
        ) : (
          <GalleryTable />
        )}
      </div>

      <GalleryFormModal
        isOpen={isFormOpen}
        editingGallery={editingGallery}
        formData={formData}
        buildings={buildings}
        exhibitions={exhibitions}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={handleChange}
        onExhibitionToggle={handleExhibitionToggle}
      />
    </div>
  );
}