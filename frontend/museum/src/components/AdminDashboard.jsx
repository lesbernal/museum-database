// components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtistForm from "./ArtistForm";
import ArtistTable from "./ArtistTable";
import { getArtists, createArtist, updateArtist, deleteArtist } from "../services/api";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");
  const [artists, setArtists] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const tabs = [
    { id: "artists", name: "Artists", icon: "🎨" },
    { id: "artwork", name: "Artwork", icon: "🖼️" },
    { id: "provenance", name: "Provenance", icon: "📜" },
    { id: "users", name: "Users", icon: "👥" },
  ];

  // Load artists on mount
  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await getArtists();
      setArtists(data);
      setError("");
    } catch (err) {
      setError("Failed to load artists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingArtist(null);
    setIsFormOpen(true);
  };

  const handleEdit = (artist) => {
    setEditingArtist(artist);
    setIsFormOpen(true);
  };

  const handleSave = async (artistData) => {
    try {
      if (editingArtist) {
        await updateArtist(editingArtist.artist_id, artistData);
      } else {
        await createArtist(artistData);
      }
      await loadArtists();
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error saving artist:", err);
      alert("Failed to save artist");
    }
  };

  const handleDelete = async (artistId) => {
    if (window.confirm("Are you sure you want to delete this artist?")) {
      try {
        await deleteArtist(artistId);
        await loadArtists();
      } catch (err) {
        console.error("Error deleting artist:", err);
        alert("Failed to delete artist");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  const filteredArtists = artists.filter(artist =>
    `${artist.first_name} ${artist.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🎨 MFAH Admin</h2>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-name">{tab.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{tabs.find(t => t.id === activeTab)?.name}</h1>
            <p className="admin-subtitle">Manage {activeTab} in the museum database</p>
          </div>
          <button className="add-btn" onClick={handleAdd}>
            + Add New {activeTab.slice(0, -1)}
          </button>
        </header>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${activeTab} by name or nationality...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content Area */}
        <div className="content-area">
          {loading ? (
            <div className="loading-spinner">Loading artists...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : activeTab === "artists" && (
            <ArtistTable
              artists={filteredArtists}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {/* Add other tables for artwork, provenance, etc. */}
        </div>
      </main>

      {/* Artist Form Modal */}
      {isFormOpen && (
        <ArtistForm
          onSubmit={handleSave}
          initialData={editingArtist}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}