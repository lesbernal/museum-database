// pages/Events.jsx - PLACEHOLDER
import { useEffect, useState } from "react";
import { getEvents } from "../services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then(data => setEvents(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading events...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Events</h1>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul>
          {events.map(e => (
            <li key={e.event_id}>
              <strong>{e.name}</strong> — {e.event_date}
              <br />
              Capacity: {e.capacity} {e.member_only ? "· Members Only" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}