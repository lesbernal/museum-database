import { useEffect, useState } from "react";
import { getArtworks } from "../services/api";
import { getArtists } from "../services/api";
import "../styles/Artworks.css";

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedium, setSelectedMedium] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let filtered = [...artworks];
    
    if (selectedArtist) {
      filtered = filtered.filter(a => a.artist_id === parseInt(selectedArtist));
    }
    
    if (selectedMedium) {
      filtered = filtered.filter(a => a.medium === selectedMedium);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredArtworks(filtered);
  }, [selectedArtist, selectedMedium, searchTerm, artworks]);

  if (loading) {
    return <div className="loading-spinner">Loading artworks...</div>;
  }

  return (
    <div className="artworks-page">
      <div className="artworks-header">
        <h1>Artwork Collection</h1>
        <p>Explore our museum's collection of fine art from around the world</p>
      </div>

      <div className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Artist</label>
            <select 
              value={selectedArtist} 
              onChange={(e) => setSelectedArtist(e.target.value)}
            >
              <option value="">All Artists</option>
              {artists.map(artist => (
                <option key={artist.artist_id} value={artist.artist_id}>
                  {artist.first_name} {artist.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Medium</label>
            <select 
              value={selectedMedium} 
              onChange={(e) => setSelectedMedium(e.target.value)}
            >
              <option value="">All Mediums</option>
              {mediums.map(medium => (
                <option key={medium} value={medium}>{medium}</option>
              ))}
            </select>
          </div>
          
          <button className="btn-clear" onClick={() => {
            setSelectedArtist("");
            setSelectedMedium("");
            setSearchTerm("");
          }}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="artworks-grid">
        {filteredArtworks.length === 0 ? (
          <p className="no-results">No artworks found matching your criteria.</p>
        ) : (
          filteredArtworks.map(artwork => (
            <div key={artwork.artwork_id} className="artwork-card">
              <div className="artwork-image">
                <div className="artwork-placeholder">🖼️</div>
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
                  {artwork.dimensions && (
                    <span className="detail-item">{artwork.dimensions}</span>
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