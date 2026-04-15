// components/EventManager.jsx
import { useState, useEffect } from "react";
import { getGalleries } from "../services/api";
import "../styles/EventManager.css";

const EVENT_TYPES = ["General", "Lecture", "Tour", "Activity", "Workshop", "Exhibition", "Member Only"];

const TYPE_COLORS = {
  "General":     { bg: "#f3f4f6", color: "#374151" },
  "Lecture":     { bg: "#dbeafe", color: "#1d4ed8" },
  "Tour":        { bg: "#d1fae5", color: "#065f46" },
  "Activity":    { bg: "#fef3c7", color: "#92400e" },
  "Workshop":    { bg: "#ede9fe", color: "#5b21b6" },
  "Exhibition":  { bg: "#fce7f3", color: "#9d174d" },
  "Member Only": { bg: "#fef9c3", color: "#854d0e" },
};

// Toast Component
const SuccessToast = ({ show, editingEvent, onClose }) => {
  if (!show) return null;
  setTimeout(() => onClose(), 3000);
  return (
    <div className="toast success">
      ✅ Event {editingEvent ? "updated" : "added"} successfully!
    </div>
  );
};

// Form Modal Component
const EventFormModal = ({ isOpen, editingEvent, formData, galleries, onSubmit, onCancel, onChange }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={onSubmit} className="event-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Event Name</label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={onChange}
                placeholder="e.g., Impressionist Paintings Tour"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={onChange}
                placeholder="Describe the event..."
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={onChange}
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
                  onChange={onChange}
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gallery</label>
                <select
                  name="gallery_id"
                  value={formData.gallery_id}
                  onChange={onChange}
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

              <div className="form-group">
                <label>Event Type</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={onChange}
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="checkbox"
                name="member_only"
                id="member_only"
                checked={formData.member_only === 1}
                onChange={onChange}
                style={{ width: "18px", height: "18px", accentColor: "#c5a028" }}
              />
              <label htmlFor="member_only" style={{ margin: 0, cursor: "pointer" }}>
                Members Only
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn">
              {editingEvent ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function EventManager({ 
  events: externalEvents,
  onAdd,
  onUpdate,
  onDelete,
  onArchive,
  loading: externalLoading,
  error: externalError
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formData, setFormData] = useState({
    gallery_id: "",
    event_name: "",
    description: "",
    event_date: "",
    capacity: "",
    member_only: 0,
    total_attendees: 0,
    event_type: "General",
  });

  // Load galleries
  useEffect(() => {
    getGalleries()
      .then(data => setGalleries(data))
      .catch(err => console.error("Failed to load galleries:", err));
  }, []);

  // Prefill form for edit
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        gallery_id: editingEvent.gallery_id || "",
        event_name: editingEvent.event_name || "",
        description: editingEvent.description || "",
        event_date: editingEvent.event_date?.split("T")[0] ?? editingEvent.event_date ?? "",
        capacity: editingEvent.capacity || "",
        member_only: editingEvent.member_only || 0,
        total_attendees: editingEvent.total_attendees || 0,
        event_type: editingEvent.event_type || "General",
      });
    } else {
      setFormData({
        gallery_id: "",
        event_name: "",
        description: "",
        event_date: "",
        capacity: "",
        member_only: 0,
        total_attendees: 0,
        event_type: "General",
      });
    }
  }, [editingEvent]);

  // Filter events based on search term
  const filteredEvents = externalEvents.filter(event =>
    event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await onUpdate(editingEvent.event_id, formData);
      } else {
        await onAdd(formData);
      }
      setShowSuccessToast(true);
      setIsFormOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event");
    }
  };

  const handleAddClick = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleToastClose = () => {
    setShowSuccessToast(false);
  };

  // Event Table Component
  const EventTable = () => {
    if (filteredEvents.length === 0) {
      return <div className="empty-state">No events found.</div>;
    }

    return (
      <div className="event-table-container">
        <table className="event-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Name</th>
              <th>Type</th>
              <th>Date</th>
              <th>Capacity</th>
              <th>Attendees</th>
              <th>Spots Left</th>
              <th>Members Only</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(e => {
              const spotsLeft = e.capacity - e.total_attendees;
              const typeStyle = TYPE_COLORS[e.event_type] || TYPE_COLORS["General"];
              return (
                <tr key={e.event_id}>
                  <td>{e.event_id}</td>
                  <td>{e.event_name}</td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      padding: "0.2rem 0.65rem",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                    }}>
                      {e.event_type || "General"}
                    </span>
                  </td>
                  <td>{e.event_date?.split("T")[0] ?? e.event_date}</td>
                  <td>{e.capacity}</td>
                  <td>{e.total_attendees}</td>
                  <td style={{ color: spotsLeft <= 0 ? "red" : spotsLeft <= 5 ? "orange" : "green" }}>
                    {spotsLeft <= 0 ? "Full" : spotsLeft}
                  </td>
                  <td>{e.member_only ? "Yes" : "No"}</td>
                  <td className="actions">
                    <button className="edit-btn" onClick={() => handleEditClick(e)}>Edit</button>
                    <button className="archive-btn" onClick={() => onArchive(e.event_id)}>Archive</button>
                    <button className="delete-btn" onClick={() => onDelete(e.event_id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="event-manager">
      <SuccessToast show={showSuccessToast} editingEvent={editingEvent} onClose={handleToastClose} />

      <div className="event-manager-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search events by name, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          + Add New Event
        </button>
      </div>

      <div className="content-area">
        {externalLoading ? (
          <div className="loading-spinner">Loading events...</div>
        ) : externalError ? (
          <div className="error-message">{externalError}</div>
        ) : (
          <EventTable />
        )}
      </div>

      <EventFormModal
        isOpen={isFormOpen}
        editingEvent={editingEvent}
        formData={formData}
        galleries={galleries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={handleChange}
      />
    </div>
  );
}