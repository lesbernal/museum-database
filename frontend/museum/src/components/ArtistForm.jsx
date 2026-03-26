// ArtistForm.jsx
import { useState, useEffect } from "react";
import "../styles/ArtistForm.css";

export default function ArtistForm({ onSubmit, initialData = null, onCancel, isOpen = true }) {
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

  // Prefill form for edit
  useEffect(() => {
    if (initialData) {
      setForm({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        birth_year: initialData.birth_year || "",
        death_year: initialData.death_year || "",
        nationality: initialData.nationality || "",
        biography: initialData.biography || "",
      });
    }
  }, [initialData]);

  // Validate form fields
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (!initialData) {
        setForm({
          first_name: "",
          last_name: "",
          birth_year: "",
          death_year: "",
          nationality: "",
          biography: "",
        });
      }
    } catch (error) {
      console.error("Error saving artist:", error);
      setErrors({ submit: "Failed to save artist. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {showSuccessToast && (
        <div className="toast success">
          ✅ Artist {initialData ? "updated" : "added"} successfully!
        </div>
      )}
      
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{initialData ? "✏️ Edit Artist" : "➕ Add New Artist"}</h2>
            <button className="close-btn" onClick={onCancel}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="artist-form">
            <div className="form-fields">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className={errors.death_year ? "error" : ""}
                    placeholder="1954"
                    min="0"
                  />
                  {errors.death_year && <span className="error-message">{errors.death_year}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <label>Nationality *</label>
                <select
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  className={errors.nationality ? "error" : ""}
                >
                  <option value="">Select nationality</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Dutch">Dutch</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Other">Other</option>
                </select>
                {errors.nationality && <span className="error-message">{errors.nationality}</span>}
              </div>
              
              <div className="form-group">
                <label>Biography</label>
                <textarea
                  name="biography"
                  value={form.biography}
                  onChange={handleChange}
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
                {isSubmitting ? "Saving..." : (initialData ? "Update Artist" : "Add Artist")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}