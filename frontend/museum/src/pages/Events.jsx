// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";
import { getEvents } from "../services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(null);
  const [messages, setMessages] = useState({});
  const [quantities, setQuantities] = useState({});

  const userId = localStorage.getItem("user_id");

  const loadEvents = () => {
    getEvents()
      .then(data => {
        setEvents(data);
        // Initialize quantity to 1 for each event
        const initial = {};
        data.forEach(e => { initial[e.event_id] = 1; });
        setQuantities(initial);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSignup(eventId) {
    if (!userId) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Please log in to sign up for events." } }));
      return;
    }

    const quantity = quantities[eventId] || 1;
    setSigningUp(eventId);
    setMessages(prev => ({ ...prev, [eventId]: null }));

    try {
      const res = await fetch(`http://localhost:5000/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: data.error || "Signup failed." } }));
      } else {
        setMessages(prev => ({ ...prev, [eventId]: { type: "success", text: data.message } }));
        loadEvents();
      }
    } catch {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Something went wrong." } }));
    } finally {
      setSigningUp(null);
    }
  }

  if (loading) return <p>Loading events...</p>;

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>
      <h1>Upcoming Events</h1>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div style={{ display: "grid", gap: "var(--spacing-lg)", marginTop: "var(--spacing-xl)" }}>
          {events.map(e => {
            const spotsLeft = e.capacity - e.total_attendees;
            const isFull = spotsLeft <= 0;
            const msg = messages[e.event_id];
            const quantity = quantities[e.event_id] || 1;

            return (
              <div key={e.event_id} className="card" style={{ padding: "var(--spacing-lg)" }}>
                <h3>{e.event_name}</h3>
                <p>{e.event_date?.split("T")[0] ?? e.event_date}</p>
                {e.description && <p>{e.description}</p>}

                <p>
                  {isFull ? (
                    <span style={{ color: "red" }}>⛔ Fully Booked</span>
                  ) : (
                    <span style={{ color: spotsLeft <= 5 ? "orange" : "green" }}>
                      ✅ {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available
                    </span>
                  )}
                  {e.member_only ? " · ⭐ Members Only" : ""}
                </p>

                {!isFull && (
                  <div style={{ marginTop: "var(--spacing-sm)" }}>
                    <label>Number of Attendees</label>
                    <input
                      type="number"
                      min="1"
                      max={spotsLeft}
                      value={quantity}
                      onChange={(ev) =>
                        setQuantities(prev => ({
                          ...prev,
                          [e.event_id]: Math.min(Number(ev.target.value), spotsLeft)
                        }))
                      }
                      style={{ width: "80px", marginLeft: "var(--spacing-sm)" }}
                    />
                  </div>
                )}

                {msg && (
                  <p className={msg.type === "error" ? "error-message" : "success-message"}>
                    {msg.text}
                  </p>
                )}

                <button
                  className="btn btn-primary"
                  disabled={isFull || signingUp === e.event_id}
                  onClick={() => handleSignup(e.event_id)}
                  style={{ marginTop: "var(--spacing-sm)" }}
                >
                  {signingUp === e.event_id ? "Signing up..." : isFull ? "Fully Booked" : "Sign Up"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}