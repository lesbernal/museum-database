import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ArtistForm from "./ArtistForm";
import ArtistTable from "./ArtistTable";
import ArtworkForm from "./ArtworkForm";
import ArtworkTable from "./ArtworkTable";
import ProvenanceForm from "./ProvenanceForm";
import ProvenanceTable from "./ProvenanceTable";
import ExhibitionForm from "./ExhibitionForm";
import ExhibitionTable from "./ExhibitionTable";
import GalleryForm from "./GalleryForm";
import GalleryTable from "./GalleryTable";
import CafeAdminPanel from "./CafeAdminPanel";
import GiftShopAdminPanel from "./GiftShopAdminPanel";
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
  getExhibitions,
  createExhibition,
  updateExhibition,
  deleteExhibition,
  getGalleries,
  createGallery,
  updateGallery,
  deleteGallery,
} from "../services/api";
import "../styles/AdminDashboard.css";
import UserManagement from "./UserManagement";
import "../styles/UserManagement.css";
import ReportsPanel from "./ReportsPanel";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");

  // Data
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [galleries, setGalleries] = useState([]);

  // Artist states
  const [isArtistFormOpen, setIsArtistFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);

  // Artwork states
  const [isArtworkFormOpen, setIsArtworkFormOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);

  // Provenance states
  const [isProvenanceFormOpen, setIsProvenanceFormOpen] = useState(false);
  const [editingProvenance, setEditingProvenance] = useState(null);

  // Exhibition states
  const [isExhibitionFormOpen, setIsExhibitionFormOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);

  // Gallery states
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);

  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [artistsError, setArtistsError] = useState("");
  const [artworksError, setArtworksError] = useState("");
  const [provenanceError, setProvenanceError] = useState("");
  const [exhibitionsError, setExhibitionsError] = useState("");
  const [galleriesError, setGalleriesError] = useState("");

  const navigate = useNavigate();

  const tabs = [
    { id: "artists", name: "Artists", icon: "🎨" },
    { id: "artwork", name: "Artwork", icon: "🖼️" },
    { id: "provenance", name: "Provenance", icon: "📜" },
    { id: "exhibitions", name: "Exhibitions", icon: "🏛️" },
    { id: "galleries", name: "Galleries", icon: "🗺️" },
    { id: "cafe", name: "Cafe", icon: "☕" },
    { id: "giftshop", name: "Gift Shop", icon: "🛍️" },
    { id: "reports", name: "Reports", icon: "📊" },
    { id: "users", name: "Users", icon: "👥" },
  ];

  // Load all data on mount
  useEffect(() => {
    loadArtists();
    loadArtworks();
    loadProvenance();
    loadExhibitions();
    loadGalleries();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await getArtists();
      setArtists(data);
      setArtistsError("");
    } catch (err) {
      setArtistsError("Failed to load artists");
      console.error("Artists error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadArtworks = async () => {
    try {
      const data = await getArtworks();
      setArtworks(data);
      setArtworksError("");
    } catch (err) {
      setArtworksError("Failed to load artworks");
      console.error("Artworks error:", err);
    }
  };

  const loadProvenance = async () => {
    try {
      const data = await getProvenance();
      setProvenance(data);
      setProvenanceError("");
    } catch (err) {
      setProvenanceError("Failed to load provenance");
      console.error("Provenance error:", err);
    }
  };

  const loadExhibitions = async () => {
    try {
      const data = await getExhibitions();
      setExhibitions(data);
      setExhibitionsError("");
    } catch (err) {
      setExhibitionsError("Failed to load exhibitions");
      console.error("Exhibitions error:", err);
    }
  };

  const loadGalleries = async () => {
    try {
      const data = await getGalleries();
      setGalleries(data);
      setGalleriesError("");
    } catch (err) {
      setGalleriesError("Failed to load galleries");
      console.error("Galleries error:", err);
    }
  };

  // Artist handlers
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
    if (window.confirm("Are you sure you want to delete this artist? This will also delete their artworks and provenance records.")) {
      try {
        await deleteArtist(artistId);
        await loadArtists();
      } catch (err) {
        console.error("Error deleting artist:", err);
        alert("Failed to delete artist");
      }
    }
  };

  // Artwork handlers
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
    if (window.confirm("Are you sure you want to delete this artwork? This will also delete its provenance records.")) {
      try {
        await deleteArtwork(id);
        await loadArtworks();
      } catch (err) {
        console.error("Error deleting artwork:", err);
        alert("Failed to delete artwork");
      }
    }
  };

  // Provenance handlers
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

  // Exhibition handlers
  const handleAddExhibition = () => {
    setEditingExhibition(null);
    setIsExhibitionFormOpen(true);
  };

  const handleEditExhibition = (exhibition) => {
    setEditingExhibition(exhibition);
    setIsExhibitionFormOpen(true);
  };

  const handleSaveExhibition = async (exhibitionData) => {
    try {
      if (editingExhibition) {
        await updateExhibition(editingExhibition.exhibition_id, exhibitionData);
      } else {
        await createExhibition(exhibitionData);
      }
      await loadExhibitions();
      setIsExhibitionFormOpen(false);
    } catch (err) {
      console.error("Error saving exhibition:", err);
      alert("Failed to save exhibition");
    }
  };

  const handleDeleteExhibition = async (id) => {
    if (window.confirm("Are you sure you want to delete this exhibition? This will also remove its artwork associations.")) {
      try {
        await deleteExhibition(id);
        await loadExhibitions();
      } catch (err) {
        console.error("Error deleting exhibition:", err);
        alert("Failed to delete exhibition");
      }
    }
  };

  // Gallery handlers
  const handleAddGallery = () => {
    setEditingGallery(null);
    setIsGalleryFormOpen(true);
  };

  const handleEditGallery = (gallery) => {
    setEditingGallery(gallery);
    setIsGalleryFormOpen(true);
  };

  const handleSaveGallery = async (galleryData) => {
    try {
      if (editingGallery) {
        await updateGallery(editingGallery.gallery_id, galleryData);
      } else {
        await createGallery(galleryData);
      }
      await loadGalleries();
      setIsGalleryFormOpen(false);
    } catch (err) {
      console.error("Error saving gallery:", err);
      alert("Failed to save gallery");
    }
  };

  const handleDeleteGallery = async (id) => {
    if (window.confirm("Are you sure you want to delete this gallery? This will also delete its exhibitions and events.")) {
      try {
        await deleteGallery(id);
        await loadGalleries();
      } catch (err) {
        console.error("Error deleting gallery:", err);
        alert("Failed to delete gallery");
      }
    }
  };

  // General dispatcher
  const handleAdd = () => {
    switch (activeTab) {
      case "artists": return handleAddArtist();
      case "artwork": return handleAddArtwork();
      case "provenance": return handleAddProvenance();
      case "exhibitions": return handleAddExhibition();
      case "galleries": return handleAddGallery();
      default: return;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  // Filtered data
  const filteredArtists = artists.filter(artist =>
    `${artist.first_name} ${artist.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artwork.medium?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProvenance = provenance.filter(record =>
    record.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.acquisition_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExhibitions = exhibitions.filter(exhibition =>
    exhibition.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGalleries = galleries.filter(gallery =>
    gallery.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gallery.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add button label
  const getAddLabel = () => {
    switch (activeTab) {
      case "artists": return "Artist";
      case "artwork": return "Artwork";
      case "provenance": return "Provenance Record";
      case "exhibitions": return "Exhibition";
      case "galleries": return "Gallery";
      default: return "";
    }
  };

  const usesCustomManager = activeTab === "cafe" || activeTab === "giftshop";

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>MFAH Admin</h2>
          <Link to="/" className="back-to-site">
            Back to Home
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
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{tabs.find((t) => t.id === activeTab)?.name}</h1>
            <p className="admin-subtitle">
              Manage {activeTab} in the museum database
              {activeTab === "artists" && " - Add, edit, or remove artists"}
              {activeTab === "artwork" && " - Add, edit, or remove artworks and link them to artists"}
              {activeTab === "provenance" && " - Track ownership history of artworks"}
              {activeTab === "exhibitions" && " - Manage exhibitions and their associated artworks"}
              {activeTab === "galleries" && " - Manage gallery spaces and their climate settings"}
              {activeTab === "cafe" && " - Manage cafe items, transactions, and line items"}
              {activeTab === "giftshop" && " - Manage gift shop items, transactions, and line items"}
            </p>
          </div>
          {!usesCustomManager && activeTab !== "users" && (
            <button className="add-btn" onClick={handleAdd}>
              + Add New {getAddLabel()}
            </button>
          )}
        </header>

        {!usesCustomManager && (
          <div className="search-bar">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className="content-area">
          {/* Artists Tab */}
          {activeTab === "artists" && (
            <>
              {loading ? (
                <div className="loading-spinner">Loading artists...</div>
              ) : artistsError ? (
                <div className="error-message">{artistsError}</div>
              ) : filteredArtists.length === 0 ? (
                <div className="no-data">No artists found. Click "Add New Artist" to get started.</div>
              ) : (
                <ArtistTable
                  artists={filteredArtists}
                  onEdit={handleEditArtist}
                  onDelete={handleDeleteArtist}
                />
              )}
            </>
          )}

          {/* Artwork Tab */}
          {activeTab === "artwork" && (
            <>
              {artworksError ? (
                <div className="error-message">{artworksError}</div>
              ) : filteredArtworks.length === 0 ? (
                <div className="no-data">No artworks found. Click "Add New Artwork" to get started.</div>
              ) : (
                <ArtworkTable
                  artworks={filteredArtworks}
                  onEdit={handleEditArtwork}
                  onDelete={handleDeleteArtwork}
                />
              )}
            </>
          )}

          {/* Provenance Tab */}
          {activeTab === "provenance" && (
            <>
              {provenanceError ? (
                <div className="error-message">{provenanceError}</div>
              ) : filteredProvenance.length === 0 ? (
                <div className="no-data">No provenance records found. Click "Add New Provenance Record" to get started.</div>
              ) : (
                <ProvenanceTable
                  provenance={filteredProvenance}
                  onEdit={handleEditProvenance}
                  onDelete={handleDeleteProvenance}
                />
              )}
            </>
          )}

          {/* Exhibitions Tab */}
          {activeTab === "exhibitions" && (
            <>
              {exhibitionsError ? (
                <div className="error-message">{exhibitionsError}</div>
              ) : filteredExhibitions.length === 0 ? (
                <div className="no-data">No exhibitions found. Click "Add New Exhibition" to get started.</div>
              ) : (
                <ExhibitionTable
                  exhibitions={filteredExhibitions}
                  onEdit={handleEditExhibition}
                  onDelete={handleDeleteExhibition}
                />
              )}
            </>
          )}

          {/* Galleries Tab */}
          {activeTab === "galleries" && (
            <>
              {galleriesError ? (
                <div className="error-message">{galleriesError}</div>
              ) : filteredGalleries.length === 0 ? (
                <div className="no-data">No galleries found. Click "Add New Gallery" to get started.</div>
              ) : (
                <GalleryTable
                  galleries={filteredGalleries}
                  onEdit={handleEditGallery}
                  onDelete={handleDeleteGallery}
                />
              )}
            </>
          )}

          {/* Cafe Tab */}
          {activeTab === "cafe" && <CafeAdminPanel />}

          {/* Gift Shop Tab */}
          {activeTab === "giftshop" && <GiftShopAdminPanel />}

          {/* Reports Tab */}
          {activeTab === "reports" && <ReportsPanel />}

          {/* Users Tab */}
          {activeTab === "users" && (
            <UserManagement />
          )}
        </div>
      </main>

      {isArtistFormOpen && (
        <ArtistForm
          onSubmit={handleSaveArtist}
          initialData={editingArtist}
          onCancel={() => setIsArtistFormOpen(false)}
        />
      )}

      {isArtworkFormOpen && (
        <ArtworkForm
          onSubmit={handleSaveArtwork}
          initialData={editingArtwork}
          onCancel={() => setIsArtworkFormOpen(false)}
        />
      )}

      {isProvenanceFormOpen && (
        <ProvenanceForm
          onSubmit={handleSaveProvenance}
          initialData={editingProvenance}
          onCancel={() => setIsProvenanceFormOpen(false)}
        />
      )}

      {/* Exhibition Form Modal */}
      {isExhibitionFormOpen && (
        <ExhibitionForm
          onSubmit={handleSaveExhibition}
          initialData={editingExhibition}
          onCancel={() => setIsExhibitionFormOpen(false)}
        />
      )}

      {/* Gallery Form Modal */}
      {isGalleryFormOpen && (
        <GalleryForm
          onSubmit={handleSaveGallery}
          initialData={editingGallery}
          onCancel={() => setIsGalleryFormOpen(false)}
        />
      )}
    </div>
  );
}