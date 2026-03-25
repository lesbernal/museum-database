// pages/Exhibitions.jsx
import { useEffect, useState } from "react";
import { getExhibitions } from "../services/api";
import "../styles/Exhibitions.css";

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getExhibitions()
      .then(data => setExhibitions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getDateStatus = (start, end) => {
    const now = new Date();
    if (now < new Date(start)) return "Upcoming";
    if (now > new Date(end)) return "Ended";
    return "Now On";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (d.getFullYear() >= 2099) return "Ongoing";
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  const filtered = filter === "All"
    ? exhibitions
    : exhibitions.filter(e => e.exhibition_type === filter);

  const typeBadgeClass = (type) => {
    switch (type) {
      case "Permanent":  return "badge-permanent";
      case "Temporary":  return "badge-temporary";
      case "Traveling":  return "badge-traveling";
      default: return "";
    }
  };

  const statusClass = (start, end) => {
    const s = getDateStatus(start, end);
    if (s === "Now On")   return "status-active";
    if (s === "Upcoming") return "status-upcoming";
    return "status-ended";
  };

  const cardAccents = [
    "#1a1a2e", "#2d4a3e", "#4a1942", "#1e3a5f",
    "#3d2b1f", "#1f3d2b", "#2b1f3d", "#3d1f2b",
  ];

  if (loading) return (
    <div className="exhibitions-loading">
      <p>Loading exhibitions...</p>
    </div>
  );

  return (
    <div className="exhibitions-page">
      {/* Hero */}
      <div className="exhibitions-hero">
        <p className="exhibitions-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="exhibitions-title">Exhibitions</h1>
        <p className="exhibitions-subtitle">
          Explore our current, upcoming, and permanent collections
        </p>
      </div>

      {/* Filter tabs */}
      <div className="exhibitions-filters">
        {["All", "Permanent", "Temporary", "Traveling"].map(type => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? "filter-active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="exhibitions-count">
        {filtered.length} exhibition{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="exhibitions-empty">No exhibitions found.</p>
      ) : (
        <div className="exhibitions-grid">
          {filtered.map((e, i) => {
            const status = getDateStatus(e.start_date, e.end_date);
            return (
              <div
                key={e.exhibition_id}
                className="exhibition-card"
                style={{ "--card-accent": cardAccents[i % cardAccents.length] }}
              >
                <div className="card-visual">
                  <span className={`card-type-badge ${typeBadgeClass(e.exhibition_type)}`}>
                    {e.exhibition_type}
                  </span>
                  <span className={`card-status ${statusClass(e.start_date, e.end_date)}`}>
                    {status}
                  </span>
                </div>
                <div className="card-body">
                  <h2 className="card-title">{e.exhibition_name}</h2>
                  {e.gallery_name && (
                    <p className="card-gallery">📍 {e.gallery_name}</p>
                  )}
                  <div className="card-dates">
                    <span>{formatDate(e.start_date)}</span>
                    <span className="card-dates-sep">→</span>
                    <span>{formatDate(e.end_date)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}