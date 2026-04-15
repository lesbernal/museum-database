// src/components/EventTable.jsx
import "../styles/EventTable.css";

const TYPE_COLORS = {
  "General":     { bg: "#f3f4f6", color: "#374151" },
  "Lecture":     { bg: "#dbeafe", color: "#1d4ed8" },
  "Tour":        { bg: "#d1fae5", color: "#065f46" },
  "Activity":    { bg: "#fef3c7", color: "#92400e" },
  "Workshop":    { bg: "#ede9fe", color: "#5b21b6" },
  "Exhibition":  { bg: "#fce7f3", color: "#9d174d" },
  "Member Only": { bg: "#fef9c3", color: "#854d0e" },
};

export default function EventTable({ events, onEdit, onDelete, onArchive }) {
  if (events.length === 0) return <div className="empty-state">No events found.</div>;

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
          {events.map(e => {
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
                  <button className="edit-btn" onClick={() => onEdit(e)}>Edit</button>
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
}