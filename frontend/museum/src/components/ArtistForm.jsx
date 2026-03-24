// ArtistForm.jsx
import { useState, useEffect, useRef } from "react";
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
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Prefill form for edit
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.nationality.trim()) newErrors.nationality = "Nationality is required";
    
    // Validate birth year
    if (form.birth_year) {
      const birthYear = parseInt(form.birth_year);
      if (isNaN(birthYear) || birthYear < 0 || birthYear > new Date().getFullYear()) {
        newErrors.birth_year = "Please enter a valid birth year";
      }
    }
    
    // Validate death year (if provided, must be > birth year)
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
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // In a real app, you'd upload to cloud storage here
        setForm({ ...form, image: file });
      };
      reader.readAsDataURL(file);
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
      
      // Reset form for new entries
      if (!initialData) {
        setForm({
          first_name: "",
          last_name: "",
          birth_year: "",
          death_year: "",
          nationality: "",
          biography: "",
        });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
            <div className="form-layout">
              {/* Left Column - Image Upload */}
              <div className="form-image-section">
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Artist preview" />
                  ) : (
                    <div className="image-placeholder">
                      <span>🎨</span>
                      <p>No image</p>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📸 Upload Portrait
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <p className="upload-hint">JPG, PNG or GIF (max 5MB)</p>
              </div>
              
              {/* Right Column - Form Fields */}
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

/* import { useState, useEffect } from "react";

export default function ArtistForm({ onSubmit, initialData = null, onCancel }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_year: "",
    death_year: "",
    nationality: "",
    biography: "",
  });

  // If initialData is provided, prefill the form (for edit)
  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);

    // Reset form if adding (not editing)
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
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{initialData ? "Edit Artist" : "Add Artist"}</h3>
      <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
      <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
      <input name="birth_year" placeholder="Birth Year" value={form.birth_year} onChange={handleChange} />
      <input name="death_year" placeholder="Death Year" value={form.death_year} onChange={handleChange} />
      <input name="nationality" placeholder="Nationality" value={form.nationality} onChange={handleChange} />
      <textarea name="biography" placeholder="Biography" value={form.biography} onChange={handleChange} />
      <button type="submit">{initialData ? "Update Artist" : "Add Artist"}</button>
      {initialData && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
  */