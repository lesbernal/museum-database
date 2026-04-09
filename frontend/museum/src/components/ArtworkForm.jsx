// components/ArtworkForm.jsx
import { useState, useEffect, useRef } from "react";
import { getArtists } from "../services/api";
import "../styles/ArtworkForm.css";

export default function ArtworkForm({ onSubmit, initialData = null, onCancel, isOpen = true }) {
  const [form, setForm] = useState({
    artist_id: "",
    title: "",
    description: "",
    creation_year: "",
    medium: "",
    dimensions: "",
    acquisition_date: "",
    insurance_value: "",
    current_display_status: "On Display",
    image_url: "",
  });
  
  const [artists, setArtists] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Debug: Check if API key loads
  useEffect(() => {
    console.log("🔑 VITE_IMGBB_API_KEY exists:", !!import.meta.env.VITE_IMGBB_API_KEY);
  }, []);

  // Load artists for dropdown
  useEffect(() => {
    loadArtists();
  }, []);

  // Prefill form for edit
  useEffect(() => {
    if (initialData) {
      setForm({
        artist_id: initialData.artist_id || "",
        title: initialData.title || "",
        description: initialData.description || "",
        creation_year: initialData.creation_year || "",
        medium: initialData.medium || "",
        dimensions: initialData.dimensions || "",
        acquisition_date: initialData.acquisition_date ? new Date(initialData.acquisition_date).toISOString().split('T')[0] : "",
        insurance_value: initialData.insurance_value || "",
        current_display_status: initialData.current_display_status || "On Display",
        image_url: initialData.image_url || "",
      });
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  const loadArtists = async () => {
    try {
      const data = await getArtists();
      setArtists(data);
    } catch (err) {
      console.error("Failed to load artists:", err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.artist_id) newErrors.artist_id = "Artist is required";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.medium.trim()) newErrors.medium = "Medium is required";
    if (!form.dimensions.trim()) newErrors.dimensions = "Dimensions are required";
    if (!form.acquisition_date) newErrors.acquisition_date = "Acquisition date is required";
    
    if (form.creation_year) {
      const year = parseInt(form.creation_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 0 || year > currentYear) {
        newErrors.creation_year = "Please enter a valid year";
      }
    }
    
    if (form.insurance_value) {
      const value = parseFloat(form.insurance_value);
      if (isNaN(value) || value < 0) {
        newErrors.insurance_value = "Please enter a valid amount";
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

  // Upload image to ImgBB
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log("🖼️ Starting upload, file:", file.name);
    setUploading(true);
    
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      console.log("🔑 API Key:", apiKey ? `${apiKey.substring(0, 5)}...` : "MISSING!");
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      console.log("📡 ImgBB Response:", data);
      
      if (data.success) {
        const imageUrl = data.data.url;
        console.log("Image uploaded! URL:", imageUrl);
        setImagePreview(imageUrl);
        setForm(prev => {
          console.log("Updating form with image_url:", imageUrl);
          return { ...prev, image_url: imageUrl };
        });
      } else {
        console.error("ImgBB upload failed:", data);
        alert("Upload failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    console.log("🚀 Submitting artwork with image_url:", form.image_url);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      console.log("📤 Sending to backend:", {
        title: form.title,
        image_url: form.image_url
      });
      await onSubmit(form);
      console.log("✅ Submit successful!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      if (!initialData) {
        setForm({
          artist_id: "",
          title: "",
          description: "",
          creation_year: "",
          medium: "",
          dimensions: "",
          acquisition_date: "",
          insurance_value: "",
          current_display_status: "On Display",
          image_url: "",
        });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Error saving artwork:", error);
      setErrors({ submit: "Failed to save artwork. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {showSuccessToast && (
        <div className="toast success">
          Artwork {initialData ? "updated" : "added"} successfully!
        </div>
      )}
      
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content artwork-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{initialData ? "Edit Artwork" : "➕ Add New Artwork"}</h2>
            <button className="close-btn" onClick={onCancel}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="artwork-form">
            {/* Image Upload Section */}
            <div className="form-image-section artwork-image-section">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Artwork preview" />
                ) : (
                  <div className="image-placeholder">
                    <span>🖼️</span>
                    <p>No image</p>
                  </div>
                )}
              </div>
              <div className="image-upload-controls">
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "📤 Uploading..." : "📸 Upload Image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <p className="upload-hint">Or paste image URL below:</p>
                <input
                  type="text"
                  name="image_url"
                  placeholder="https://example.com/artwork-image.jpg"
                  value={form.image_url}
                  onChange={handleChange}
                  className="image-url-input"
                />
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Artist *</label>
                <select
                  name="artist_id"
                  value={form.artist_id}
                  onChange={handleChange}
                  className={errors.artist_id ? "error" : ""}
                >
                  <option value="">Select Artist</option>
                  {artists.map(artist => (
                    <option key={artist.artist_id} value={artist.artist_id}>
                      {artist.first_name} {artist.last_name}
                    </option>
                  ))}
                </select>
                {errors.artist_id && <span className="error-message">{errors.artist_id}</span>}
              </div>
              
              <div className="form-group full-width">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={errors.title ? "error" : ""}
                  placeholder="e.g., Water Lilies"
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>
              
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the artwork..."
                  rows="4"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Creation Year</label>
                  <input
                    type="number"
                    name="creation_year"
                    value={form.creation_year}
                    onChange={handleChange}
                    placeholder="1916"
                    min="0"
                    max={new Date().getFullYear()}
                  />
                  {errors.creation_year && <span className="error-message">{errors.creation_year}</span>}
                </div>
                
                <div className="form-group">
                  <label>Medium *</label>
                  <input
                    type="text"
                    name="medium"
                    value={form.medium}
                    onChange={handleChange}
                    placeholder="Oil on canvas"
                    className={errors.medium ? "error" : ""}
                  />
                  {errors.medium && <span className="error-message">{errors.medium}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Dimensions *</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={form.dimensions}
                    onChange={handleChange}
                    placeholder="24 x 30 in"
                    className={errors.dimensions ? "error" : ""}
                  />
                  {errors.dimensions && <span className="error-message">{errors.dimensions}</span>}
                </div>
                
                <div className="form-group">
                  <label>Acquisition Date *</label>
                  <input
                    type="date"
                    name="acquisition_date"
                    value={form.acquisition_date}
                    onChange={handleChange}
                    className={errors.acquisition_date ? "error" : ""}
                  />
                  {errors.acquisition_date && <span className="error-message">{errors.acquisition_date}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Insurance Value ($)</label>
                  <input
                    type="number"
                    name="insurance_value"
                    value={form.insurance_value}
                    onChange={handleChange}
                    placeholder="25000000"
                    step="0.01"
                  />
                  {errors.insurance_value && <span className="error-message">{errors.insurance_value}</span>}
                </div>
                
                <div className="form-group">
                  <label>Display Status</label>
                  <select
                    name="current_display_status"
                    value={form.current_display_status}
                    onChange={handleChange}
                  >
                    <option value="On Display">On Display</option>
                    <option value="In Storage">In Storage</option>
                    <option value="On Loan">On Loan</option>
                    <option value="Under Restoration">Under Restoration</option>
                  </select>
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
                {isSubmitting ? "Saving..." : (initialData ? "Update Artwork" : "Add Artwork")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}