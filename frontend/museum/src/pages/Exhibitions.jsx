// pages/Exhibitions.jsx
import { useEffect, useState } from "react";
import { getExhibitions } from "../services/api";
import "../styles/Exhibitions.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const API_BASE = "http://localhost:5001";

async function fetchExhibitionPaintings(exhibitionId) {
  try {
    const res = await fetch(`${API_BASE}/exhibitionartwork/${exhibitionId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ─── ExhibitionCalendar modal ────────────────────────────────────────────────

function ExhibitionCalendar({ exhibition, onClose }) {
  const start = new Date(exhibition.start_date);
  const end   = new Date(exhibition.end_date);
  const isOngoing = end.getFullYear() >= 2099;

  const [viewYear,   setViewYear]   = useState(start.getFullYear());
  const [viewMonth,  setViewMonth]  = useState(start.getMonth());
  const [paintings,  setPaintings]  = useState([]);
  const [loadingArt, setLoadingArt] = useState(true);

  useEffect(() => {
    setLoadingArt(true);
    fetchExhibitionPaintings(exhibition.exhibition_id)
      .then(setPaintings)
      .finally(() => setLoadingArt(false));
  }, [exhibition.exhibition_id]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const classForDay = (day) => {
    if (!day) return "";
    const date    = new Date(viewYear, viewMonth, day);
    const isStart = date.toDateString() === start.toDateString();
    const isEnd   = !isOngoing && date.toDateString() === end.toDateString();
    const inRange = date >= start && (isOngoing || date <= end);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isStart) return "cal-day start-day";
    if (isEnd)   return "cal-day end-day";
    if (inRange) return "cal-day in-range";
    if (isToday) return "cal-day today";
    return "cal-day";
  };

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <button className="cal-close" onClick={onClose}>&times;</button>

        <div className="cal-header">
          <h2 className="cal-title">{exhibition.exhibition_name}</h2>
          {exhibition.gallery_name && (
            <p className="cal-gallery">📍 {exhibition.gallery_name}</p>
          )}
          <div className="cal-date-range">
            <span className="cal-start-label">Start</span>
            <span className="cal-date-val">{formatDate(start)}</span>
            <span className="cal-arrow">→</span>
            <span className="cal-end-label">End</span>
            <span className="cal-date-val">{isOngoing ? "Ongoing" : formatDate(end)}</span>
          </div>
        </div>

        <div className="cal-body">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="cal-grid">
            {DAYS.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
            {cells.map((day, idx) => (
              <div key={idx} className={day ? classForDay(day) : "cal-empty"}>
                {day || ""}
              </div>
            ))}
          </div>

          <div className="cal-legend">
            <span className="legend-dot start-dot" /> Start date
            <span className="legend-dot end-dot" /> End date
            <span className="legend-dot range-dot" /> Exhibition period
            <span className="legend-dot today-dot" /> Today
          </div>
        </div>

        <div className="cal-paintings-section">
          <h3 className="cal-paintings-heading">Works in this Exhibition</h3>
          {loadingArt ? (
            <p className="cal-paintings-loading">Loading artworks…</p>
          ) : paintings.length === 0 ? (
            <p className="cal-paintings-empty">No artworks listed for this exhibition.</p>
          ) : (
            <div className="cal-paintings-grid">
              {paintings.map((p) => (
                <div key={p.artwork_id} className="cal-painting-card">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="cal-painting-img" />
                  ) : (
                    <div className="cal-painting-placeholder" />
                  )}
                  <div className="cal-painting-info">
                    <p className="cal-painting-title">{p.title}</p>
                    {p.artist_name && (
                      <p className="cal-painting-artist">{p.artist_name}</p>
                    )}
                    {p.description && (
                      <p className="cal-painting-desc">
                        {p.description.split(/[.!?]/)[0].trim()}.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PaintingBanner ──────────────────────────────────────────────────────────

function PaintingBanner({ exhibitionId, accentColor }) {
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchExhibitionPaintings(exhibitionId).then((paintings) => {
      setImages(paintings.filter(p => p.image_url).slice(0, 3));
      setLoaded(true);
    });
  }, [exhibitionId]);

  if (!loaded || images.length === 0) {
    return <div className="card-visual" style={{ background: accentColor }} />;
  }

  return (
    <div className="card-visual card-paintings-banner">
      {images.map((p, i) => (
        <div
          key={p.artwork_id}
          className="banner-img-wrap"
          style={{ zIndex: images.length - i }}
        >
          <img src={p.image_url} alt={p.title} className="banner-img" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Exhibitions page ───────────────────────────────────────────────────

export default function Exhibitions() {
  const [exhibitions,        setExhibitions] = useState([]);
  const [loading,            setLoading]     = useState(true);
  const [filter,             setFilter]      = useState("All");
  const [selectedExhibition, setSelected]    = useState(null);

  useEffect(() => {
    setLoading(true);
    getExhibitions()
      .then(data => setExhibitions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getDateStatus = (start, end) => {
    const now = new Date();
    if (now < new Date(start)) return "Upcoming";
    if (now > new Date(end))   return "Ended";
    return "Now On";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (d.getFullYear() >= 2099) return "Ongoing";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const filtered = filter === "All"
    ? exhibitions
    : exhibitions.filter(e => e.exhibition_type === filter);

  const typeBadgeClass = (type) => {
    switch (type) {
      case "Permanent": return "badge-permanent";
      case "Temporary": return "badge-temporary";
      case "Traveling": return "badge-traveling";
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
    <div className="exhibitions-loading"><p>Loading exhibitions…</p></div>
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

      {/* Filters */}
      <div className="exhibitions-toolbar">
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
      </div>

      <p className="exhibitions-count">
        {filtered.length} exhibition{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="exhibitions-empty">No exhibitions found.</p>
      ) : (
        <div className="exhibitions-grid">
          {filtered.map((e, i) => {
            const status      = getDateStatus(e.start_date, e.end_date);
            const accentColor = cardAccents[i % cardAccents.length];
            return (
              <div
                key={e.exhibition_id}
                className="exhibition-card"
                style={{ "--card-accent": accentColor }}
                onClick={() => setSelected(e)}
                title="Click to view calendar"
              >
                <PaintingBanner
                  exhibitionId={e.exhibition_id}
                  accentColor={accentColor}
                />

                <div className="card-badges">
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
                  <p className="card-cta">View calendar</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedExhibition && (
        <ExhibitionCalendar
          exhibition={selectedExhibition}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}