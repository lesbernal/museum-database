// components/ArtistManager.jsx
<<<<<<< HEAD
// canDelete prop gates the Archive button — regular employees can Edit only.
// onArchive/onRestore pattern preserved exactly as the team implemented it.

import { useState, useEffect } from "react";
import "../styles/ArtistManager.css";

=======
import { useState, useEffect } from "react";
import "../styles/ArtistManager.css";

// ── Toast ────────────────────────────────────────────────────
const SuccessToast = ({ show, message, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">{message}</div>;
};

// ── Form Modal ───────────────────────────────────────────────
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
const ArtistFormModal = ({ isOpen, editingArtist, form, errors, isSubmitting, onSubmit, onCancel, onChange }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingArtist ? "Edit Artist" : "Add New Artist"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
<<<<<<< HEAD
=======

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
        <form onSubmit={onSubmit} className="artist-form">
          <div className="form-fields">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" name="first_name" value={form.first_name} onChange={onChange} className={errors.first_name ? "error" : ""} placeholder="e.g., Frida" />
                {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>
<<<<<<< HEAD
=======

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" name="last_name" value={form.last_name} onChange={onChange} className={errors.last_name ? "error" : ""} placeholder="e.g., Kahlo" />
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>
            </div>
<<<<<<< HEAD
=======

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
            <div className="form-row">
              <div className="form-group">
                <label>Birth Year</label>
                <input type="number" name="birth_year" value={form.birth_year} onChange={onChange} className={errors.birth_year ? "error" : ""} placeholder="1907" min="0" max={new Date().getFullYear()} />
                {errors.birth_year && <span className="error-message">{errors.birth_year}</span>}
              </div>
<<<<<<< HEAD
=======

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
              <div className="form-group">
                <label>Death Year</label>
                <input type="number" name="death_year" value={form.death_year} onChange={onChange} className={errors.death_year ? "error" : ""} placeholder="1954" min="0" />
                {errors.death_year && <span className="error-message">{errors.death_year}</span>}
              </div>
            </div>
<<<<<<< HEAD
=======

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
            <div className="form-group">
              <label>Nationality *</label>
              <input type="text" name="nationality" value={form.nationality} onChange={onChange} placeholder="e.g., Mexican, American, French" className={errors.nationality ? "error" : ""} />
              {errors.nationality && <span className="error-message">{errors.nationality}</span>}
            </div>
<<<<<<< HEAD
            <div className="form-group">
              <label>Biography</label>
              <textarea name="biography" value={form.biography} onChange={onChange} placeholder="Write a biography of the artist..." rows="5" />
              <div className="char-counter">{form.biography.length} characters</div>
            </div>
          </div>
          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
=======

            <div className="form-group">
              <label>Biography</label>
              <textarea
                name="biography"
                value={form.biography}
                onChange={onChange}
                placeholder="Write a biography of the artist..."
                rows="5"
              />
              <div className="char-counter">{form.biography.length} characters</div>
            </div>
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingArtist ? "Update Artist" : "Add Artist")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

<<<<<<< HEAD
const SuccessToast = ({ show, message, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return <div className="toast success">✅ {message}</div>;
};

=======
// ── Main Component ───────────────────────────────────────────
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
export default function ArtistManager({
  artists: externalArtists,
  onAdd,
  onUpdate,
  onArchive,
  onRestore,
  loading: externalLoading,
  error: externalError,
<<<<<<< HEAD
  // ── access control ──
  // canDelete gates Archive (and Restore) — only managers can archive artists
  // canEdit is implied by the parent passing onAdd/onUpdate
  canDelete = true,
}) {
  const [isFormOpen,       setIsFormOpen]       = useState(false);
  const [editingArtist,    setEditingArtist]    = useState(null);
  const [form,             setForm]             = useState({ first_name:"", last_name:"", birth_year:"", death_year:"", nationality:"", biography:"" });
  const [errors,           setErrors]           = useState({});
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage,     setToastMessage]     = useState("");

  useEffect(() => {
    if (editingArtist) {
      setForm({ first_name:editingArtist.first_name||"", last_name:editingArtist.last_name||"", birth_year:editingArtist.birth_year||"", death_year:editingArtist.death_year||"", nationality:editingArtist.nationality||"", biography:editingArtist.biography||"" });
    } else {
      setForm({ first_name:"", last_name:"", birth_year:"", death_year:"", nationality:"", biography:"" });
=======
}) {
  const [isFormOpen,       setIsFormOpen]       = useState(false);
  const [editingArtist,    setEditingArtist]    = useState(null);
  const [showArchived,     setShowArchived]     = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage,     setToastMessage]     = useState("");
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [errors,           setErrors]           = useState({});
  const [archiveError,     setArchiveError]     = useState(null);
  const [restoreTarget,    setRestoreTarget]    = useState(null);

  const emptyForm = {
    first_name: "", last_name: "", birth_year: "",
    death_year: "", nationality: "", biography: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ArtistManager owns the active/archived split — always use the full list
  const activeArtists   = externalArtists.filter(a => a.is_active !== 0);
  const archivedArtists = externalArtists.filter(a => a.is_active === 0);

  // Prefill form on edit
  useEffect(() => {
    if (editingArtist) {
      setForm({
        first_name:  editingArtist.first_name  || "",
        last_name:   editingArtist.last_name   || "",
        birth_year:  editingArtist.birth_year  || "",
        death_year:  editingArtist.death_year  || "",
        nationality: editingArtist.nationality || "",
        biography:   editingArtist.biography   || "",
      });
    } else {
      setForm(emptyForm);
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
    }
  }, [editingArtist]);

  // Auto-dismiss archive error after 5 seconds
  useEffect(() => {
    if (!archiveError) return;
    const t = setTimeout(() => setArchiveError(null), 5000);
    return () => clearTimeout(t);
  }, [archiveError]);

  // ── Validation ─────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
<<<<<<< HEAD
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim())  newErrors.last_name  = "Last name is required";
    if (!form.nationality.trim()) newErrors.nationality = "Nationality is required";
    if (form.birth_year) {
      const y = parseInt(form.birth_year);
      if (isNaN(y) || y < 0 || y > new Date().getFullYear()) newErrors.birth_year = "Please enter a valid birth year";
    }
    if (form.death_year && form.birth_year) {
      if (parseInt(form.death_year) <= parseInt(form.birth_year)) newErrors.death_year = "Death year must be after birth year";
    }
=======
    if (!form.first_name.trim())  newErrors.first_name  = "First name is required";
    if (!form.last_name.trim())   newErrors.last_name   = "Last name is required";
    if (!form.nationality.trim()) newErrors.nationality = "Nationality is required";

    if (form.birth_year) {
      const y = parseInt(form.birth_year);
      if (isNaN(y) || y < 0 || y > new Date().getFullYear())
        newErrors.birth_year = "Please enter a valid birth year";
    }

    if (form.death_year && form.birth_year) {
      const d = parseInt(form.death_year);
      const b = parseInt(form.birth_year);
      if (!isNaN(d) && !isNaN(b) && d <= b)
        newErrors.death_year = "Death year must be after birth year";
    }

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingArtist) {
        await onUpdate(editingArtist.artist_id, form);
        setToastMessage(`"${form.first_name} ${form.last_name}" updated successfully!`);
      } else {
        await onAdd(form);
        setToastMessage(`"${form.first_name} ${form.last_name}" added successfully!`);
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingArtist(null);
<<<<<<< HEAD
      setForm({ first_name:"", last_name:"", birth_year:"", death_year:"", nationality:"", biography:"" });
    } catch (error) {
      setErrors(prev => ({ ...prev, submit:"Failed to save artist. Please try again." }));
=======
      setForm(emptyForm);
    } catch (err) {
      console.error("Error saving artist:", err);
      setErrors(prev => ({ ...prev, submit: "Failed to save artist. Please try again." }));
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (artist) => {
    const count = artist.artwork_count ?? 0;
    if (count > 0) {
      setArchiveError({ artist, count });
      return;
    }
    await onArchive(artist.artist_id);
    setToastMessage(`"${artist.first_name} ${artist.last_name}" archived.`);
    setShowSuccessToast(true);
  };

  const handleRestore        = (artist) => setRestoreTarget(artist);
  const handleRestoreConfirm = async () => {
    await onRestore(restoreTarget.artist_id);
    setToastMessage(`"${restoreTarget.first_name} ${restoreTarget.last_name}" restored.`);
    setShowSuccessToast(true);
    setRestoreTarget(null);
  };

<<<<<<< HEAD
  const handleAddClick  = () => { setEditingArtist(null); setErrors({}); setIsFormOpen(true); };
  const handleEditClick = (artist) => { setEditingArtist(artist); setIsFormOpen(true); };
  const handleCancel    = () => { setIsFormOpen(false); setEditingArtist(null); setErrors({}); };

  const ArtistTable = () => {
    if (externalArtists.length === 0) return <div className="empty-state">No artists found</div>;
=======
  const handleAddClick   = () => { setEditingArtist(null); setForm(emptyForm); setErrors({}); setIsFormOpen(true); };
  const handleEditClick  = artist => { setEditingArtist(artist); setIsFormOpen(true); };
  const handleCancel     = () => { setIsFormOpen(false); setEditingArtist(null); setErrors({}); };
  const handleToastClose = () => setShowSuccessToast(false);

  // ── Active Table ───────────────────────────────────────────
  const ArtistTable = ({ artists }) => {
    if (artists.length === 0)
      return <div className="empty-state">No artists found</div>;

>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
    return (
      <div className="artist-table-container">
        <table className="artist-table">
          <thead>
            <tr>
<<<<<<< HEAD
              <th>ID</th><th>Name</th><th>Nationality</th><th>Born</th><th>Died</th><th>Status</th><th>Actions</th>
=======
              <th>ID</th>
              <th>Name</th>
              <th>Nationality</th>
              <th>Born</th>
              <th>Died</th>
              <th>Artworks</th>
              <th>Actions</th>
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
            </tr>
          </thead>
          <tbody>
            {artists.map(artist => (
              <tr key={artist.artist_id}>
                <td>{artist.artist_id}</td>
                <td><div className="artist-name"><span className="artist-avatar"></span><span>{artist.first_name} {artist.last_name}</span></div></td>
                <td>{artist.nationality}</td>
                <td>{artist.birth_year || "—"}</td>
                <td>{artist.death_year || "—"}</td>
                <td>{artist.artwork_count ?? 0}</td>
                <td className="actions">
<<<<<<< HEAD
                  {/* Edit — always available to anyone with access to this tab */}
                  <button className="edit-btn" onClick={() => handleEditClick(artist)} title="Edit">Edit</button>
                  {/* Archive / Restore — managers only (canDelete) */}
                  {canDelete && (
                    artist.is_active === 0
                      ? <button className="restore-btn" onClick={() => handleRestore(artist.artist_id, `${artist.first_name} ${artist.last_name}`)} title="Restore">Restore</button>
                      : <button className="archive-btn" onClick={() => handleArchive(artist.artist_id, `${artist.first_name} ${artist.last_name}`)} title="Archive">Archive</button>
                  )}
=======
                  <button className="edit-btn"    onClick={() => handleEditClick(artist)}>Edit</button>
                  <button className="archive-btn" onClick={() => handleArchive(artist)}>Archive</button>
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Archived Panel ─────────────────────────────────────────
  const ArchivedPanel = () => (
    <div className="archived-panel">
      <p className="archived-heading">Archived Artists</p>
      {archivedArtists.length === 0 ? (
        <p className="archived-empty">No archived artists.</p>
      ) : (
        <div className="archived-list">
          {archivedArtists.map(artist => (
            <div key={artist.artist_id} className="archived-row">
              <div className="archived-info">
                <span className="archived-name">{artist.first_name} {artist.last_name}</span>
                <span className="archived-gallery">{artist.nationality}</span>
                <span className="archived-dates">
                  {artist.birth_year || "?"}
                  {artist.death_year ? ` – ${artist.death_year}` : ""}
                </span>
              </div>
              <div className="actions">
                <button className="edit-btn"    onClick={() => handleEditClick(artist)}>Edit</button>
                <button className="btn-restore" onClick={() => handleRestore(artist)}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="artist-manager">
<<<<<<< HEAD
      <SuccessToast show={showSuccessToast} message={toastMessage} onClose={() => setShowSuccessToast(false)} />
      <div className="artist-manager-header">
        <button className="add-btn" onClick={handleAddClick}>+ Add New Artist</button>
      </div>
      <div className="content-area">
        {externalError ? <div className="error-message">{externalError}</div> : <ArtistTable />}
      </div>
      <ArtistFormModal isOpen={isFormOpen} editingArtist={editingArtist} form={form} errors={errors} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={handleCancel} onChange={handleChange} />
=======
      <SuccessToast show={showSuccessToast} message={toastMessage} onClose={handleToastClose} />

      {/* Archive blocked — red error toast */}
      {archiveError && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: 8, padding: "12px 16px", maxWidth: 360,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <strong style={{ color: "#991b1b", fontSize: 13 }}>Cannot Archive Artist</strong>
            <button
              onClick={() => setArchiveError(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 16, marginLeft: 8, lineHeight: 1 }}
            >×</button>
          </div>
          <p style={{ fontSize: 13, color: "#7f1d1d", margin: "6px 0 4px" }}>
            <strong>{archiveError.artist.first_name} {archiveError.artist.last_name}</strong> has{" "}
            <strong>{archiveError.count}</strong> active artwork{archiveError.count !== 1 ? "s" : ""} on display.
          </p>
          <p style={{ fontSize: 12, color: "#991b1b", margin: 0 }}>
            Archive or deaccession all linked artworks before archiving this artist.
          </p>
        </div>
      )}

      <div className="artist-manager-header">
        <button
          className={`btn-archived-toggle ${showArchived ? "archived-toggle-active" : ""}`}
          onClick={() => setShowArchived(p => !p)}
        >
          {showArchived ? "Hide Archived" : `View Archived (${archivedArtists.length})`}
        </button>
        <button className="add-btn" onClick={handleAddClick}>
          + Add New Artist
        </button>
      </div>

      {showArchived && <ArchivedPanel />}

      <div className="content-area">
        {externalError ? (
          <div className="error-message">{externalError}</div>
        ) : (
          <ArtistTable artists={activeArtists} />
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

      {/* Restore confirmation modal */}
      {restoreTarget && (
        <div className="um-overlay" onClick={() => setRestoreTarget(null)}>
          <div className="um-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Restore Artist</h3>
              <button className="um-modal-close" onClick={() => setRestoreTarget(null)}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                Are you sure you want to restore{" "}
                <strong>{restoreTarget.first_name} {restoreTarget.last_name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                They will become visible in the active artists list again.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="um-cancel-btn" onClick={() => setRestoreTarget(null)}>Cancel</button>
              <button
                className="um-save-btn"
                style={{ background: "#16a34a" }}
                onClick={handleRestoreConfirm}
              >
                ↩ Restore
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> fe711489f932a35c427c69bf1e278ba8fd6492b4
    </div>
  );
}