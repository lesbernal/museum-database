// src/components/EventTable.jsx
import "../styles/EventTable.css";

export default function EventTable({ events, onEdit, onDelete, onArchive }) {
  if (events.length === 0) return <div className="empty-state">No events found.</div>;

  return (
    <div className="event-table-container">
      <table className="event-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Event Name</th>
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
            return (
              <tr key={e.event_id}>
                <td>{e.event_id}</td>
                <td>{e.event_name}</td>
                <td>{e.event_date?.split("T")[0] ?? e.event_date}</td>
                <td>{e.capacity}</td>
                <td>{e.total_attendees}</td>
                <td style={{ color: spotsLeft <= 0 ? "red" : spotsLeft <= 5 ? "orange" : "green" }}>
                  {spotsLeft <= 0 ? "Full" : spotsLeft}
                </td>
                <td>{e.member_only ? "Yes" : "No"}</td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => onEdit(e)} title="Edit">Edit</button>
                  <button className="archive-btn" onClick={() => onArchive(e.event_id)} title="Archive">Archive</button>
                  <button className="delete-btn" onClick={() => onDelete(e.event_id)} title="Delete">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}