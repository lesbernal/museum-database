// src/components/EventTable.jsx
export default function EventTable({ events, onEdit, onDelete }) {
  if (events.length === 0) return <p>No events found.</p>;

  return (
    <table className="data-table">
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
              <td>
                <button className="btn btn-secondary" onClick={() => onEdit(e)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => onDelete(e.event_id)}
                  style={{ marginLeft: "8px" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}