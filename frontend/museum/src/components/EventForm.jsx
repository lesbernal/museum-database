// src/components/EventForm.jsx
import { useState, useEffect } from "react";

export default function EventForm({ onSubmit, initialData, onCancel }) {
  const [formData, setFormData] = useState({
    gallery_id: "",
    event_name: "",
    description: "",
    event_date: "",
    capacity: "",
    member_only: 0,
    total_attendees: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        gallery_id: initialData.gallery_id || "",
        event_name: initialData.event_name || "",
        description: initialData.description || "",
        event_date: initialData.event_date?.split("T")[0] ?? initialData.event_date,
        capacity: initialData.capacity || "",
        member_only: initialData.member_only || 0,
        total_attendees: initialData.total_attendees || 0
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{initialData ? "Edit Event" : "Add New Event"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Name</label>
            <input
              type="text"
              name="event_name"
              value={formData.event_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

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

          <div className="form-group">
            <label>Gallery ID</label>
            <input
              type="number"
              name="gallery_id"
              value={formData.gallery_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              name="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label>Members Only</label>
            <input
              type="checkbox"
              name="member_only"
              checked={formData.member_only === 1}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}