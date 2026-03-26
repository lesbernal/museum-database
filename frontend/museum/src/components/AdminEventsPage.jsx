import { useState, useEffect } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/api";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Manage Events</h2>
      <button onClick={() => alert("Open form to add new event")}>+ Add Event</button>
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              {e.title} — {e.date}
              <button onClick={() => alert("Edit event")}>Edit</button>
              <button onClick={() => alert("Delete event")}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}