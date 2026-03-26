import { useEffect, useState } from "react";
import { getArtworks } from "../services/api";
import { getArtists } from "../services/api";
import "../styles/Artworks.css";

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedMediums, setSelectedMediums] = useState([]);
  const [selectedCenturies, setSelectedCenturies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [artworksData, artistsData] = await Promise.all([
        getArtworks(),
        getArtists()
      ]);
      setArtworks(artworksData);
      setArtists(artistsData);
      setFilteredArtworks(artworksData);
    } catch (err) {
      console.error("Failed to load artworks:", err);
    } finally {
      setLoading(false);
    }
  }

  const mediums = [...new Set(artworks.map(a => a.medium).filter(Boolean))];
  
  const centuries = [...new Set(artworks.map(a => {
    if (!a.creation_year) return null;
    const century = Math.floor((a.creation_year - 1) / 100) + 1;
    return century;
  }).filter(Boolean))].sort((a, b) => a - b);

  const toggleArtist = (artistId) => {
    setSelectedArtists(prev => 
      prev.includes(artistId) 
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const toggleMedium = (medium) => {
    setSelectedMediums(prev => 
      prev.includes(medium) 
        ? prev.filter(m => m !== medium)
        : [...prev, medium]
    );
  };

  const toggleCentury = (century) => {
    setSelectedCenturies(prev => 
      prev.includes(century) 
        ? prev.filter(c => c !== century)
        : [...prev, century]
    );
  };

  useEffect(() => {
    let filtered = [...artworks];
    
    if (selectedArtists.length > 0) {
      filtered = filtered.filter(a => selectedArtists.includes(a.artist_id));
    }
    
    if (selectedMediums.length > 0) {
      filtered = filtered.filter(a => selectedMediums.includes(a.medium));
    }
    
    if (selectedCenturies.length > 0) {
      filtered = filtered.filter(a => {
        if (!a.creation_year) return false;
        const century = Math.floor((a.creation_year - 1) / 100) + 1;
        return selectedCenturies.includes(century);
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      switch(sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        case "year_asc":
          return (a.creation_year || 0) - (b.creation_year || 0);
        case "year_desc":
          return (b.creation_year || 0) - (a.creation_year || 0);
        case "artist":
          return (a.artist_name || "").localeCompare(b.artist_name || "");
        default:
          return 0;
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

  const handleImageError = (artworkId) => {
    setImageErrors(prev => ({ ...prev, [artworkId]: true }));
  };

  const getArtistName = (id) => {
    const artist = artists.find(a => a.artist_id === id);
    return artist ? `${artist.first_name} ${artist.last_name}` : id;
  };

  if (loading) {
    return <div className="loading-spinner">Loading artworks...</div>;
  }

  return (
    <div className="artworks-page">
      <div className="artworks-header">
        <h1>Artwork Collection</h1>
        <p>Explore our museum's collection of fine art from around the world</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-group">
            <label>Search Artworks</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-large"
            />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-container">
          
          <div className="filter-group multi-select">
            <label>Artists ({selectedArtists.length})</label>
            <div className="dropdown">
              <button 
                className="dropdown-btn"
                onClick={() => setOpenDropdown(openDropdown === "artists" ? null : "artists")}
              >
                {selectedArtists.length === 0 
                  ? "All Artists" 
                  : `${selectedArtists.length} artist${selectedArtists.length !== 1 ? 's' : ''} selected`}
                <span className="dropdown-arrow">▼</span>
              </button>
              {openDropdown === "artists" && (
                <div className="dropdown-menu">
                  {artists.map(artist => (
                    <label key={artist.artist_id} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedArtists.includes(artist.artist_id)}
                        onChange={() => toggleArtist(artist.artist_id)}
                      />
                      <span>{artist.first_name} {artist.last_name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-group multi-select">
            <label>Mediums ({selectedMediums.length})</label>
            <div className="dropdown">
              <button 
                className="dropdown-btn"
                onClick={() => setOpenDropdown(openDropdown === "mediums" ? null : "mediums")}
              >
                {selectedMediums.length === 0 
                  ? "All Mediums" 
                  : `${selectedMediums.length} medium${selectedMediums.length !== 1 ? 's' : ''} selected`}
                <span className="dropdown-arrow">▼</span>
              </button>
              {openDropdown === "mediums" && (
                <div className="dropdown-menu">
                  {mediums.map(medium => (
                    <label key={medium} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedMediums.includes(medium)}
                        onChange={() => toggleMedium(medium)}
                      />
                      <span>{medium}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group multi-select">
            <label>Centuries ({selectedCenturies.length})</label>
            <div className="dropdown">
              <button 
                className="dropdown-btn"
                onClick={() => setOpenDropdown(openDropdown === "centuries" ? null : "centuries")}
              >
                {selectedCenturies.length === 0 
                  ? "All Centuries" 
                  : `${selectedCenturies.length} centur${selectedCenturies.length !== 1 ? 'ies' : 'y'} selected`}
                <span className="dropdown-arrow">▼</span>
              </button>
              {openDropdown === "centuries" && (
                <div className="dropdown-menu">
                  {centuries.map(century => (
                    <label key={century} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedCenturies.includes(century)}
                        onChange={() => toggleCentury(century)}
                      />
                      <span>{century}th Century</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="title">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="year_desc">Year (Newest First)</option>
              <option value="artist">Artist Name</option>
            </select>
          </div>
          
          <button className="btn-clear" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedArtists.length > 0 || selectedMediums.length > 0 || selectedCenturies.length > 0) && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          {selectedArtists.map(id => (
            <span key={`artist-${id}`} className="filter-tag" onClick={() => toggleArtist(id)}>
              {getArtistName(id)} ✕
            </span>
          ))}
          {selectedMediums.map(medium => (
            <span key={`medium-${medium}`} className="filter-tag" onClick={() => toggleMedium(medium)}>
              {medium} ✕
            </span>
          ))}
          {selectedCenturies.map(century => (
            <span key={`century-${century}`} className="filter-tag" onClick={() => toggleCentury(century)}>
              {century}th Century ✕
            </span>
          ))}
        </div>
      )}

      <div className="results-count">
        {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''} found
      </div>

      <div className="artworks-grid">
        {filteredArtworks.length === 0 ? (
          <p className="no-results">No artworks found matching your criteria.</p>
        ) : (
          filteredArtworks.map(artwork => (
            <div key={artwork.artwork_id} className="artwork-card">
              <div className="artwork-image">
                {artwork.image_url && !imageErrors[artwork.artwork_id] ? (
                  <img 
                    src={artwork.image_url} 
                    alt={artwork.title}
                    className="artwork-image-real"
                    onError={() => handleImageError(artwork.artwork_id)}
                  />
                ) : (
                  <div className="artwork-placeholder">
                    <span>🖼️</span>
                  </div>
                )}
              </div>
              <div className="artwork-info">
                <h3>{artwork.title}</h3>
                <p className="artwork-artist">
                  {artwork.artist_name || `Artist #${artwork.artist_id}`}
                </p>
                <div className="artwork-details">
                  {artwork.creation_year && (
                    <span className="detail-item">{artwork.creation_year}</span>
                  )}
                  {artwork.medium && (
                    <span className="detail-item">{artwork.medium}</span>
                  )}
                </div>
                {artwork.description && (
                  <p className="artwork-description">
                    {artwork.description.substring(0, 120)}...
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}