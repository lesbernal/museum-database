// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Upcoming Events</h1>

      <div style={{ display: "grid", gap: "var(--spacing-lg)", marginTop: "var(--spacing-xl)" }}>
        {events.map(e => (
          <div key={e.event_id} className="card" style={{ padding: "var(--spacing-lg)" }}>
            <h3>{e.event_name}</h3>
            <p>{e.event_date}</p>
            <p>{e.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}