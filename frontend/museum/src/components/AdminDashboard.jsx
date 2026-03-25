// components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ArtistForm from "./ArtistForm";
import ArtistTable from "./ArtistTable";
import ArtworkForm from "./ArtworkForm";
import ArtworkTable from "./ArtworkTable";
import ProvenanceForm from "./ProvenanceForm";
import ProvenanceTable from "./ProvenanceTable";
import "../styles/AdminDashboard.css";
import {
  getArtists,
  createArtist,
  updateArtist,
  deleteArtist,
  getArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getProvenance,
  createProvenance,
  updateProvenance,
  deleteProvenance,
  getRevenueReport,
  getEvents,
  getAttendanceReport,
} from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [events, setEvents] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);

  // Artist states
  const [isArtistFormOpen, setIsArtistFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);

  // Artwork states
  const [isArtworkFormOpen, setIsArtworkFormOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);

  // Provenance states
  const [isProvenanceFormOpen, setIsProvenanceFormOpen] = useState(false);
  const [editingProvenance, setEditingProvenance] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const tabs = [
    { id: "artists", name: "Artists", icon: "🎨" },
    { id: "artwork", name: "Artwork", icon: "🖼️" },
    { id: "provenance", name: "Provenance", icon: "📜" },
    { id: "users", name: "Users", icon: "👥" },
    { id: "revenue", name: "Revenue", icon: "💰" },
    { id: "events", name: "Events", icon: "🎉" },
  ];

  // Load all data on mount
  useEffect(() => {
    loadArtists();
    loadArtworks();
    loadProvenance();
    loadEvents();
  }, []);

  // Load Artists
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

  // Load Artworks
  const loadArtworks = async () => {
    try {
      const data = await getArtworks();
      setArtworks(data);
    } catch (err) {
      console.error("Failed to load artworks:", err);
    }
  };

  // Load Provenance
  const loadProvenance = async () => {
    try {
      const data = await getProvenance();
      setProvenance(data);
    } catch (err) {
      console.error("Failed to load provenance:", err);
    }
  };

  // Load Events
  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  // ========== ARTIST HANDLERS ==========
  const handleAddArtist = () => {
    setEditingArtist(null);
    setIsArtistFormOpen(true);
  };

  const handleEditArtist = (artist) => {
    setEditingArtist(artist);
    setIsArtistFormOpen(true);
  };

  const handleSaveArtist = async (artistData) => {
    try {
      if (editingArtist) {
        await updateArtist(editingArtist.artist_id, artistData);
      } else {
        await createArtist(artistData);
      }
      await loadArtists();
      setIsArtistFormOpen(false);
    } catch (err) {
      console.error("Error saving artist:", err);
      alert("Failed to save artist");
    }
  };

  const handleDeleteArtist = async (artistId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this artist? This will also delete their artworks and provenance records."
      )
    ) {
      try {
        await deleteArtist(artistId);
        await loadArtists();
      } catch (err) {
        console.error("Error deleting artist:", err);
        alert("Failed to delete artist");
      }
    }
  };

  // ========== ARTWORK HANDLERS ==========
  const handleAddArtwork = () => {
    setEditingArtwork(null);
    setIsArtworkFormOpen(true);
  };

  const handleEditArtwork = (artwork) => {
    setEditingArtwork(artwork);
    setIsArtworkFormOpen(true);
  };

  const handleSaveArtwork = async (artworkData) => {
    try {
      if (editingArtwork) {
        await updateArtwork(editingArtwork.artwork_id, artworkData);
      } else {
        await createArtwork(artworkData);
      }
      await loadArtworks();
      setIsArtworkFormOpen(false);
    } catch (err) {
      console.error("Error saving artwork:", err);
      alert("Failed to save artwork");
    }
  };

  const handleDeleteArtwork = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this artwork? This will also delete its provenance records."
      )
    ) {
      try {
        await deleteArtwork(id);
        await loadArtworks();
      } catch (err) {
        console.error("Error deleting artwork:", err);
        alert("Failed to delete artwork");
      }
    }
  };

  // ========== PROVENANCE HANDLERS ==========
  const handleAddProvenance = () => {
    setEditingProvenance(null);
    setIsProvenanceFormOpen(true);
  };

  const handleEditProvenance = (record) => {
    setEditingProvenance(record);
    setIsProvenanceFormOpen(true);
  };

  const handleSaveProvenance = async (recordData) => {
    try {
      if (editingProvenance) {
        await updateProvenance(editingProvenance.provenance_id, recordData);
      } else {
        await createProvenance(recordData);
      }
      await loadProvenance();
      setIsProvenanceFormOpen(false);
    } catch (err) {
      console.error("Error saving provenance:", err);
      alert("Failed to save provenance record");
    }
  };

  const handleDeleteProvenance = async (id) => {
    if (window.confirm("Are you sure you want to delete this provenance record?")) {
      try {
        await deleteProvenance(id);
        await loadProvenance();
      } catch (err) {
        console.error("Error deleting provenance:", err);
        alert("Failed to delete provenance record");
      }
    }
  };

  // ========== GENERAL HANDLERS ==========
  const handleAdd = () => {
    if (activeTab === "artists") handleAddArtist();
    else if (activeTab === "artwork") handleAddArtwork();
    else if (activeTab === "provenance") handleAddProvenance();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  // Filtered data
  const filteredArtists = artists.filter(
    (artist) =>
      `${artist.first_name} ${artist.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      artist.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArtworks = artworks.filter(
    (artwork) =>
      artwork.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.medium?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProvenance = provenance.filter(
    (record) =>
      record.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.acquisition_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Revenue Report
  const handleGenerateRevenueReport = async () => {
    try {
      const report = await getRevenueReport();
      setRevenueReport(report);
    } catch (err) {
      console.error("Failed to generate revenue report:", err);
      alert("Failed to generate revenue report");
    }
  };

  // Attendance Report
  const handleGenerateAttendanceReport = async () => {
    try {
      const report = await getAttendanceReport();
      setAttendanceReport(report);
    } catch (err) {
      console.error("Failed to generate attendance report:", err);
      alert("Failed to generate attendance report");
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🎨 MFAH Admin</h2>
          <Link to="/" className="back-to-site">
            ← Back to Home
          </Link>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
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
            <h1>{tabs.find((t) => t.id === activeTab)?.name}</h1>
            <p className="admin-subtitle">
              Manage {activeTab} in the museum database
              {activeTab === "artists" && " — Add, edit, or remove artists"}
              {activeTab === "artwork" &&
                " — Add, edit, or remove artworks and link them to artists"}
              {activeTab === "provenance" &&
                " — Track ownership history of artworks"}
              {activeTab === "revenue" && " — Generate museum revenue report"}
              {activeTab === "events" && " — View events and attendance report"}
            </p>
          </div>

          {activeTab !== "revenue" && activeTab !== "events" && (
            <button className="add-btn" onClick={handleAdd}>
              + Add New{" "}
              {activeTab === "artists"
                ? "Artist"
                : activeTab === "artwork"
                ? "Artwork"
                : "Provenance Record"}
            </button>
          )}

          {activeTab === "revenue" && (
            <button className="add-btn" onClick={handleGenerateRevenueReport}>
              📊 Generate Revenue Report
            </button>
          )}

          {activeTab === "events" && (
            <button className="add-btn" onClick={handleGenerateAttendanceReport}>
              📊 Generate Attendance Report
            </button>
          )}
        </header>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content Area */}
        <div className="content-area">
          {loading && activeTab === "artists" ? (
            <div className="loading-spinner">Loading artists...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : activeTab === "artists" ? (
            <ArtistTable
              artists={filteredArtists}
              onEdit={handleEditArtist}
              onDelete={handleDeleteArtist}
            />
          ) : activeTab === "artwork" ? (
            <ArtworkTable
              artworks={filteredArtworks}
              onEdit={handleEditArtwork}
              onDelete={handleDeleteArtwork}
            />
          ) : activeTab === "provenance" ? (
            <ProvenanceTable
              provenance={filteredProvenance}
              onEdit={handleEditProvenance}
              onDelete={handleDeleteProvenance}
            />
          ) : activeTab === "revenue" ? (
            revenueReport ? (
              <div className="report">
                <p>Donation Revenue: ${revenueReport.donation_revenue}</p>
                <p>Ticket Revenue: ${revenueReport.ticket_revenue}</p>
                <p>Total Revenue: ${revenueReport.total_revenue}</p>
              </div>
            ) : (
              <p>Click "Generate Revenue Report" to load data</p>
            )
          ) : activeTab === "events" ? (
            <div>
              {/* Event List */}
              <h3>Events</h3>
              {events.length > 0 ? (
                <ul>
                  {events.map((event) => (
                    <li key={event.event_id}>
                      {event.event_name} —{" "}
                      {new Date(event.event_date).toLocaleDateString()} —{" "}
                      {event.total_attendees}/{event.capacity}{" "}
                      {event.capacity && event.total_attendees >= event.capacity
                        ? "(FULL)"
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No events found</p>
              )}

              <hr />

              {/* Attendance Report */}
              {attendanceReport.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Total Attendees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.map((r) => (
                      <tr key={r.event_name + r.event_date}>
                        <td>{r.event_name}</td>
                        <td>{new Date(r.event_date).toLocaleDateString()}</td>
                        <td>{r.total_attendees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Click "Generate Attendance Report" to load data</p>
              )}
            </div>
          ) : (
            <div className="coming-soon">
              <p>👥 User Management Coming Soon</p>
              <small>Manage museum staff and visitor accounts</small>
            </div>
          )}
        </div>
      </main>

      {/* Artist Form Modal */}
      {isArtistFormOpen && (
        <ArtistForm
          onSubmit={handleSaveArtist}
          initialData={editingArtist}
          onCancel={() => setIsArtistFormOpen(false)}
        />
      )}

      {/* Artwork Form Modal */}
      {isArtworkFormOpen && (
        <ArtworkForm
          onSubmit={handleSaveArtwork}
          initialData={editingArtwork}
          onCancel={() => setIsArtworkFormOpen(false)}
        />
      )}

      {/* Provenance Form Modal */}
      {isProvenanceFormOpen && (
        <ProvenanceForm
          onSubmit={handleSaveProvenance}
          initialData={editingProvenance}
          onCancel={() => setIsProvenanceFormOpen(false)}
        />
      )}
    </div>
  );
}