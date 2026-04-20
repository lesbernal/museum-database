import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists } from "../services/api";
import "../styles/ArtistsGallery.css";

export default function ArtistsGallery() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNationality, setSelectedNationality] = useState("");

  useEffect(() => {
    async function loadArtists() {
      try {
        const data = await getArtists();
        setArtists(data);
      } catch (err) {
        console.error("Failed to load artists:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  // Get unique nationalities for filter
  const nationalities = [...new Set(artists.map(a => a.nationality).filter(Boolean))];

  // Filter artists
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = `${artist.first_name} ${artist.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesNationality = !selectedNationality || artist.nationality === selectedNationality;
    return matchesSearch && matchesNationality;
  });

  return (
    <div className="artists-gallery">
      <div className="gallery-header">
        <h1>Our Artists</h1>
        <p>Discover the masters and visionaries whose works grace our halls</p>
      </div>

      <div className="gallery-filters">
        <input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={selectedNationality}
          onChange={(e) => setSelectedNationality(e.target.value)}
          className="nationality-filter"
        >
          <option value="">All Nationalities</option>
          {nationalities.map(nat => (
            <option key={nat} value={nat}>{nat}</option>
          ))}
        </select>
      </div>

      <div className="artists-grid">
        {filteredArtists.map(artist => (
          <div className="artist-card-large" key={artist.artist_id}>
            <div className="artist-avatar-large">🎨</div>
            <div className="artist-info">
              <h2>{artist.first_name} {artist.last_name}</h2>
              <p className="artist-nationality">{artist.nationality}</p>
              {artist.birth_year && (
                <p className="artist-years">
                  {artist.birth_year}{artist.death_year ? ` - ${artist.death_year}` : ' - Present'}
                </p>
              )}
              {artist.biography && (
                <p className="artist-bio-preview">{artist.biography.substring(0, 150)}...</p>
              )}
              <Link to={`/artist/${artist.artist_id}`} className="view-artist-btn">
                View Artwork →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredArtists.length === 0 && (
        <div className="no-results">
          <p>No artists found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}