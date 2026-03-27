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
  const [isMember, setIsMember] = useState(false);

  const userId = localStorage.getItem("user_id");

  // Check if logged-in user is a member
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:5000/members/${userId}`, {
      headers: { "Authorization": `Bearer ${userId}` }
    })
      .then(res => {
        if (res.ok) setIsMember(true);
        else setIsMember(false);
      })
      .catch(() => setIsMember(false));
  }, [userId]);

  const loadEvents = () => {
    getEvents()
      .then(data => {
        setEvents(data);
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

  async function handleSignup(eventId, isMemberOnly) {
    if (!userId) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Please log in to sign up for events." } }));
      return;
    }

    if (isMemberOnly && !isMember) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "This event is for members only. Please purchase a membership to sign up." } }));
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
            const isMemberOnly = e.member_only === 1 || e.member_only === true;
            const isLocked = isMemberOnly && !isMember;
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
                  {isMemberOnly ? " · ⭐ Members Only" : ""}
                </p>

                {isLocked && (
                  <p style={{ color: "#9a7d0a", fontSize: "0.9rem", marginTop: "4px" }}>
                    🔒 This event is for members only.{" "}
                    <a href="/membership" style={{ color: "#9a7d0a" }}>
                      Purchase a membership
                    </a>{" "}
                    to sign up.
                  </p>
                )}

                {!isFull && !isLocked && (
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
                  disabled={isFull || isLocked || signingUp === e.event_id}
                  onClick={() => handleSignup(e.event_id, isMemberOnly)}
                  style={{ marginTop: "var(--spacing-sm)" }}
                >
                  {signingUp === e.event_id
                    ? "Signing up..."
                    : isLocked
                    ? "🔒 Members Only"
                    : isFull
                    ? "Fully Booked"
                    : "Sign Up"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}