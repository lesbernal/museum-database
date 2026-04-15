// src/components/EventForm.jsx
import { useState, useEffect } from "react";
import { getGalleries } from "../services/api";
import "../styles/EventForm.css";

export default function EventForm({ onSubmit, initialData, onCancel }) {
  const [formData, setFormData] = useState({
    gallery_id: "",
    event_name: "",
    description: "",
    event_date: "",
    capacity: "",
    member_only: 0,
    total_attendees: 0,
  });

  const [galleries, setGalleries] = useState([]);

  useEffect(() => {
    getGalleries()
      .then(data => setGalleries(data))
      .catch(err => console.error("Failed to load galleries:", err));
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        gallery_id: initialData.gallery_id || "",
        event_name: initialData.event_name || "",
        description: initialData.description || "",
        event_date: initialData.event_date?.split("T")[0] ?? initialData.event_date ?? "",
        capacity: initialData.capacity || "",
        member_only: initialData.member_only || 0,
        total_attendees: initialData.total_attendees || 0,
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? "✏️ Edit Event" : "➕ Add New Event"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-grid">

            {/* Event Name */}
            <div className="form-group full-width">
              <label>Event Name</label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleChange}
                placeholder="e.g., Impressionist Paintings Tour"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the event..."
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              {/* Event Date */}
              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Capacity */}
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>

            {/* Gallery */}
            <div className="form-group full-width">
              <label>Gallery</label>
              <select
                name="gallery_id"
                value={formData.gallery_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Gallery</option>
                {galleries.map(g => (
                  <option key={g.gallery_id} value={g.gallery_id}>
                    {g.gallery_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Members Only */}
            <div className="form-group full-width" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="checkbox"
                name="member_only"
                id="member_only"
                checked={formData.member_only === 1}
                onChange={handleChange}
                style={{ width: "18px", height: "18px", accentColor: "#c5a028" }}
              />
              <label htmlFor="member_only" style={{ margin: 0, cursor: "pointer" }}>
                Members Only
              </label>
            </div>

          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {initialData ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}