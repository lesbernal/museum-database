// src/pages/Events.jsx
import { useEffect, useState } from "react";
import "../styles/theme.css";
import "../styles/Events.css";
import { getEvents, getMyEventSignups } from "../services/api";

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

const TYPE_IMAGES = {
  "General":     "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80",
  "Lecture":     "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
  "Tour":        "https://i.postimg.cc/hGrqQ2bx/american-art-galleries-16502746617110251196.jpg",
  "Activity":    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  "Workshop":    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600&q=80",
  "Exhibition":  "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&q=80",
  "Member Only": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
};

export default function Events() {
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [signingUp,   setSigningUp]   = useState(null);
  const [unsigning,   setUnsigning]   = useState(null);
  const [editingSignup,  setEditingSignup]  = useState(null);
  const [editQuantity,   setEditQuantity]   = useState(1);
  const [messages,    setMessages]    = useState({});
  const [quantities,  setQuantities]  = useState({});
  const [isMember,    setIsMember]    = useState(false);
  const [mySignups,   setMySignups]   = useState([]);

  // Filters
  const [typeFilter,    setTypeFilter]    = useState("All");
  const [sortOrder,     setSortOrder]     = useState("asc");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/members/${userId}`, {
      headers: { "Authorization": `Bearer ${userId}` }
    })
      .then(res => { if (res.ok) setIsMember(true); else setIsMember(false); })
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

  const loadMySignups = () => {
    if (!userId) return;
    getMyEventSignups()
      .then(data => setMySignups(Array.isArray(data) ? data : []))
      .catch(() => setMySignups([]));
  };

  useEffect(() => {
    loadEvents();
    loadMySignups();
  }, []);

  // Check if user is signed up for a specific event
  const isSignedUp = (eventId) => mySignups.some(s => s.event_id === eventId);

  const filteredEvents = events
    .filter(e => {
      if (typeFilter !== "All" && e.event_type !== typeFilter) return false;
      if (availableOnly && (e.capacity - e.total_attendees) <= 0) return false;
      if (dateFrom && new Date(e.event_date) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(e.event_date) > new Date(dateTo))   return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.event_date);
      const db = new Date(b.event_date);
      return sortOrder === "asc" ? da - db : db - da;
    });

  const hasActiveFilters = typeFilter !== "All" || availableOnly || sortOrder !== "asc" || dateFrom || dateTo;

  function clearFilters() {
    setTypeFilter("All");
    setSortOrder("asc");
    setAvailableOnly(false);
    setDateFrom("");
    setDateTo("");
  }

  async function handleSignup(eventId, isMemberOnly) {
    if (!userId) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Please log in to sign up for events." } }));
      return;
    }
    if (isMemberOnly && !isMember) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "This event is for members only." } }));
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
        loadMySignups();
      }
    } catch {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Something went wrong." } }));
    } finally {
      setSigningUp(null);
    }
  }

  async function handleUnsignup(eventId) {
    if (!userId) return;
    setUnsigning(eventId);
    setMessages(prev => ({ ...prev, [eventId]: null }));

    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/unsignup`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${userId}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: data.error || "Could not cancel signup." } }));
      } else {
        setMessages(prev => ({ ...prev, [eventId]: { type: "success", text: "Successfully cancelled your signup!" } }));
        loadEvents();
        loadMySignups();
      }
    } catch {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Something went wrong." } }));
    } finally {
      setUnsigning(null);
    }
  }

  async function handleUpdateSignup(eventId, signupId, newQuantity) {
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/update-signup`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      const data = await res.json();
      if (res.ok) {
        setMySignups(prev => prev.map(s =>
          s.event_id === eventId ? { ...s, quantity: newQuantity } : s
        ));
        setMessages(prev => ({ ...prev, [eventId]: { type: "success", text: data.message } }));
        setEditingSignup(null);
        loadEvents();
      } else {
        setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: data.error || "Could not update." } }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [eventId]: { type: "error", text: "Something went wrong." } }));
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
      {/* Hero */}
      <div className="events-hero">
        <p className="events-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="events-title">Upcoming Events</h1>
        <p className="events-subtitle">Explore lectures, tours and special programs</p>
      </div>

      {/* Filters */}
      <div className="events-filters">
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
            <span>Available only</span>
          </label>
          {hasActiveFilters && (
            <button className="events-clear-btn" onClick={clearFilters}>Clear Filters</button>
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
          <button className="events-reset-btn" onClick={clearFilters}>Reset all filters</button>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(e => {
            const spotsLeft    = e.capacity - e.total_attendees;
            const isFull       = spotsLeft <= 0;
            const isMemberOnly = e.member_only === 1 || e.member_only === true;
            const isLocked     = isMemberOnly && !isMember;
            const msg          = messages[e.event_id];
            const quantity     = quantities[e.event_id] || 1;
            const typeStyle    = TYPE_COLORS[e.event_type] || TYPE_COLORS["General"];
            const isLowStock   = spotsLeft <= 5 && spotsLeft > 0;
            const imgSrc       = e.image_url || TYPE_IMAGES[e.event_type] || TYPE_IMAGES["General"];
            const alreadySignedUp = isSignedUp(e.event_id);

            return (
              <div key={e.event_id} className={`event-card ${isLocked ? "event-card-locked" : ""}`}>

                {/* Image */}
                <div className="event-card-image">
                  <img src={imgSrc} alt={e.event_name} />
                  <div className="event-card-image-badges">
                    {e.event_type && (
                      <span className="event-type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                        {e.event_type}
                      </span>
                    )}
                    {isMemberOnly && (
                      <span className="event-type-badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
                        Members Only
                      </span>
                    )}
                    {alreadySignedUp && (
                      <span className="event-type-badge" style={{ background: "#d1fae5", color: "#065f46" }}>
                        ✓ Signed Up
                      </span>
                    )}
                  </div>
                  {isFull && !alreadySignedUp && <div className="event-card-full-overlay">Fully Booked</div>}
                </div>

                {/* Body */}
                <div className="event-card-body">
                  <h3 className="event-title">{e.event_name}</h3>

                  <p className="event-date">
                    {new Date(e.event_date).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>

                  {e.description && <p className="event-description">{e.description}</p>}

                  <div className="event-footer">
                    <div className="event-availability">
                      {isFull && !alreadySignedUp ? (
                        <span className="availability-full">Fully Booked</span>
                      ) : (
                        <span className={`availability-available ${isLowStock ? "low-stock" : ""}`}>
                          {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} available
                        </span>
                      )}
                    </div>

                    {!isFull && !isLocked && !alreadySignedUp && (
                      <div className="event-quantity">
                        <label>Attendees</label>
                        <input
                          type="number"
                          min="1"
                          max={spotsLeft}
                          value={quantity}
                          onChange={ev =>
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
                      This event is for members only.{" "}
                      <a href="/membership">Purchase a membership</a> to sign up.
                    </div>
                  )}

                  {msg && (
                    <div className={`event-message ${msg.type}`}>{msg.text}</div>
                  )}

                  {/* Sign Up / Edit / Cancel buttons */}
                  {alreadySignedUp ? (
                    <>
                      {editingSignup === e.event_id ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <label style={{ fontSize: 13, color: "#374151" }}>Spots:</label>
                          <input
                            type="number"
                            min="1"
                            max={e.capacity - e.total_attendees + (mySignups.find(s => s.event_id === e.event_id)?.quantity || 0)}
                            value={editQuantity}
                            onChange={ev => setEditQuantity(Number(ev.target.value))}
                            style={{ width: 60, padding: "0.3rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                          />
                          <button
                            className="event-signup-btn"
                            style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", flex: 1 }}
                            onClick={() => handleUpdateSignup(
                              e.event_id,
                              mySignups.find(s => s.event_id === e.event_id)?.signup_id,
                              editQuantity
                            )}
                          >
                            Save
                          </button>
                          <button
                            className="event-signup-btn"
                            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", flex: 1 }}
                            onClick={() => setEditingSignup(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="event-signup-btn"
                            style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd", flex: 1 }}
                            onClick={() => {
                              setEditingSignup(e.event_id);
                              setEditQuantity(mySignups.find(s => s.event_id === e.event_id)?.quantity || 1);
                            }}
                          >
                            Edit Spots
                          </button>
                          <button
                            className="event-signup-btn"
                            style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", flex: 1 }}
                            disabled={unsigning === e.event_id}
                            onClick={() => handleUnsignup(e.event_id)}
                          >
                            {unsigning === e.event_id ? "Cancelling..." : "Cancel Signup"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      className={`event-signup-btn ${(isFull || isLocked) ? "disabled" : ""}`}
                      disabled={isFull || isLocked || signingUp === e.event_id}
                      onClick={() => handleSignup(e.event_id, isMemberOnly)}
                    >
                      {signingUp === e.event_id ? "Processing..." :
                        isLocked ? "Members Only" :
                        isFull   ? "Fully Booked" :
                        "Sign Up"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}