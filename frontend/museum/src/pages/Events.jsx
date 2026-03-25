// src/pages/Events.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Events.css";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("http://localhost:5000/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load events.");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (errorMsg) return <p className="error">{errorMsg}</p>;

  return (
    <div className="events-page">
      <h1>Upcoming Events</h1>
      {events.map((event) => {
        const ticketsRemaining = event.capacity - event.total_attendees;
        return (
          <div key={event.event_id} className="event-card">
            <h2>{event.event_name}</h2>
            <p>{event.description}</p>
            <p>Date: {event.event_date}</p>
            <p>
              Capacity: {event.capacity} | Attendees: {event.total_attendees} | Tickets remaining: {ticketsRemaining}
            </p>
            <Link to={`/tickets`} state={{ preselectedEvent: event.event_id }}>
              Buy Tickets →
            </Link>
          </div>
        );
      })}
    </div>
  );
}