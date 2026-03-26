// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";
import { getEvents } from "../services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch events using the API helper
    getEvents()
      .then(data => setEvents(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading events...</p>;

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Upcoming Events</h1>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "var(--spacing-lg)",
            marginTop: "var(--spacing-xl)",
          }}
        >
          {events.map(e => (
            <div key={e.event_id} className="card" style={{ padding: "var(--spacing-lg)" }}>
              <h3>{e.name || e.event_name}</h3>
              <p>{e.event_date}</p>
              {e.description && <p>{e.description}</p>}
              {e.capacity && (
                <p>
                  Capacity: {e.capacity} {e.member_only ? "· Members Only" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}