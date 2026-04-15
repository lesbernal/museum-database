import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ArtistForm from "./ArtistForm";
import ArtistTable from "./ArtistTable";
import ArtworkForm from "./ArtworkForm";
import ArtworkTable from "./ArtworkTable";
import Archive from "./Archive"; // Unified archive component
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

import {
  getArtists, createArtist, updateArtist, deleteArtist,
  getArtworks, createArtwork, updateArtwork, deleteArtwork,
  getProvenance, createProvenance, updateProvenance, deleteProvenance,
  getExhibitions, createExhibition, updateExhibition, deleteExhibition,
  getGalleries, createGallery, updateGallery, deleteGallery,
  getEvents, createEvent, updateEvent, deleteEvent,
  getCafeItems, getGiftShopItems,
} from "../services/api";

import "../styles/AdminDashboard.css";
import "../styles/UserManagement.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExhibitionArchive, setShowExhibitionArchive] = useState(false);
  const [showGalleryArchive, setShowGalleryArchive] = useState(false);
  const [showArtworkArchive, setShowArtworkArchive] = useState(false);
  const [showEventArchive, setShowEventArchive] = useState(false);

  // Data
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [events, setEvents] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showStockToast, setShowStockToast] = useState(false);

  // Artist states
  const [isArtistFormOpen, setIsArtistFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);

  // Artwork states
  const [isArtworkFormOpen, setIsArtworkFormOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [artworkArtistFilter, setArtworkArtistFilter] = useState("All");
  const [artworkMediumFilter, setArtworkMediumFilter] = useState("All");
  const [artworkStatusFilter, setArtworkStatusFilter] = useState("All");
  const [artworkSort, setArtworkSort] = useState("title");

  // Provenance states
  const [isProvenanceFormOpen, setIsProvenanceFormOpen] = useState(false);
  const [editingProvenance, setEditingProvenance] = useState(null);

  // Exhibition states
  const [isExhibitionFormOpen, setIsExhibitionFormOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);
  const [exhibitionTypeFilter, setExhibitionTypeFilter] = useState("All");
  const [exhibitionStatusFilter, setExhibitionStatusFilter] = useState("All");
  const [exhibitionGalleryFilter, setExhibitionGalleryFilter] = useState("All");
  const [exhibitionSort, setExhibitionSort] = useState("title");

  // Gallery states
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  const [galleryBuildingFilter, setGalleryBuildingFilter] = useState("All");
  const [galleryClimateFilter, setGalleryClimateFilter] = useState("All");
  const [galleryFloorFilter, setGalleryFloorFilter] = useState("All");
  const [gallerySort, setGallerySort] = useState("name");

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
    { id: "artists", name: "Artists" },
    { id: "artwork", name: "Artwork" },
    { id: "provenance", name: "Provenance" },
    { id: "exhibitions", name: "Exhibitions" },
    { id: "galleries", name: "Galleries" },
    { id: "events", name: "Events" },
    { id: "cafe", name: "Cafe" },
    { id: "giftshop", name: "Gift Shop" },
    { id: "reports", name: "Reports" },
    { id: "users", name: "Users" },
    { id: "departments", name: "Departments" },
  ];

  useEffect(() => {
    loadArtists();
    loadArtworks();
    loadProvenance();
    loadExhibitions();
    loadGalleries();
    loadEvents();
    loadStockAlerts();
  }, []);

  useEffect(() => {
    setShowStockToast(stockAlerts.length > 0);
  }, [stockAlerts]);

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
  const loadStockAlerts = async () => {
    try {
      const [cafeItems, giftShopItems] = await Promise.all([getCafeItems(), getGiftShopItems()]);

      const cafeAlerts = cafeItems
        .filter((item) => Number(item.stock_quantity) <= 20)
        .map((item) => ({ source: "Cafe", name: item.item_name, stock: Number(item.stock_quantity) }));

      const giftShopAlerts = giftShopItems
        .filter((item) => Number(item.stock_quantity) <= 20)
        .map((item) => ({ source: "Gift Shop", name: item.item_name, stock: Number(item.stock_quantity) }));

      const alerts = [...cafeAlerts, ...giftShopAlerts].sort((a, b) => a.stock - b.stock);
      setStockAlerts(alerts);
    } catch (err) {
      console.error("Stock alert load error:", err);
    }
  };

  const handleExhibitionArchive = async (id) => {
    if (!window.confirm("Archive this exhibition? It can be restored later.")) return;
    try {
      await fetch(`${API_BASE}/exhibitions/${id}/deactivate`, { method: "PATCH" });
      await loadExhibitions();
    } catch (err) { console.error(err); alert("Failed to archive exhibition"); }
  };

  const handleGalleryArchive = async (id) => {
    if (!window.confirm("Archive this gallery? It can be restored later.")) return;
    try {
      await fetch(`${API_BASE}/galleries/${id}/deactivate`, { method: "PATCH" });
      await loadGalleries();
    } catch (err) { console.error(err); alert("Failed to archive gallery"); }
  };

  const handleArtworkArchive = async (id) => {
    if (!window.confirm("Archive this artwork? It can be restored later.")) return;
    try {
      await fetch(`${API_BASE}/artwork/${id}/deactivate`, { method: "PATCH" });
      await loadArtworks();
    } catch (err) { alert("Failed to archive artwork"); }
  };

  const handleEventArchive = async (id) => {
    if (!window.confirm("Archive this event? It can be restored later.")) return;
    try {
      await fetch(`${API_BASE}/events/${id}/deactivate`, { method: "PATCH" });
      await loadEvents();
    } catch (err) { alert("Failed to archive event"); }
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
  const handleDeaccessionArtwork = async (id) => {
    if (window.confirm(
      "⚠️ DEACCESSION CONFIRMATION\n\n" +
      "This artwork will be marked as Deaccessioned and removed from public view.\n" +
      "This action can be reversed by restoring the artwork.\n\n" +
      "Continue?"
    )) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/artwork/${id}/deaccession`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to deaccession artwork");
        await loadArtworks();
        alert("Artwork has been deaccessioned.");
      } catch (err) {
        console.error("Error deaccessioning artwork:", err);
        alert("Failed to deaccession artwork");
      }
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
    } catch (err) { alert("Failed to save exhibition"); }
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
    if (window.confirm("Archive this event? It can be restored later.")) {
      try { await deleteEvent(id); await loadEvents(); }
      catch (err) { console.error(err); alert("Failed to archive event"); }
    }
  };

  const handleAdd = () => {
    switch (activeTab) {
      case "artists": return handleAddArtist();
      case "artwork": return handleAddArtwork();
      case "provenance": return handleAddProvenance();
      case "exhibitions": return handleAddExhibition();
      case "galleries": return handleAddGallery();
      case "events": return handleAddEvent();
      case "users": return userMgmtRef.current?.openAdd();
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
    if (tabId !== "galleries")   setShowGalleryArchive(false);
    if (tabId !== "artwork")     setShowArtworkArchive(false);
    if (tabId !== "events")      setShowEventArchive(false);
  };

  // Filtered data
  const filteredArtists = artists.filter((a) =>
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const artworkArtists = [...new Set(artworks.map(a => a.artist_name).filter(Boolean))].sort();
  const artworkMediums = [...new Set(artworks.map(a => a.medium).filter(Boolean))].sort();

  const filteredArtworks = artworks
    .filter((a) => {
      const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.medium?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArtist = artworkArtistFilter === "All" || a.artist_name === artworkArtistFilter;
      const matchesMedium = artworkMediumFilter === "All" || a.medium === artworkMediumFilter;
      const matchesStatus = artworkStatusFilter === "All" || a.current_display_status === artworkStatusFilter;
      return matchesSearch && matchesArtist && matchesMedium && matchesStatus;
    })
    .sort((a, b) => {
      switch (artworkSort) {
        case "title": return (a.title || "").localeCompare(b.title || "");
        case "title_desc": return (b.title || "").localeCompare(a.title || "");
        case "year_asc": return (a.creation_year ?? 0) - (b.creation_year ?? 0);
        case "year_desc": return (b.creation_year ?? 0) - (a.creation_year ?? 0);
        default: return 0;
      }
    });

  const filteredProvenance = provenance.filter((r) =>
    r.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.acquisition_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExhibitionStatus = (start, end) => {
    const now = new Date();
    if (now < new Date(start)) return "Upcoming";
    if (now > new Date(end)) return "Ended";
    return "Active";
  };

  const exhibitionGalleries = [...new Set(exhibitions.map(e => e.gallery_name).filter(Boolean))].sort();

  const filteredExhibitions = exhibitions
    .filter((e) => {
      const matchesSearch =
        e.exhibition_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.exhibition_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = exhibitionTypeFilter === "All" || e.exhibition_type === exhibitionTypeFilter;
      const matchesStatus = exhibitionStatusFilter === "All" || getExhibitionStatus(e.start_date, e.end_date) === exhibitionStatusFilter;
      const matchesGallery = exhibitionGalleryFilter === "All" || e.gallery_name === exhibitionGalleryFilter;
      return matchesSearch && matchesType && matchesStatus && matchesGallery;
    })
    .sort((a, b) => {
      switch (exhibitionSort) {
        case "title": return (a.exhibition_name || "").localeCompare(b.exhibition_name || "");
        case "title_desc": return (b.exhibition_name || "").localeCompare(a.exhibition_name || "");
        case "date_asc": return new Date(a.start_date) - new Date(b.start_date);
        case "date_desc": return new Date(b.start_date) - new Date(a.start_date);
        default: return 0;
      }
    });

  const galleryBuildings = [...new Set(galleries.map(g => g.building_name).filter(Boolean))].sort();
  const galleryFloors = [...new Set(galleries.map(g => g.floor_number).filter(v => v !== null && v !== undefined))].sort((a, b) => a - b);

  const filteredGalleries = galleries
    .filter((g) => {
      const matchesSearch = g.gallery_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.building_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBuilding = galleryBuildingFilter === "All" || g.building_name === galleryBuildingFilter;
      const matchesClimate = galleryClimateFilter === "All" ||
        (galleryClimateFilter === "Yes" ? g.climate_controlled : !g.climate_controlled);
      const matchesFloor = galleryFloorFilter === "All" || String(g.floor_number) === galleryFloorFilter;
      return matchesSearch && matchesBuilding && matchesClimate && matchesFloor;
    })
    .sort((a, b) => {
      switch (gallerySort) {
        case "name": return (a.gallery_name || "").localeCompare(b.gallery_name || "");
        case "name_desc": return (b.gallery_name || "").localeCompare(a.gallery_name || "");
        case "floor_asc": return (a.floor_number ?? 0) - (b.floor_number ?? 0);
        case "floor_desc": return (b.floor_number ?? 0) - (a.floor_number ?? 0);
        case "sqft_desc": return (b.square_footage ?? 0) - (a.square_footage ?? 0);
        default: return 0;
      }
    });

  const filteredEvents = events.filter((e) =>
    e.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usesCustomManager = activeTab === "cafe" || activeTab === "giftshop";

  const getAddLabel = () => {
    switch (activeTab) {
      case "artists": return "Artist";
      case "artwork": return "Artwork";
      case "provenance": return "Provenance Record";
      case "exhibitions": return "Exhibition";
      case "galleries": return "Gallery";
      case "events": return "Event";
      case "users": return userMgmtSubTab.slice(0, -1);
      case "departments": return "Department";
      default: return "";
    }
  };

  return (
    <>
      {showStockToast && stockAlerts.length > 0 && (
        <div className="dashboard-stock-toast">
          <div className="dashboard-stock-toast-content">
            <div className="dashboard-stock-toast-title">
              Inventory alerts
            </div>
            <div className="dashboard-stock-toast-list">
              {stockAlerts.map((alert) => (
                <div key={`${alert.source}-${alert.name}`} className="dashboard-stock-toast-item">
                  <strong>{alert.name}</strong> in <strong>{alert.source}</strong> is at <strong>{alert.stock}</strong>.
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setShowStockToast(false)}>Dismiss</button>
        </div>
      )}

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
              {activeTab === "artists" && " - Add, edit, or remove artists"}
              {activeTab === "artwork" && " - Add, edit, or remove artworks and link them to artists"}
              {activeTab === "provenance" && " - Track ownership history of artworks"}
              {activeTab === "exhibitions" && " - Manage exhibitions and their associated artworks"}
              {activeTab === "galleries" && " - Manage gallery spaces and their climate settings"}
              {activeTab === "events" && " - Add, edit, or remove museum events"}
              {activeTab === "cafe" && " - Manage cafe items, transactions, and line items"}
              {activeTab === "giftshop" && " - Manage gift shop items, transactions, and line items"}
              {activeTab === "departments" && " - Manage museum departments and budgets"}
            </p>
          </div>
          {!usesCustomManager && activeTab !== "reports" && (
            <button className="add-btn" onClick={handleAdd}>
              + Add New {getAddLabel()}
            </button>
          )}
        </header>

        {/* Exhibitions filter bar */}
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
                }}>Clear Filters</button>
              )}
            </div>
            <div className="exhibitions-admin-toolbar">
              <p className="ex-results-count">
                {filteredExhibitions.length} exhibition{filteredExhibitions.length !== 1 ? "s" : ""}
              </p>
              <button className="btn-view-archived" onClick={() => setShowExhibitionArchive((v) => !v)}>
                {showExhibitionArchive ? "Hide Archived" : "View Archived Exhibitions"}
              </button>
            </div>
          </>
        )}

        {/* Galleries filter bar */}
        {activeTab === "galleries" && (
          <>
            <div className="exhibition-filters-bar">
              <div className="ex-filter-group">
                <label>Building</label>
                <select value={galleryBuildingFilter} onChange={(e) => setGalleryBuildingFilter(e.target.value)}>
                  <option value="All">All Buildings</option>
                  {galleryBuildings.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Floor</label>
                <select value={galleryFloorFilter} onChange={(e) => setGalleryFloorFilter(e.target.value)}>
                  <option value="All">All Floors</option>
                  {galleryFloors.map((f) => (
                    <option key={f} value={String(f)}>
                      {f === 0 ? "Ground" : f < 0 ? `Basement ${Math.abs(f)}` : `Floor ${f}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Climate Controlled</label>
                <select value={galleryClimateFilter} onChange={(e) => setGalleryClimateFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Sort By</label>
                <select value={gallerySort} onChange={(e) => setGallerySort(e.target.value)}>
                  <option value="name">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="floor_asc">Floor (Low–High)</option>
                  <option value="floor_desc">Floor (High–Low)</option>
                  <option value="sqft_desc">Largest First</option>
                </select>
              </div>
              {(galleryBuildingFilter !== "All" || galleryClimateFilter !== "All" || galleryFloorFilter !== "All" || gallerySort !== "name") && (
                <button className="ex-filter-clear" onClick={() => {
                  setGalleryBuildingFilter("All");
                  setGalleryClimateFilter("All");
                  setGalleryFloorFilter("All");
                  setGallerySort("name");
                }}>Clear Filters</button>
              )}
            </div>
            <div className="exhibitions-admin-toolbar">
              <p className="ex-results-count">
                {filteredGalleries.length} galler{filteredGalleries.length !== 1 ? "ies" : "y"}
              </p>
              <button className="btn-view-archived" onClick={() => setShowGalleryArchive((v) => !v)}>
                {showGalleryArchive ? "Hide Archived" : "View Archived Galleries"}
              </button>
            </div>
          </>
        )}

        {/* Artwork filter bar */}
        {activeTab === "artwork" && (
          <>
            <div className="exhibition-filters-bar">
              <div className="ex-filter-group">
                <label>Artist</label>
                <select value={artworkArtistFilter} onChange={(e) => setArtworkArtistFilter(e.target.value)}>
                  <option value="All">All Artists</option>
                  {artworkArtists.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Medium</label>
                <select value={artworkMediumFilter} onChange={(e) => setArtworkMediumFilter(e.target.value)}>
                  <option value="All">All Mediums</option>
                  {artworkMediums.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Status</label>
                <select value={artworkStatusFilter} onChange={(e) => setArtworkStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="On Display">On Display</option>
                  <option value="In Storage">In Storage</option>
                  <option value="On Loan">On Loan</option>
                  <option value="Under Restoration">Under Restoration</option>
                </select>
              </div>
              <div className="ex-filter-group">
                <label>Sort By</label>
                <select value={artworkSort} onChange={(e) => setArtworkSort(e.target.value)}>
                  <option value="title">Title A–Z</option>
                  <option value="title_desc">Title Z–A</option>
                  <option value="year_asc">Year (Oldest)</option>
                  <option value="year_desc">Year (Newest)</option>
                </select>
              </div>
              {(artworkArtistFilter !== "All" || artworkMediumFilter !== "All" || artworkStatusFilter !== "All" || artworkSort !== "title") && (
                <button className="ex-filter-clear" onClick={() => {
                  setArtworkArtistFilter("All");
                  setArtworkMediumFilter("All");
                  setArtworkStatusFilter("All");
                  setArtworkSort("title");
                }}>Clear Filters</button>
              )}
            </div>
            <div className="exhibitions-admin-toolbar">
              <p className="ex-results-count">{filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? "s" : ""}</p>
              <button className="btn-view-archived" onClick={() => setShowArtworkArchive(v => !v)}>
                {showArtworkArchive ? "Hide Archived" : "View Archived Artworks"}
              </button>
            </div>
          </>
        )}

        {/* Events toolbar */}
        {activeTab === "events" && (
          <div className="exhibitions-admin-toolbar">
            <p className="ex-results-count">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </p>
            <button className="btn-view-archived" onClick={() => setShowEventArchive(v => !v)}>
              {showEventArchive ? "Hide Archived" : "View Archived Events"}
            </button>
          </div>
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
            <>
              {showArtworkArchive && (
                <Archive type="artwork" onRestored={() => loadArtworks()} />
              )}
              {artworksError
                ? <div className="error-message">{artworksError}</div>
                : <ArtworkTable
                    artworks={filteredArtworks}
                    onEdit={handleEditArtwork}
                    onDelete={handleDeleteArtwork}
                    onArchive={handleArtworkArchive}
                    onDeaccession={handleDeaccessionArtwork}
                  />
              }
            </>
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
                <Archive type="exhibitions" onRestored={() => loadExhibitions()} reloadTrigger={exhibitions.length}/>
              )}
              {exhibitionsError
                ? <div className="error-message">{exhibitionsError}</div>
                : <ExhibitionTable
                    exhibitions={filteredExhibitions}
                    onEdit={handleEditExhibition}
                    onDelete={handleDeleteExhibition}
                    onArchive={handleExhibitionArchive}
                  />
              }
            </>
          )}

          {/* Galleries */}
          {activeTab === "galleries" && (
            <>
              {showGalleryArchive && (
                <Archive type="galleries" onRestored={() => loadGalleries()} reloadTrigger={galleries.length}/>
              )}
              {galleriesError
                ? <div className="error-message">{galleriesError}</div>
                : <GalleryTable
                    galleries={filteredGalleries}
                    onEdit={handleEditGallery}
                    onDelete={handleDeleteGallery}
                    onArchive={handleGalleryArchive}
                  />
              }
            </>
          )}

          {/* Events */}
          {activeTab === "events" && (
            <>
              {showEventArchive && (
                <Archive type="events" onRestored={() => loadEvents()} reloadTrigger={events.length}/>
              )}
              {eventsError
                ? <div className="error-message">{eventsError}</div>
                : <EventTable
                    events={filteredEvents}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onArchive={handleEventArchive}
                  />
              }
            </>
          )}

          {activeTab === "cafe" && <CafeAdminPanel />}
          {activeTab === "giftshop" && <GiftShopAdminPanel />}
          {activeTab === "reports" && <ReportsPanel />}
          {activeTab === "users" && <UserManagement ref={userMgmtRef} searchTerm={searchTerm} onSubTabChange={setUserMgmtSubTab} />}
          {activeTab === "departments" && <DepartmentManagement ref={deptMgmtRef} searchTerm={searchTerm} />}
        </div>
      </main>

      {/* Modals */}
      {isArtistFormOpen && <ArtistForm onSubmit={handleSaveArtist} initialData={editingArtist} onCancel={() => setIsArtistFormOpen(false)} />}
      {isArtworkFormOpen && <ArtworkForm onSubmit={handleSaveArtwork} initialData={editingArtwork} onCancel={() => setIsArtworkFormOpen(false)} />}
      {isProvenanceFormOpen && <ProvenanceForm onSubmit={handleSaveProvenance} initialData={editingProvenance} onCancel={() => setIsProvenanceFormOpen(false)} />}
      {isExhibitionFormOpen && <ExhibitionForm onSubmit={handleSaveExhibition} initialData={editingExhibition} onCancel={() => setIsExhibitionFormOpen(false)} />}
      {isGalleryFormOpen && <GalleryForm onSubmit={handleSaveGallery} initialData={editingGallery} onCancel={() => setIsGalleryFormOpen(false)} />}
      {isEventFormOpen && <EventForm onSubmit={handleSaveEvent} initialData={editingEvent} onCancel={() => setIsEventFormOpen(false)} />}
      </div>
    </>
  );
}