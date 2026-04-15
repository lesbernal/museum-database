// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";
import "../styles/Events.css";
import { getEvents } from "../services/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EVENT_TYPES = ["All", "General", "Lecture", "Tour", "Activity", "Workshop", "Exhibition", "Member Only"];

const TYPE_COLORS = {
  "General":     { bg: "#f3f4f6", color: "#374151" },
  "Lecture":     { bg: "#dbeafe", color: "#1d4ed8" },
  "Tour":        { bg: "#d1fae5", color: "#065f46" },
  "Activity":    { bg: "#fef3c7", color: "#92400e" },
  "Workshop":    { bg: "#ede9fe", color: "#5b21b6" },
  "Exhibition":  { bg: "#fce7f3", color: "#9d174d" },
  "Member Only": { bg: "#fef9c3", color: "#854d0e" },
};

export default function Events() {
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [signingUp, setSigningUp] = useState(null);
  const [messages,  setMessages]  = useState({});
  const [quantities, setQuantities] = useState({});
  const [isMember,  setIsMember]  = useState(false);

  // Filters
  const [typeFilter,      setTypeFilter]      = useState("All");
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");
  const [sortOrder,       setSortOrder]       = useState("asc");
  const [availableOnly,   setAvailableOnly]   = useState(false);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/members/${userId}`, {
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
      .catch(err => console.error("Load events error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  // Apply filters and sorting
  const filteredEvents = events
    .filter(e => {
      if (typeFilter !== "All" && e.event_type !== typeFilter) return false;
      if (dateFrom && e.event_date < dateFrom) return false;
      if (dateTo && e.event_date > dateTo) return false;
      if (availableOnly && (e.capacity - e.total_attendees) <= 0) return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.event_date);
      const db = new Date(b.event_date);
      return sortOrder === "asc" ? da - db : db - da;
    });

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
      const res = await fetch(`${BASE_URL}/events/${eventId}`, {
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

  if (loading) return <p style={{ padding: "var(--spacing-3xl)" }}>Loading events...</p>;

  return (
    <div style={{ padding: "var(--spacing-3xl)" }}>

      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-gray-light)", marginBottom: "0.5rem" }}>
          Museum of Fine Arts, Houston
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Upcoming Events
        </h1>
        <p style={{ color: "var(--color-gray)", fontSize: "0.95rem" }}>
          Explore exhibitions, lectures, tours and special programs
        </p>
      </div>

      {/* Filters */}
      <div className="events-filter-bar">
        {/* Type filter pills */}
        <div className="events-type-filters">
          {EVENT_TYPES.map(t => (
            <button
              key={t}
              className={`events-type-btn ${typeFilter === t ? "active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date range + sort + available */}
        <div className="events-filter-controls">
          <div className="events-filter-group">
            <label>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="events-filter-group">
            <label>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="events-filter-group">
            <label>Sort</label>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="asc">Date (Earliest)</option>
              <option value="desc">Date (Latest)</option>
            </select>
          </div>
          <label className="events-available-check">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={e => setAvailableOnly(e.target.checked)}
            />
            Available only
          </label>
          {(typeFilter !== "All" || dateFrom || dateTo || availableOnly || sortOrder !== "asc") && (
            <button
              className="events-clear-btn"
              onClick={() => {
                setTypeFilter("All");
                setDateFrom("");
                setDateTo("");
                setSortOrder("asc");
                setAvailableOnly(false);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: "0.82rem", color: "var(--color-gray-light)", marginBottom: "var(--spacing-lg)" }}>
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
      </p>

      {/* Events grid */}
      {filteredEvents.length === 0 ? (
        <p style={{ color: "var(--color-gray-light)", textAlign: "center", padding: "3rem 0" }}>
          No events match your filters.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--spacing-lg)" }}>
          {filteredEvents.map(e => {
            const spotsLeft  = e.capacity - e.total_attendees;
            const isFull     = spotsLeft <= 0;
            const isMemberOnly = e.member_only === 1 || e.member_only === true;
            const isLocked   = isMemberOnly && !isMember;
            const msg        = messages[e.event_id];
            const quantity   = quantities[e.event_id] || 1;
            const typeStyle  = TYPE_COLORS[e.event_type] || TYPE_COLORS["General"];

            return (
              <div key={e.event_id} className="card" style={{ padding: "var(--spacing-lg)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0 }}>{e.event_name}</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {e.event_type && (
                      <span style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        background: typeStyle.bg,
                        color: typeStyle.color,
                      }}>
                        {e.event_type}
                      </span>
                    )}
                    {isMemberOnly && (
                      <span style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        background: "#fef9c3",
                        color: "#854d0e",
                      }}>
                        ⭐ Members Only
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--color-gold)", marginBottom: "0.5rem", fontWeight: 500 }}>
                  {e.event_date?.split("T")[0] ?? e.event_date}
                </p>

                {e.description && (
                  <p style={{ fontSize: "0.875rem", color: "var(--color-gray)", marginBottom: "0.75rem" }}>
                    {e.description}
                  </p>
                )}

                <p style={{ fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                  {isFull ? (
                    <span style={{ color: "red" }}>⛔ Fully Booked</span>
                  ) : (
                    <span style={{ color: spotsLeft <= 5 ? "orange" : "green" }}>
                      ✅ {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available
                    </span>
                  )}
                </p>

                {isLocked && (
                  <p style={{ color: "#9a7d0a", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                    🔒 This event is for members only.{" "}
                    <a href="/membership" style={{ color: "#9a7d0a" }}>Purchase a membership</a> to sign up.
                  </p>
                )}

                {!isFull && !isLocked && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", marginRight: "0.5rem" }}>Number of Attendees</label>
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
                      style={{ width: "80px" }}
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
                >
                  {signingUp === e.event_id ? "Signing up..."
                    : isLocked ? "🔒 Members Only"
                    : isFull ? "Fully Booked"
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