// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";
import "../styles/Events.css";
import { getEvents } from "../services/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EVENT_TYPES = ["All", "General", "Lecture", "Tour", "Activity", "Workshop", "Member Only"];

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

  if (loading) return (
    <div className="events-loading">
      <div className="loading-spinner"></div>
      <p>Loading events...</p>
    </div>
  );

  return (
    <div className="events-page">
      {/* Hero Section */}
      <div className="events-hero">
        <p className="events-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="events-title">Upcoming Events</h1>
        <p className="events-subtitle">
          Explore lectures, tours and special programs
        </p>
      </div>

      {/* Filters Section */}
      <div className="events-filters">
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

        {/* Additional filters */}
        <div className="events-filter-controls">
        <div className="events-filter-group">
          <label>Sort By</label>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="asc">Earliest First</option>
            <option value="desc">Latest First</option>
          </select>
        </div>
        <label className="events-available-check">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={e => setAvailableOnly(e.target.checked)}
          />
          <span>Show available only</span>
        </label>
        {(typeFilter !== "All" || availableOnly || sortOrder !== "asc") && (
          <button className="events-clear-btn" onClick={() => {
            setTypeFilter("All");
            setSortOrder("asc");
            setAvailableOnly(false);
          }}>
            Clear Filters
          </button>
        )}
      </div>
      </div>

      {/* Results count */}
      <div className="events-count">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
      </div>

      {/* Events grid */}
      {filteredEvents.length === 0 ? (
        <div className="events-empty">
          <p>No events match your filters.</p>
          <button className="events-reset-btn" onClick={() => {
            setTypeFilter("All");
            setDateFrom("");
            setDateTo("");
            setSortOrder("asc");
            setAvailableOnly(false);
          }}>Reset all filters</button>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(e => {
            const spotsLeft  = e.capacity - e.total_attendees;
            const isFull     = spotsLeft <= 0;
            const isMemberOnly = e.member_only === 1 || e.member_only === true;
            const isLocked   = isMemberOnly && !isMember;
            const msg        = messages[e.event_id];
            const quantity   = quantities[e.event_id] || 1;
            const typeStyle  = TYPE_COLORS[e.event_type] || TYPE_COLORS["General"];
            const isLowStock = spotsLeft <= 5 && spotsLeft > 0;

            return (
              <div key={e.event_id} className="event-card">
                <div className="event-card-header">
                  <h3 className="event-title">{e.event_name}</h3>
                  <div className="event-badges">
                    {e.event_type && (
                      <span className="event-type-badge" style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                      }}>
                        {e.event_type}
                      </span>
                    )}
                  </div>
                </div>

                <p className="event-date">
                  {new Date(e.event_date).toLocaleDateString("en-US", { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>

                {e.description && (
                  <p className="event-description">{e.description}</p>
                )}

                <div className="event-footer">
                  <div className="event-availability">
                    {isFull ? (
                      <span className="availability-full">Fully Booked</span>
                    ) : (
                      <span className={`availability-available ${isLowStock ? 'low-stock' : ''}`}>
                        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available
                      </span>
                    )}
                  </div>

                  {!isFull && !isLocked && (
                    <div className="event-quantity">
                      <label>Attendees</label>
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
                      />
                    </div>
                  )}
                </div>

                {isLocked && (
                  <div className="event-member-message">
                    This event is for members only. <a href="/membership">Purchase a membership</a> to sign up.
                  </div>
                )}

                {msg && (
                  <div className={`event-message ${msg.type}`}>
                    {msg.text}
                  </div>
                )}

                <button
                  className={`event-signup-btn ${(isFull || isLocked) ? 'disabled' : ''}`}
                  disabled={isFull || isLocked || signingUp === e.event_id}
                  onClick={() => handleSignup(e.event_id, isMemberOnly)}
                >
                  {signingUp === e.event_id ? "Processing..." :
                    isLocked ? "Members Only" :
                    isFull ? "Fully Booked" :
                    "Sign Up"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}