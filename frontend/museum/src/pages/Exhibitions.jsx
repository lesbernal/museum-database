// pages/Exhibitions.jsx
import { useEffect, useState } from "react";
import { getExhibitions } from "../services/api";
import "../styles/Exhibitions.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function fetchExhibitionPaintings(exhibitionId) {
  try {
    const res = await fetch(`${API_BASE}/exhibitionartwork/${exhibitionId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ─── ExhibitionCalendar modal ─────────────────────────────────────────────────

function ExhibitionCalendar({ exhibition, onClose }) {
  const start = new Date(exhibition.start_date);
  const end   = new Date(exhibition.end_date);
  const isOngoing = end.getFullYear() >= 2099;

  const [paintings, setPaintings] = useState([]);
  const [loadingArt, setLoadingArt] = useState(true);

  useEffect(() => {
    setLoadingArt(true);
    fetchExhibitionPaintings(exhibition.exhibition_id)
      .then(setPaintings)
      .finally(() => setLoadingArt(false));
  }, [exhibition.exhibition_id]);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Calculate days remaining until end
  const getDaysRemaining = () => {
    if (isOngoing) return null;
    const today = new Date();
    if (today > end) return 0;
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <button className="cal-close" onClick={onClose}>&times;</button>

        <div className="cal-header">
          <h2 className="cal-title">{exhibition.exhibition_name}</h2>
          {exhibition.gallery_name && (
            <p className="cal-gallery">📍 {exhibition.gallery_name}</p>
          )}
          
          {/* Improved Date Info with Countdown */}
          <div className="cal-date-info">
            <div className="cal-date-card">
              <span className="cal-date-label">Opens</span>
              <span className="cal-date-value">{formatDate(start)}</span>
            </div>
            <div className="cal-date-arrow">→</div>
            <div className="cal-date-card">
              <span className="cal-date-label">Closes</span>
              <span className="cal-date-value">{isOngoing ? "Ongoing" : formatDate(end)}</span>
            </div>
          </div>

          {/* Countdown Timer */}
          {!isOngoing && daysRemaining !== null && daysRemaining > 0 && (
            <div className="cal-countdown">
              <span className="cal-countdown-number">{daysRemaining}</span>
              <span className="cal-countdown-label">days remaining</span>
            </div>
          )}
          {!isOngoing && daysRemaining === 0 && (
            <div className="cal-countdown expired">
              <span>This exhibition has ended</span>
            </div>
          )}
        </div>

        <div className="cal-body">
          {/* Paintings Section - Made prominent */}
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
                      <div className="cal-painting-placeholder">🖼️</div>
                    )}
                    <div className="cal-painting-info">
                      <p className="cal-painting-title">{p.title}</p>
                      {p.artist_name && (
                        <p className="cal-painting-artist">{p.artist_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PaintingBanner ───────────────────────────────────────────────────────────

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

// ─── Main Exhibitions page ────────────────────────────────────────────────────

export default function Exhibitions() {
  const [exhibitions,        setExhibitions] = useState([]);
  const [loading,            setLoading]     = useState(true);
  const [selectedExhibition, setSelected]    = useState(null);
  const [openDropdown,       setOpenDropdown] = useState(null);
  const [searchTerm,         setSearchTerm]  = useState("");
  const [sortBy,             setSortBy]      = useState("name");

  // Multi-select filter state
  const [selectedTypes,      setSelectedTypes]    = useState([]);
  const [selectedGalleries,  setSelectedGalleries] = useState([]);
  const [selectedStatuses,   setSelectedStatuses]  = useState([]);

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

  // Unique filter options derived from data
  const galleryOptions = [...new Set(exhibitions.map(e => e.gallery_name).filter(Boolean))].sort();
  const typeOptions    = ["Permanent", "Temporary", "Traveling"];
  const statusOptions  = ["Now On", "Upcoming"];

  const toggleType    = t => setSelectedTypes(p    => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleGallery = g => setSelectedGalleries(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleStatus  = s => setSelectedStatuses(p  => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedGalleries([]);
    setSelectedStatuses([]);
    setSearchTerm("");
    setSortBy("name");
  };

  // Apply all filters + search + sort
  let filtered = [...exhibitions];

  // FILTER OUT ENDED EXHIBITIONS - Only show "Now On" and "Upcoming"
  filtered = filtered.filter(e => {
    const status = getDateStatus(e.start_date, e.end_date);
    return status !== "Ended";  // Exclude ended exhibitions
  });

  if (searchTerm)
    filtered = filtered.filter(e =>
      e.exhibition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (selectedTypes.length > 0)
    filtered = filtered.filter(e => selectedTypes.includes(e.exhibition_type));

  if (selectedGalleries.length > 0)
    filtered = filtered.filter(e => selectedGalleries.includes(e.gallery_name));

  if (selectedStatuses.length > 0)
    filtered = filtered.filter(e => selectedStatuses.includes(getDateStatus(e.start_date, e.end_date)));
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name":       return (a.exhibition_name || "").localeCompare(b.exhibition_name || "");
      case "name_desc":  return (b.exhibition_name || "").localeCompare(a.exhibition_name || "");
      case "date_asc":   return new Date(a.start_date) - new Date(b.start_date);
      case "date_desc":  return new Date(b.start_date) - new Date(a.start_date);
      default: return 0;
    }
  });

  const hasActiveFilters = selectedTypes.length > 0 || selectedGalleries.length > 0 || selectedStatuses.length > 0;

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

      {/* Search */}
      <div className="exhibitions-search">
        <input
          type="text"
          placeholder="Search by title or gallery..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="exhibitions-search-input"
        />
      </div>

      {/* Filters */}
      <div className="exhibitions-filters-bar">
        <div className="filters-row">

          {/* Type dropdown */}
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-select-wrapper">
              <button
                className="filter-select-btn"
                onClick={() => setOpenDropdown(openDropdown === "types" ? null : "types")}
              >
                {selectedTypes.length === 0 ? "All Types" : `${selectedTypes.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "types" && (
                <div className="filter-dropdown">
                  {typeOptions.map(t => (
                    <label key={t} className="filter-option">
                      <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gallery dropdown */}
          <div className="filter-group">
            <label>Gallery</label>
            <div className="filter-select-wrapper">
              <button
                className="filter-select-btn"
                onClick={() => setOpenDropdown(openDropdown === "galleries" ? null : "galleries")}
              >
                {selectedGalleries.length === 0 ? "All Galleries" : `${selectedGalleries.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "galleries" && (
                <div className="filter-dropdown">
                  {galleryOptions.map(g => (
                    <label key={g} className="filter-option">
                      <input type="checkbox" checked={selectedGalleries.includes(g)} onChange={() => toggleGallery(g)} />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status dropdown */}
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-select-wrapper">
              <button
                className="filter-select-btn"
                onClick={() => setOpenDropdown(openDropdown === "statuses" ? null : "statuses")}
              >
                {selectedStatuses.length === 0 ? "All Statuses" : `${selectedStatuses.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "statuses" && (
                <div className="filter-dropdown">
                  {statusOptions.map(s => (
                    <label key={s} className="filter-option">
                      <input type="checkbox" checked={selectedStatuses.includes(s)} onChange={() => toggleStatus(s)} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
              <option value="name">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="date_asc">Start Date (Oldest)</option>
              <option value="date_desc">Start Date (Newest)</option>
            </select>
          </div>

          <button className="filters-clear" onClick={clearAllFilters}>Clear All</button>
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="exhibitions-active-tags">
          {selectedTypes.map(t => (
            <span key={t} className="filter-tag" onClick={() => toggleType(t)}>{t} ✕</span>
          ))}
          {selectedGalleries.map(g => (
            <span key={g} className="filter-tag" onClick={() => toggleGallery(g)}>{g} ✕</span>
          ))}
          {selectedStatuses.map(s => (
            <span key={s} className="filter-tag" onClick={() => toggleStatus(s)}>{s} ✕</span>
          ))}
        </div>
      )}

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
                <PaintingBanner exhibitionId={e.exhibition_id} accentColor={accentColor} />

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