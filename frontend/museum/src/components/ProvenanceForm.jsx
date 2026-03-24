import { useState, useEffect } from "react";
import { getArtworks } from "../services/api";
import "../styles/ProvenanceForm.css";

export default function ProvenanceForm({ onSubmit, initialData = null, onCancel, isOpen = true }) {
  const [form, setForm] = useState({
    artwork_id: "",
    owner_name: "",
    acquisition_date: "",
    acquisition_method: "",
    price_paid: "",
    transfer_date: ""
  });
  
  const [artworks, setArtworks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    loadArtworks();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        artwork_id: initialData.artwork_id,
        owner_name: initialData.owner_name || "",
        acquisition_date: initialData.acquisition_date ? new Date(initialData.acquisition_date).toISOString().split('T')[0] : "",
        acquisition_method: initialData.acquisition_method || "",
        price_paid: initialData.price_paid || "",
        transfer_date: initialData.transfer_date ? new Date(initialData.transfer_date).toISOString().split('T')[0] : ""
      });
    }
  }, [initialData]);

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
    
    if (!form.artwork_id) newErrors.artwork_id = "Artwork is required";
    if (!form.owner_name.trim()) newErrors.owner_name = "Owner name is required";
    if (!form.acquisition_date) newErrors.acquisition_date = "Acquisition date is required";
    if (!form.acquisition_method) newErrors.acquisition_method = "Acquisition method is required";
    if (!form.transfer_date) newErrors.transfer_date = "Transfer date is required";
    
    if (form.price_paid) {
      const price = parseFloat(form.price_paid);
      if (isNaN(price) || price < 0) {
        newErrors.price_paid = "Please enter a valid amount";
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
          artwork_id: "",
          owner_name: "",
          acquisition_date: "",
          acquisition_method: "",
          price_paid: "",
          transfer_date: ""
        });
      }
    } catch (error) {
      console.error("Error saving provenance:", error);
      setErrors({ submit: "Failed to save provenance record. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {showSuccessToast && (
        <div className="toast success">
          ✅ Provenance {initialData ? "updated" : "added"} successfully!
        </div>
      )}
      
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content provenance-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{initialData ? "✏️ Edit Provenance" : "➕ Add Provenance Record"}</h2>
            <button className="close-btn" onClick={onCancel}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="provenance-form">
            <div className="form-group full-width">
              <label>Artwork *</label>
              <select
                name="artwork_id"
                value={form.artwork_id}
                onChange={handleChange}
                className={errors.artwork_id ? "error" : ""}
              >
                <option value="">Select Artwork</option>
                {artworks.map(artwork => (
                  <option key={artwork.artwork_id} value={artwork.artwork_id}>
                    {artwork.title} ({artwork.creation_year || "Year unknown"})
                  </option>
                ))}
              </select>
              {errors.artwork_id && <span className="error-message">{errors.artwork_id}</span>}
            </div>
            
            <div className="form-group full-width">
              <label>Owner Name *</label>
              <input
                type="text"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="e.g., Private Collection, New York"
                className={errors.owner_name ? "error" : ""}
              />
              {errors.owner_name && <span className="error-message">{errors.owner_name}</span>}
            </div>
            
            <div className="form-row">
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
              
              <div className="form-group">
                <label>Transfer Date *</label>
                <input
                  type="date"
                  name="transfer_date"
                  value={form.transfer_date}
                  onChange={handleChange}
                  className={errors.transfer_date ? "error" : ""}
                />
                {errors.transfer_date && <span className="error-message">{errors.transfer_date}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Acquisition Method *</label>
                <select
                  name="acquisition_method"
                  value={form.acquisition_method}
                  onChange={handleChange}
                  className={errors.acquisition_method ? "error" : ""}
                >
                  <option value="">Select Method</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Donation">Donation</option>
                  <option value="Inheritance">Inheritance</option>
                  <option value="Bequest">Bequest</option>
                  <option value="Exchange">Exchange</option>
                  <option value="Transfer">Transfer</option>
                </select>
                {errors.acquisition_method && <span className="error-message">{errors.acquisition_method}</span>}
              </div>
              
              <div className="form-group">
                <label>Price Paid ($)</label>
                <input
                  type="number"
                  name="price_paid"
                  value={form.price_paid}
                  onChange={handleChange}
                  placeholder="25000000"
                  step="0.01"
                />
                {errors.price_paid && <span className="error-message">{errors.price_paid}</span>}
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
                {isSubmitting ? "Saving..." : (initialData ? "Update Provenance" : "Add Provenance")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}