import { useState, useEffect, useRef } from "react";
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
import EventForm from "./EventForm";
import EventTable from "./EventTable";
import CafeAdminPanel from "./CafeAdminPanel";
import GiftShopAdminPanel from "./GiftShopAdminPanel";
import UserManagement from "./UserManagement";
import ReportsPanel from "./ReportsPanel";
import DepartmentManagement from "./DepartmentManagement";
import ExhibitionArchive from "./ExhibitionArchive";

import {
  getArtists, createArtist, updateArtist, deleteArtist,
  getArtworks, createArtwork, updateArtwork, deleteArtwork,
  getProvenance, createProvenance, updateProvenance, deleteProvenance,
  getExhibitions, createExhibition, updateExhibition, deleteExhibition,
  getGalleries, createGallery, updateGallery, deleteGallery,
  getEvents, createEvent, updateEvent, deleteEvent,
} from "../services/api";

import "../styles/AdminDashboard.css";
import "../styles/UserManagement.css";

const API_BASE = "http://localhost:5001";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExhibitionArchive, setShowExhibitionArchive] = useState(false);

  // Data
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [events, setEvents] = useState([]);

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
  const [exhibitionTypeFilter,    setExhibitionTypeFilter]    = useState("All");
  const [exhibitionStatusFilter,  setExhibitionStatusFilter]  = useState("All");
  const [exhibitionGalleryFilter, setExhibitionGalleryFilter] = useState("All");
  const [exhibitionSort,          setExhibitionSort]          = useState("title");

  // Gallery states
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);

  // Event states
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [artistsError, setArtistsError] = useState("");
  const [artworksError, setArtworksError] = useState("");
  const [provenanceError, setProvenanceError] = useState("");
  const [exhibitionsError, setExhibitionsError] = useState("");
  const [galleriesError, setGalleriesError] = useState("");
  const [eventsError, setEventsError] = useState("");
  const userMgmtRef = useRef(null);
  const deptMgmtRef = useRef(null);
  const [userMgmtSubTab, setUserMgmtSubTab] = useState("users");
  const navigate = useNavigate();

  const tabs = [
    { id: "artists",     name: "Artists",     icon: "🎨" },
    { id: "artwork",     name: "Artwork",      icon: "🖼️" },
    { id: "provenance",  name: "Provenance",   icon: "📜" },
    { id: "exhibitions", name: "Exhibitions",  icon: "🏛️" },
    { id: "galleries",   name: "Galleries",    icon: "🗺️" },
    { id: "events",      name: "Events",       icon: "🎉" },
    { id: "cafe",        name: "Cafe",         icon: "☕" },
    { id: "giftshop",    name: "Gift Shop",    icon: "🛍️" },
    { id: "reports",     name: "Reports",      icon: "📊" },
    { id: "users",       name: "Users",        icon: "👥" },
    { id: "departments", name: "Departments",  icon: "🏢" },
  ];

  useEffect(() => {
    loadArtists();
    loadArtworks();
    loadProvenance();
    loadExhibitions();
    loadGalleries();
    loadEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector(".admin-sidebar");
      const toggleBtn = document.querySelector(".mobile-menu-toggle");
      if (isMobileMenuOpen && sidebar && !sidebar.contains(event.target) && !toggleBtn?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const loadArtists = async () => {
    setLoading(true);
    try { const data = await getArtists(); setArtists(data); setArtistsError(""); }
    catch (err) { setArtistsError("Failed to load artists"); console.error(err); }
    finally { setLoading(false); }
  };
  const loadArtworks = async () => {
    try { const data = await getArtworks(); setArtworks(data); setArtworksError(""); }
    catch (err) { setArtworksError("Failed to load artworks"); console.error(err); }
  };
  const loadProvenance = async () => {
    try { const data = await getProvenance(); setProvenance(data); setProvenanceError(""); }
    catch (err) { setProvenanceError("Failed to load provenance"); console.error(err); }
  };
  const loadExhibitions = async () => {
    try { const data = await getExhibitions(); setExhibitions(data); setExhibitionsError(""); }
    catch (err) { setExhibitionsError("Failed to load exhibitions"); console.error(err); }
  };
  const loadGalleries = async () => {
    try { const data = await getGalleries(); setGalleries(data); setGalleriesError(""); }
    catch (err) { setGalleriesError("Failed to load galleries"); console.error(err); }
  };
  const loadEvents = async () => {
    try { const data = await getEvents(); setEvents(data); setEventsError(""); }
    catch (err) { setEventsError("Failed to load events"); console.error(err); }
  };

  const handleExhibitionArchive = async (id) => {
    if (!window.confirm("Archive this exhibition? It can be restored later.")) return;
    try {
      await fetch(`${API_BASE}/exhibitions/${id}/deactivate`, { method: "PATCH" });
      await loadExhibitions();
    } catch (err) {
      console.error("Error archiving exhibition:", err);
      alert("Failed to archive exhibition");
    }
  };

  // Artist handlers
  const handleAddArtist = () => { setEditingArtist(null); setIsArtistFormOpen(true); };
  const handleEditArtist = (artist) => { setEditingArtist(artist); setIsArtistFormOpen(true); };
  const handleSaveArtist = async (artistData) => {
    try {
      if (editingArtist) await updateArtist(editingArtist.artist_id, artistData);
      else await createArtist(artistData);
      await loadArtists(); setIsArtistFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save artist"); }
  };
  const handleDeleteArtist = async (artistId) => {
    if (window.confirm("Delete this artist? This will also delete their artworks and provenance records.")) {
      try { await deleteArtist(artistId); await loadArtists(); }
      catch (err) { console.error(err); alert("Failed to delete artist"); }
    }
  };

  // Artwork handlers
  const handleAddArtwork = () => { setEditingArtwork(null); setIsArtworkFormOpen(true); };
  const handleEditArtwork = (artwork) => { setEditingArtwork(artwork); setIsArtworkFormOpen(true); };
  const handleSaveArtwork = async (artworkData) => {
    try {
      if (editingArtwork) await updateArtwork(editingArtwork.artwork_id, artworkData);
      else await createArtwork(artworkData);
      await loadArtworks(); setIsArtworkFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save artwork"); }
  };
  const handleDeleteArtwork = async (id) => {
    if (window.confirm("Delete this artwork? This will also delete its provenance records.")) {
      try { await deleteArtwork(id); await loadArtworks(); }
      catch (err) { console.error(err); alert("Failed to delete artwork"); }
    }
  };

  // Provenance handlers
  const handleAddProvenance = () => { setEditingProvenance(null); setIsProvenanceFormOpen(true); };
  const handleEditProvenance = (record) => { setEditingProvenance(record); setIsProvenanceFormOpen(true); };
  const handleSaveProvenance = async (recordData) => {
    try {
      if (editingProvenance) await updateProvenance(editingProvenance.provenance_id, recordData);
      else await createProvenance(recordData);
      await loadProvenance(); setIsProvenanceFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save provenance record"); }
  };
  const handleDeleteProvenance = async (id) => {
    if (window.confirm("Delete this provenance record?")) {
      try { await deleteProvenance(id); await loadProvenance(); }
      catch (err) { console.error(err); alert("Failed to delete provenance record"); }
    }
  };

  // Exhibition handlers
  const handleAddExhibition = () => { setEditingExhibition(null); setIsExhibitionFormOpen(true); };
  const handleEditExhibition = (exhibition) => { setEditingExhibition(exhibition); setIsExhibitionFormOpen(true); };
  const handleSaveExhibition = async (exhibitionData) => {
    try {
      if (editingExhibition) await updateExhibition(editingExhibition.exhibition_id, exhibitionData);
      else await createExhibition(exhibitionData);
      await loadExhibitions(); setIsExhibitionFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save exhibition"); }
  };
  const handleDeleteExhibition = async (id) => {
    if (window.confirm("Permanently delete this exhibition? This cannot be undone.")) {
      try { await deleteExhibition(id); await loadExhibitions(); }
      catch (err) { console.error(err); alert("Failed to delete exhibition"); }
    }
  };

  // Gallery handlers
  const handleAddGallery = () => { setEditingGallery(null); setIsGalleryFormOpen(true); };
  const handleEditGallery = (gallery) => { setEditingGallery(gallery); setIsGalleryFormOpen(true); };
  const handleSaveGallery = async (galleryData) => {
    try {
      if (editingGallery) await updateGallery(editingGallery.gallery_id, galleryData);
      else await createGallery(galleryData);
      await loadGalleries(); setIsGalleryFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save gallery"); }
  };
  const handleDeleteGallery = async (id) => {
    if (window.confirm("Delete this gallery? This will also delete its exhibitions and events.")) {
      try { await deleteGallery(id); await loadGalleries(); }
      catch (err) { console.error(err); alert("Failed to delete gallery"); }
    }
  };

  // Event handlers
  const handleAddEvent = () => { setEditingEvent(null); setIsEventFormOpen(true); };
  const handleEditEvent = (event) => { setEditingEvent(event); setIsEventFormOpen(true); };
  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) await updateEvent(editingEvent.event_id, eventData);
      else await createEvent(eventData);
      await loadEvents(); setIsEventFormOpen(false);
    } catch (err) { console.error(err); alert("Failed to save event"); }
  };
  const handleDeleteEvent = async (id) => {
    if (window.confirm("Delete this event?")) {
      try { await deleteEvent(id); await loadEvents(); }
      catch (err) { console.error(err); alert("Failed to delete event"); }
    }
  };

  const handleAdd = () => {
    switch (activeTab) {
      case "artists":     return handleAddArtist();
      case "artwork":     return handleAddArtwork();
      case "provenance":  return handleAddProvenance();
      case "exhibitions": return handleAddExhibition();
      case "galleries":   return handleAddGallery();
      case "events":      return handleAddEvent();
      case "users":       return userMgmtRef.current?.openAdd();
      case "departments": return deptMgmtRef.current?.openAdd();
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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm("");
    setIsMobileMenuOpen(false);
    if (tabId !== "exhibitions") setShowExhibitionArchive(false);
  };

  const filteredArtists = artists.filter((a) =>
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredArtworks = artworks.filter((a) =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.medium?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredProvenance = provenance.filter((r) =>
    r.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.acquisition_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExhibitionStatus = (start, end) => {
    const now = new Date();
    if (now < new Date(start)) return "Upcoming";
    if (now > new Date(end))   return "Ended";
    return "Active";
  };

  const exhibitionGalleries = [...new Set(exhibitions.map(e => e.gallery_name).filter(Boolean))].sort();

  const filteredExhibitions = exhibitions
    .filter((e) => {
      const matchesSearch =
        e.exhibition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.exhibition_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType    = exhibitionTypeFilter === "All"    || e.exhibition_type === exhibitionTypeFilter;
      const matchesStatus  = exhibitionStatusFilter === "All"  || getExhibitionStatus(e.start_date, e.end_date) === exhibitionStatusFilter;
      const matchesGallery = exhibitionGalleryFilter === "All" || e.gallery_name === exhibitionGalleryFilter;
      return matchesSearch && matchesType && matchesStatus && matchesGallery;
    })
    .sort((a, b) => {
      switch (exhibitionSort) {
        case "title":      return (a.exhibition_name || "").localeCompare(b.exhibition_name || "");
        case "title_desc": return (b.exhibition_name || "").localeCompare(a.exhibition_name || "");
        case "date_asc":   return new Date(a.start_date) - new Date(b.start_date);
        case "date_desc":  return new Date(b.start_date) - new Date(a.start_date);
        default: return 0;
      }
    });

  const filteredGalleries = galleries.filter((g) =>
    g.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    e.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usesCustomManager = activeTab === "cafe" || activeTab === "giftshop";

  const getAddLabel = () => {
    switch (activeTab) {
      case "artists":     return "Artist";
      case "artwork":     return "Artwork";
      case "provenance":  return "Provenance Record";
      case "exhibitions": return "Exhibition";
      case "galleries":   return "Gallery";
      case "events":      return "Event";
      case "users":       return userMgmtSubTab.slice(0, -1);
      case "departments": return "Department";
      default: return "";
    }
  };

  return (
    <div className="admin-dashboard">
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>MFAH Admin</h2>
          <Link to="/" className="back-to-site" onClick={() => setIsMobileMenuOpen(false)}>
            Back to Home
          </Link>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-name">{tab.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{tabs.find((t) => t.id === activeTab)?.name}</h1>
            <p className="admin-subtitle">
              Manage {activeTab} in the museum database
              {activeTab === "artists"     && " - Add, edit, or remove artists"}
              {activeTab === "artwork"     && " - Add, edit, or remove artworks and link them to artists"}
              {activeTab === "provenance"  && " - Track ownership history of artworks"}
              {activeTab === "exhibitions" && " - Manage exhibitions and their associated artworks"}
              {activeTab === "galleries"   && " - Manage gallery spaces and their climate settings"}
              {activeTab === "events"      && " - Add, edit, or remove museum events"}
              {activeTab === "cafe"        && " - Manage cafe items, transactions, and line items"}
              {activeTab === "giftshop"    && " - Manage gift shop items, transactions, and line items"}
              {activeTab === "departments" && " - Manage museum departments and budgets"}
            </p>
          </div>
          {!usesCustomManager && activeTab !== "reports" && (
            <button className="add-btn" onClick={handleAdd}>
              + Add New {getAddLabel()}
            </button>
          )}
        </header>

        {/* ── Exhibitions: filter bar + archived toggle ── */}
        {activeTab === "exhibitions" && (
          <>
            <div className="exhibition-filters-bar">
              <div className="ex-filter-group">
                <label>Type</label>
                <select value={exhibitionTypeFilter} onChange={(e) => setExhibitionTypeFilter(e.target.value)}>
                  <option value="All">All Types</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Traveling">Traveling</option>
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Status</label>
                <select value={exhibitionStatusFilter} onChange={(e) => setExhibitionStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ended">Ended</option>
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Gallery</label>
                <select value={exhibitionGalleryFilter} onChange={(e) => setExhibitionGalleryFilter(e.target.value)}>
                  <option value="All">All Galleries</option>
                  {exhibitionGalleries.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Sort By</label>
                <select value={exhibitionSort} onChange={(e) => setExhibitionSort(e.target.value)}>
                  <option value="title">Title A–Z</option>
                  <option value="title_desc">Title Z–A</option>
                  <option value="date_asc">Start Date (Oldest)</option>
                  <option value="date_desc">Start Date (Newest)</option>
                </select>
              </div>
              {(exhibitionTypeFilter !== "All" || exhibitionStatusFilter !== "All" || exhibitionGalleryFilter !== "All" || exhibitionSort !== "title") && (
                <button className="ex-filter-clear" onClick={() => {
                  setExhibitionTypeFilter("All");
                  setExhibitionStatusFilter("All");
                  setExhibitionGalleryFilter("All");
                  setExhibitionSort("title");
                }}>
                  Clear Filters
                </button>
              )}
            </div>

            <div className="exhibitions-admin-toolbar">
              <p className="ex-results-count">
                {filteredExhibitions.length} exhibition{filteredExhibitions.length !== 1 ? "s" : ""}
              </p>
              <button
                className="btn-view-archived"
                onClick={() => setShowExhibitionArchive((v) => !v)}
              >
                🗄 {showExhibitionArchive ? "Hide Archived" : "View Archived Exhibitions"}
              </button>
            </div>
          </>
        )}

        {!usesCustomManager && activeTab !== "reports" && (
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
          {/* Artists */}
          {activeTab === "artists" && (
            artistsError
              ? <div className="error-message">{artistsError}</div>
              : <ArtistTable artists={filteredArtists} onEdit={handleEditArtist} onDelete={handleDeleteArtist} />
          )}

          {/* Artwork */}
          {activeTab === "artwork" && (
            artworksError
              ? <div className="error-message">{artworksError}</div>
              : <ArtworkTable artworks={filteredArtworks} onEdit={handleEditArtwork} onDelete={handleDeleteArtwork} />
          )}

          {/* Provenance */}
          {activeTab === "provenance" && (
            provenanceError
              ? <div className="error-message">{provenanceError}</div>
              : <ProvenanceTable provenance={filteredProvenance} onEdit={handleEditProvenance} onDelete={handleDeleteProvenance} />
          )}

          {/* Exhibitions */}
          {activeTab === "exhibitions" && (
            <>
              {showExhibitionArchive && (
                <ExhibitionArchive
                  apiBase={API_BASE}
                  onRestored={() => loadExhibitions()}
                />
              )}
              {exhibitionsError
                ? <div className="error-message">{exhibitionsError}</div>
                : (
                  <ExhibitionTable
                    exhibitions={filteredExhibitions}
                    onEdit={handleEditExhibition}
                    onDelete={handleDeleteExhibition}
                    onArchive={handleExhibitionArchive}
                  />
                )
              }
            </>
          )}

          {/* Galleries */}
          {activeTab === "galleries" && (
            galleriesError
              ? <div className="error-message">{galleriesError}</div>
              : <GalleryTable galleries={filteredGalleries} onEdit={handleEditGallery} onDelete={handleDeleteGallery} />
          )}

          {/* Events */}
          {activeTab === "events" && (
            eventsError
              ? <div className="error-message">{eventsError}</div>
              : <EventTable events={filteredEvents} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
          )}

          {activeTab === "cafe"        && <CafeAdminPanel />}
          {activeTab === "giftshop"    && <GiftShopAdminPanel />}
          {activeTab === "reports"     && <ReportsPanel />}
          {activeTab === "users"       && <UserManagement ref={userMgmtRef} searchTerm={searchTerm} onSubTabChange={setUserMgmtSubTab} />}
          {activeTab === "departments" && <DepartmentManagement ref={deptMgmtRef} searchTerm={searchTerm} />}
        </div>
      </main>

      {/* Modals */}
      {isArtistFormOpen     && <ArtistForm     onSubmit={handleSaveArtist}     initialData={editingArtist}     onCancel={() => setIsArtistFormOpen(false)} />}
      {isArtworkFormOpen    && <ArtworkForm    onSubmit={handleSaveArtwork}    initialData={editingArtwork}    onCancel={() => setIsArtworkFormOpen(false)} />}
      {isProvenanceFormOpen && <ProvenanceForm onSubmit={handleSaveProvenance} initialData={editingProvenance} onCancel={() => setIsProvenanceFormOpen(false)} />}
      {isExhibitionFormOpen && <ExhibitionForm onSubmit={handleSaveExhibition} initialData={editingExhibition} onCancel={() => setIsExhibitionFormOpen(false)} />}
      {isGalleryFormOpen    && <GalleryForm    onSubmit={handleSaveGallery}    initialData={editingGallery}    onCancel={() => setIsGalleryFormOpen(false)} />}
      {isEventFormOpen      && <EventForm      onSubmit={handleSaveEvent}      initialData={editingEvent}      onCancel={() => setIsEventFormOpen(false)} />}
    </div>
  );
}