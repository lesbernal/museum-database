// components/ArtistManager.jsx (SIMPLIFIED - NO INTERNAL FILTERING)
import { useState, useEffect } from "react";
import "../styles/ArtistManager.css";

// Artist Form Modal Component (keep as is - no changes)
const ArtistFormModal = ({ isOpen, editingArtist, form, errors, isSubmitting, onSubmit, onCancel, onChange }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingArtist ? "Edit Artist" : "Add New Artist"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        
        <form onSubmit={onSubmit} className="artist-form">
          <div className="form-fields">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  className={errors.first_name ? "error" : ""}
                  placeholder="e.g., Frida"
                />
                {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>
              
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  className={errors.last_name ? "error" : ""}
                  placeholder="e.g., Kahlo"
                />
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Birth Year</label>
                <input
                  type="number"
                  name="birth_year"
                  value={form.birth_year}
                  onChange={onChange}
                  className={errors.birth_year ? "error" : ""}
                  placeholder="1907"
                  min="0"
                  max={new Date().getFullYear()}
                />
                {errors.birth_year && <span className="error-message">{errors.birth_year}</span>}
              </div>
              
              <div className="form-group">
                <label>Death Year</label>
                <input
                  type="number"
                  name="death_year"
                  value={form.death_year}
                  onChange={onChange}
                  className={errors.death_year ? "error" : ""}
                  placeholder="1954"
                  min="0"
                />
                {errors.death_year && <span className="error-message">{errors.death_year}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label>Nationality *</label>
              <input
                type="text"
                name="nationality"
                value={form.nationality}
                onChange={onChange}
                placeholder="e.g., Mexican, American, French"
                className={errors.nationality ? "error" : ""}
              />
              {errors.nationality && <span className="error-message">{errors.nationality}</span>}
            </div>
            
            <div className="form-group">
              <label>Biography</label>
              <textarea
                name="biography"
                value={form.biography}
                onChange={onChange}
                placeholder="Write a biography of the artist..."
                rows="5"
              />
              <div className="char-counter">
                {form.biography.length} characters
              </div>
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
              {isSubmitting ? "Saving..." : (editingArtist ? "Update Artist" : "Add Artist")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Toast Component
const SuccessToast = ({ show, message, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ {message}</div>;
};

export default function ArtistManager({ 
  artists: externalArtists,
  onAdd, 
  onUpdate, 
  onArchive,
  onRestore,
  loading: externalLoading,
  error: externalError
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_year: "",
    death_year: "",
    nationality: "",
    biography: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Prefill form for edit
  useEffect(() => {
    if (editingArtist) {
      setForm({
        first_name: editingArtist.first_name || "",
        last_name: editingArtist.last_name || "",
        birth_year: editingArtist.birth_year || "",
        death_year: editingArtist.death_year || "",
        nationality: editingArtist.nationality || "",
        biography: editingArtist.biography || "",
      });
    } else {
      setForm({
        first_name: "",
        last_name: "",
        birth_year: "",
        death_year: "",
        nationality: "",
        biography: "",
      });
    }
  }, [editingArtist]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.nationality.trim()) newErrors.nationality = "Nationality is required";
    
    if (form.birth_year) {
      const birthYear = parseInt(form.birth_year);
      if (isNaN(birthYear) || birthYear < 0 || birthYear > new Date().getFullYear()) {
        newErrors.birth_year = "Please enter a valid birth year";
      }
    }
    
    if (form.death_year && form.birth_year) {
      const deathYear = parseInt(form.death_year);
      const birthYear = parseInt(form.birth_year);
      if (!isNaN(deathYear) && !isNaN(birthYear) && deathYear <= birthYear) {
        newErrors.death_year = "Death year must be after birth year";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editingArtist) {
        await onUpdate(editingArtist.artist_id, form);
        setToastMessage(`Artist "${form.first_name} ${form.last_name}" updated successfully!`);
      } else {
        await onAdd(form);
        setToastMessage(`Artist "${form.first_name} ${form.last_name}" added successfully!`);
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingArtist(null);
      setForm({
        first_name: "",
        last_name: "",
        birth_year: "",
        death_year: "",
        nationality: "",
        biography: "",
      });
    } catch (error) {
      console.error("Error saving artist:", error);
      setErrors(prev => ({ ...prev, submit: "Failed to save artist. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (artistId, artistName) => {
    if (window.confirm(`Archive "${artistName}"? This artist will be hidden from active views.`)) {
      await onArchive(artistId);
      setToastMessage(`Artist "${artistName}" archived.`);
      setShowSuccessToast(true);
    }
  };

  const handleRestore = async (artistId, artistName) => {
    if (window.confirm(`Restore "${artistName}"?`)) {
      await onRestore(artistId);
      setToastMessage(`Artist "${artistName}" restored.`);
      setShowSuccessToast(true);
    }
  };

  const handleAddClick = () => {
    setEditingArtist(null);
    setForm({
      first_name: "",
      last_name: "",
      birth_year: "",
      death_year: "",
      nationality: "",
      biography: "",
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleEditClick = (artist) => {
    setEditingArtist(artist);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingArtist(null);
    setErrors({});
  };

  const handleToastClose = () => {
    setShowSuccessToast(false);
  };

  // Artist Table Component
  const ArtistTable = () => {
    if (externalArtists.length === 0) {
      return <div className="empty-state">No artists found</div>;
    }

    return (
      <div className="artist-table-container">
        <table className="artist-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Nationality</th>
              <th>Born</th>
              <th>Died</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {externalArtists.map(artist => (
              <tr key={artist.artist_id} className={artist.is_active === 0 ? "archived-row" : ""}>
                <td>{artist.artist_id}</td>
                <td>
                  <div className="artist-name">
                    <span className="artist-avatar"></span>
                    <span>{artist.first_name} {artist.last_name}</span>
                  </div>
                </td>
                <td>{artist.nationality}</td>
                <td>{artist.birth_year || "—"}</td>
                <td>{artist.death_year || "—"}</td>
                <td className="status-cell">
                  {artist.is_active === 0 && <span className="archived-badge">Archived</span>}
                </td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => handleEditClick(artist)} title="Edit">Edit</button>
                  {artist.is_active === 0 ? (
                    <button className="restore-btn" onClick={() => handleRestore(artist.artist_id, `${artist.first_name} ${artist.last_name}`)} title="Restore">Restore</button>
                  ) : (
                    <button className="archive-btn" onClick={() => handleArchive(artist.artist_id, `${artist.first_name} ${artist.last_name}`)} title="Archive">Archive</button>
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
    <div className="artist-manager">
      <SuccessToast show={showSuccessToast} message={toastMessage} onClose={handleToastClose} />

      <div className="artist-manager-header">
        <button className="add-btn" onClick={handleAddClick}>
          + Add New Artist
        </button>
      </div>

      <div className="content-area">
        {externalError ? (
          <div className="error-message">{externalError}</div>
        ) : (
          <ArtistTable />
        )}
      </div>

      <ArtistFormModal
        isOpen={isFormOpen}
        editingArtist={editingArtist}
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={handleChange}
      />
    </div>
  );
}