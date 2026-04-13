// pages/Artworks.jsx
import { useEffect, useState } from "react";
import { getArtworks, getArtists, getBuildings, getGalleries, getExhibitions } from "../services/api";
import "../styles/Artworks.css";

// ── Artwork Detail Modal ─────────────────────────────────────
function ArtworkModal({ artwork, artist, building, gallery, onClose }) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  // Simplified status: only "On Display" or "Not On Display"
  const isOnDisplay = artwork.current_display_status === "On Display";
  const displayStatus = isOnDisplay ? "On Display" : "Not On Display";
  const statusColor = isOnDisplay ? { bg: "#d1fae5", color: "#065f46" } : { bg: "#f3f4f6", color: "#6b7280" };

  return (
    <div className={`artwork-modal-overlay ${closing ? "closing" : ""}`}>
      <div className="artwork-modal" onClick={e => e.stopPropagation()}>
        <div className="artwork-modal-topbar">
          <button className="artwork-modal-close-btn" onClick={handleClose}>&times;</button>
        </div>

        <div className="artwork-modal-inner">
          {/* Left — image */}
          <div className="artwork-modal-image-wrap">
            {artwork.image_url ? (
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="artwork-modal-image"
              />
            ) : (
              <div className="artwork-modal-placeholder">🖼️</div>
            )}
          </div>

          {/* Right — info */}
          <div className="artwork-modal-info">
            <h2 className="artwork-modal-title">{artwork.title}</h2>

            {/* Simplified Status Badge */}
            <span
              className="artwork-modal-status"
              style={{ background: statusColor.bg, color: statusColor.color }}
            >
              {displayStatus}
            </span>

            {/* Location Information - Fixed to display correctly */}
            {(building || gallery) && (
              <div className="artwork-modal-section">
                <h3 className="artwork-modal-section-title">Location</h3>
                <div className="artwork-modal-location">
                  {building && building.building_name && (
                    <p className="location-building">{building.building_name}</p>
                  )}
                  {gallery && gallery.gallery_name && (
                    <p className="location-gallery">
                      {gallery.gallery_name}
                      {gallery.floor_number !== undefined && gallery.floor_number !== null && (
                        <span className="location-floor"> · Floor {gallery.floor_number}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {artist && (
              <div className="artwork-modal-section">
                <h3 className="artwork-modal-section-title">Artist</h3>
                <p className="artwork-modal-artist-name">
                  {artist.first_name} {artist.last_name}
                </p>
                {artist.nationality && (
                  <p className="artwork-modal-meta">{artist.nationality}
                    {artist.birth_year && ` · b. ${artist.birth_year}`}
                    {artist.death_year && ` – ${artist.death_year}`}
                  </p>
                )}
                {artist.biography && (
                  <p className="artwork-modal-bio-full">{artist.biography}</p>
                )}
              </div>
            )}

            <div className="artwork-modal-section">
              <h3 className="artwork-modal-section-title">Details</h3>
              <table className="artwork-modal-table">
                <tbody>
                  {artwork.creation_year && (
                    <tr><td className="table-label">Year</td><td>{artwork.creation_year}</td></tr>
                  )}
                  {artwork.medium && (
                    <tr><td className="table-label">Medium</td><td>{artwork.medium}</td></tr>
                  )}
                  {artwork.dimensions && (
                    <tr><td className="table-label">Dimensions</td><td>{artwork.dimensions}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {artwork.description && (
              <div className="artwork-modal-section">
                <h3 className="artwork-modal-section-title">About this Work</h3>
                <p className="artwork-modal-description">{artwork.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [museumbuildings, setMuseumbuildings] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedMediums, setSelectedMediums] = useState([]);
  const [selectedCenturies, setSelectedCenturies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [artworksData, artistsData, buildingsData, galleriesData, exhibitionsData] = await Promise.all([
        getArtworks(),
        getArtists(),
        getBuildings(),
        getGalleries(),
        getExhibitions(),
      ]);
      setArtworks(artworksData);
      setArtists(artistsData);
      setMuseumbuildings(buildingsData);
      setGalleries(galleriesData);
      setExhibitions(exhibitionsData);
      setFilteredArtworks(artworksData);
      
      console.log("Buildings data:", buildingsData);
      console.log("Galleries data:", galleriesData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get current location for an artwork
  const getArtworkLocation = (artwork) => {
    console.log("Getting location for artwork:", artwork);
    
    if (!artwork) return { building: null, gallery: null };
    
    // If artwork has a gallery_id directly
    if (artwork.gallery_id) {
      const gallery = galleries.find(g => g.gallery_id === artwork.gallery_id);
      console.log("Found gallery:", gallery);
      if (gallery) {
        const building = museumbuildings.find(b => b.building_id === gallery.building_id);
        console.log("Found building:", building);
        return { building, gallery };
      }
    }
    
    // You can add exhibition-based location lookup here if needed
    
    return { building: null, gallery: null };
  };

  const mediums = [...new Set(artworks.map(a => a.medium).filter(Boolean))];

  const centuries = [...new Set(artworks.map(a => {
    if (!a.creation_year) return null;
    return Math.floor((a.creation_year - 1) / 100) + 1;
  }).filter(Boolean))].sort((a, b) => a - b);

  const toggleArtist = id => setSelectedArtists(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleMedium = m => setSelectedMediums(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  const toggleCentury = c => setSelectedCenturies(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  useEffect(() => {
    let filtered = [...artworks];

    if (selectedArtists.length > 0)
      filtered = filtered.filter(a => selectedArtists.includes(a.artist_id));

    if (selectedMediums.length > 0)
      filtered = filtered.filter(a => selectedMediums.includes(a.medium));

    if (selectedCenturies.length > 0)
      filtered = filtered.filter(a => {
        if (!a.creation_year) return false;
        return selectedCenturies.includes(Math.floor((a.creation_year - 1) / 100) + 1);
      });

    if (searchTerm)
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title": return (a.title || "").localeCompare(b.title || "");
        case "title_desc": return (b.title || "").localeCompare(a.title || "");
        case "year_asc": return (a.creation_year || 0) - (b.creation_year || 0);
        case "year_desc": return (b.creation_year || 0) - (a.creation_year || 0);
        case "artist": return (a.artist_name || "").localeCompare(b.artist_name || "");
        default: return 0;
      }
    });

    setFilteredArtworks(filtered);
  }, [selectedArtists, selectedMediums, selectedCenturies, searchTerm, sortBy, artworks]);

  const clearAllFilters = () => {
    setSelectedArtists([]);
    setSelectedMediums([]);
    setSelectedCenturies([]);
    setSearchTerm("");
    setSortBy("title");
  };

  const handleImageError = id => setImageErrors(p => ({ ...p, [id]: true }));

  const getArtistName = id => {
    const a = artists.find(a => a.artist_id === id);
    return a ? `${a.first_name} ${a.last_name}` : `Artist #${id}`;
  };

  const getArtistObject = id => artists.find(a => a.artist_id === id) || null;

  if (loading) return <div className="artworks-loading">Loading artworks...</div>;

  return (
    <div className="artworks-page">
      {/* Hero Section */}
      <div className="artworks-hero">
        <p className="artworks-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="artworks-title">Artwork Collection</h1>
        <p className="artworks-subtitle">
          Explore our museum's collection of fine art from around the world
        </p>
      </div>

      {/* Search */}
      <div className="artworks-search">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="artworks-search-input"
        />
      </div>

      {/* Filters */}
      <div className="artworks-filters">
        <div className="filters-row">

          {/* Artists dropdown */}
          <div className="filter-group">
            <label>Artists</label>
            <div className="filter-select-wrapper">
              <button className="filter-select-btn" onClick={() => setOpenDropdown(openDropdown === "artists" ? null : "artists")}>
                {selectedArtists.length === 0 ? "All Artists" : `${selectedArtists.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "artists" && (
                <div className="filter-dropdown">
                  {artists.map(artist => (
                    <label key={artist.artist_id} className="filter-option">
                      <input type="checkbox" checked={selectedArtists.includes(artist.artist_id)} onChange={() => toggleArtist(artist.artist_id)} />
                      <span>{artist.first_name} {artist.last_name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mediums dropdown */}
          <div className="filter-group">
            <label>Mediums</label>
            <div className="filter-select-wrapper">
              <button className="filter-select-btn" onClick={() => setOpenDropdown(openDropdown === "mediums" ? null : "mediums")}>
                {selectedMediums.length === 0 ? "All Mediums" : `${selectedMediums.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "mediums" && (
                <div className="filter-dropdown">
                  {mediums.map(medium => (
                    <label key={medium} className="filter-option">
                      <input type="checkbox" checked={selectedMediums.includes(medium)} onChange={() => toggleMedium(medium)} />
                      <span>{medium}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Centuries dropdown */}
          <div className="filter-group">
            <label>Centuries</label>
            <div className="filter-select-wrapper">
              <button className="filter-select-btn" onClick={() => setOpenDropdown(openDropdown === "centuries" ? null : "centuries")}>
                {selectedCenturies.length === 0 ? "All Centuries" : `${selectedCenturies.length} selected`}
                <span className="filter-arrow">▼</span>
              </button>
              {openDropdown === "centuries" && (
                <div className="filter-dropdown">
                  {centuries.map(century => (
                    <label key={century} className="filter-option">
                      <input type="checkbox" checked={selectedCenturies.includes(century)} onChange={() => toggleCentury(century)} />
                      <span>{century}th Century</span>
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
              <option value="title">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="year_desc">Year (Newest First)</option>
              <option value="artist">Artist Name</option>
            </select>
          </div>

          <button className="filters-clear" onClick={clearAllFilters}>Clear All</button>
        </div>
      </div>

      {/* Active filter tags */}
      {(selectedArtists.length > 0 || selectedMediums.length > 0 || selectedCenturies.length > 0) && (
        <div className="artworks-active-tags">
          {selectedArtists.map(id => (
            <span key={`artist-${id}`} className="filter-tag" onClick={() => toggleArtist(id)}>
              {getArtistName(id)} ✕
            </span>
          ))}
          {selectedMediums.map(m => (
            <span key={`medium-${m}`} className="filter-tag" onClick={() => toggleMedium(m)}>
              {m} ✕
            </span>
          ))}
          {selectedCenturies.map(c => (
            <span key={`century-${c}`} className="filter-tag" onClick={() => toggleCentury(c)}>
              {c}th Century ✕
            </span>
          ))}
        </div>
      )}

      <div className="artworks-count">
        {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? "s" : ""} found
      </div>

      {/* Grid */}
      <div className="artworks-grid">
        {filteredArtworks.length === 0 ? (
          <p className="artworks-empty">No artworks found matching your criteria.</p>
        ) : (
          filteredArtworks.map(artwork => (
            <div
              key={artwork.artwork_id}
              className="artwork-card"
              onClick={() => setSelectedArtwork(artwork)}
            >
              <div className="artwork-image">
                {artwork.image_url && !imageErrors[artwork.artwork_id] ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="artwork-image-img"
                    onError={() => handleImageError(artwork.artwork_id)}
                  />
                ) : (
                  <div className="artwork-image-placeholder">🖼️</div>
                )}
              </div>
              <div className="artwork-info">
                <h3>{artwork.title}</h3>
                <p className="artwork-artist">
                  {artwork.artist_name || `Artist #${artwork.artist_id}`}
                </p>
                <div className="artwork-meta">
                  {artwork.creation_year && <span>{artwork.creation_year}</span>}
                  {artwork.medium && <span>{artwork.medium}</span>}
                </div>
                {artwork.description && (
                  <p className="artwork-description">
                    {artwork.description.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          artist={getArtistObject(selectedArtwork.artist_id)}
          building={getArtworkLocation(selectedArtwork).building}
          gallery={getArtworkLocation(selectedArtwork).gallery}
          onClose={() => setSelectedArtwork(null)}
        />
      )}
    </div>
  );
}