import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ArtistManager from "./ArtistManager";
import ArtworkManager from "./ArtworkManager";
import Archive from "./Archive";
import ProvenanceManager from "./ProvenanceManager";
import ExhibitionManager from "./ExhibitionManager";
import GalleryManager from "./GalleryManager";
import EventManager from "./EventManager";
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
  getCafeItems, getGiftShopItems, getMyProfile, updateMyProfile, changeMyPassword,
} from "../services/api";

import "../styles/AdminDashboard.css";
import "../styles/UserManagement.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ArchiveReasonModal({ type, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="um-overlay" onClick={onCancel}>
      <div className="um-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Archive {type.slice(0, -1)}</h3>
          <button className="um-modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="um-modal-body">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 1.6 }}>
            This item will be hidden from public view but can be restored later.
          </p>
          <div className="um-form-group full">
            <label>Reason for archiving <span style={{ color: "#9ca3af" }}>(optional)</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. On loan to another museum, under restoration, traveling exhibition..."
              style={{
                width: "100%", padding: "0.5rem 0.75rem",
                fontSize: 13, border: "1px solid #e5e7eb",
                resize: "vertical", fontFamily: "inherit",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="um-save-btn" onClick={() => onConfirm(reason)}>Archive</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("artists");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExhibitionArchive, setShowExhibitionArchive] = useState(false);
  const [showGalleryArchive, setShowGalleryArchive] = useState(false);
  const [showArtworkArchive, setShowArtworkArchive] = useState(false);
  const [showEventArchive, setShowEventArchive] = useState(false);
  const [endedEvents, setEndedEvents] = useState([]);
  const [showEndedExhibitions, setShowEndedExhibitions] = useState(true);
  const [showEndedEvents, setShowEndedEvents] = useState(true);
  const [archiveModal, setArchiveModal] = useState(null);

  // Admin profile states
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminForm, setAdminForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: "", confirm_password: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Data
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [provenance, setProvenance] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [events, setEvents] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showStockToast, setShowStockToast] = useState(false);

  // Artwork states
  const [artworkArtistFilter, setArtworkArtistFilter] = useState("All");
  const [artworkMediumFilter, setArtworkMediumFilter] = useState("All");
  const [artworkStatusFilter, setArtworkStatusFilter] = useState("All");
  const [artworkSort, setArtworkSort] = useState("title");

  // Exhibition states
  const [exhibitionTypeFilter, setExhibitionTypeFilter] = useState("All");
  const [exhibitionStatusFilter, setExhibitionStatusFilter] = useState("All");
  const [exhibitionGalleryFilter, setExhibitionGalleryFilter] = useState("All");
  const [exhibitionSort, setExhibitionSort] = useState("title");
  const [endedExhibitions, setEndedExhibitions] = useState([]);

  // Gallery states
  const [galleryBuildingFilter, setGalleryBuildingFilter] = useState("All");
  const [galleryClimateFilter, setGalleryClimateFilter] = useState("All");
  const [galleryFloorFilter, setGalleryFloorFilter] = useState("All");
  const [gallerySort, setGallerySort] = useState("name");

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
    const savedTab = localStorage.getItem("adminActiveTab");
    if (savedTab && tabs.some(tab => tab.id === savedTab)) {
      setActiveTab(savedTab);
    }
    loadArtists();
    loadArtworks();
    loadProvenance();
    loadExhibitions();
    loadGalleries();
    loadEvents();
    loadStockAlerts();
    loadAdminProfile();
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

  const loadAdminProfile = async () => {
    try {
      const profile = await getMyProfile();
      setAdminProfile(profile);
      setAdminForm(profile);
    } catch (err) {
      console.error("Failed to load admin profile:", err);
    }
  };

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
    try {
      const data = await getExhibitions();
      setExhibitions(data);
      setExhibitionsError("");
      const now = new Date();
      const ended = data.filter(e => e.is_active && new Date(e.end_date) < now);
      setEndedExhibitions(ended);
    } catch (err) { setExhibitionsError("Failed to load exhibitions"); console.error(err); }
  };
  const loadGalleries = async () => {
    try { const data = await getGalleries(); setGalleries(data); setGalleriesError(""); }
    catch (err) { setGalleriesError("Failed to load galleries"); console.error(err); }
  };
  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      setEventsError("");
      const now = new Date();
      const ended = data.filter(e => new Date(e.event_date) < now);
      setEndedEvents(ended);
    } catch (err) { setEventsError("Failed to load events"); console.error(err); }
  };
  const loadStockAlerts = async () => {
    try {
      const [cafeItems, giftShopItems] = await Promise.all([getCafeItems(), getGiftShopItems()]);
      const cafeAlerts = cafeItems
        .filter((item) => Number(item.low_stock_alert) === 1)
        .map((item) => ({ source: "Cafe", name: item.item_name, stock: Number(item.stock_quantity) }));
      const giftShopAlerts = giftShopItems
        .filter((item) => Number(item.low_stock_alert) === 1)
        .map((item) => ({ source: "Gift Shop", name: item.item_name, stock: Number(item.stock_quantity) }));
      const alerts = [...cafeAlerts, ...giftShopAlerts].sort((a, b) => a.stock - b.stock);
      setStockAlerts(alerts);
    } catch (err) {
      console.error("Stock alert load error:", err);
    }
  };

  const handleArchiveWithReason = async (type, id, reason) => {
    const endpoints = {
      exhibitions: `/exhibitions/${id}/deactivate`,
      galleries:   `/galleries/${id}/deactivate`,
      artwork:     `/artwork/${id}/deactivate`,
      events:      `/events/${id}/deactivate`,
    };
    const reloaders = {
      exhibitions: loadExhibitions,
      galleries:   loadGalleries,
      artwork:     loadArtworks,
      events:      loadEvents,
    };
    try {
      await fetch(`${API_BASE}${endpoints[type]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await reloaders[type]();
    } catch (err) {
      console.error(err);
      alert(`Failed to archive ${type.slice(0, -1)}`);
    }
  };

  const handleExhibitionArchive = (id) => setArchiveModal({ type: "exhibitions", id });
  const handleGalleryArchive    = (id) => setArchiveModal({ type: "galleries",   id });
  const handleArtworkArchive    = (id) => setArchiveModal({ type: "artwork",     id });
  const handleEventArchive      = (id) => setArchiveModal({ type: "events",      id });

  // Artist handlers
  const handleAddArtist = async (artistData) => {
    await createArtist(artistData);
    await loadArtists();
  };
  const handleUpdateArtist = async (id, artistData) => {
    await updateArtist(id, artistData);
    await loadArtists();
  };
  const handleDeleteArtist = async (id) => {
    if (window.confirm("Delete this artist?")) {
      await deleteArtist(id);
      await loadArtists();
    }
  };

  // Artwork handlers
  const handleAddArtwork = async (artworkData) => {
    await createArtwork(artworkData);
    await loadArtworks();
  };
  const handleUpdateArtwork = async (id, artworkData) => {
    await updateArtwork(id, artworkData);
    await loadArtworks();
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
  const handleAddProvenance = async (provenanceData) => {
    await createProvenance(provenanceData);
    await loadProvenance();
  };
  const handleUpdateProvenance = async (id, provenanceData) => {
    await updateProvenance(id, provenanceData);
    await loadProvenance();
  };
  const handleDeleteProvenance = async (id) => {
    if (window.confirm("Delete this provenance record?")) {
      await deleteProvenance(id);
      await loadProvenance();
    }
  };

  // Exhibition handlers
  const handleAddExhibition = async (exhibitionData) => {
    await createExhibition(exhibitionData);
    await loadExhibitions();
  };
  const handleUpdateExhibition = async (id, exhibitionData) => {
    await updateExhibition(id, exhibitionData);
    await loadExhibitions();
  };
  const handleDeleteExhibition = async (id) => {
    if (window.confirm("Permanently delete this exhibition? This cannot be undone.")) {
      await deleteExhibition(id);
      await loadExhibitions();
    }
  };

  // Gallery handlers
  const handleAddGallery = async (galleryData) => {
    await createGallery(galleryData);
    await loadGalleries();
  };
  const handleUpdateGallery = async (id, galleryData) => {
    await updateGallery(id, galleryData);
    await loadGalleries();
  };
  const handleDeleteGallery = async (id) => {
    if (window.confirm("Delete this gallery? This will also delete its exhibitions and events.")) {
      await deleteGallery(id);
      await loadGalleries();
    }
  };

  // Event handlers
  const handleAddEvent = async (eventData) => {
    await createEvent(eventData);
    await loadEvents();
  };
  const handleUpdateEvent = async (id, eventData) => {
    await updateEvent(id, eventData);
    await loadEvents();
  };
  const handleDeleteEvent = async (id) => {
    if (window.confirm("Delete this event?")) {
      await deleteEvent(id);
      await loadEvents();
    }
  };

  // Admin profile handlers
  const handleAdminProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMyProfile({
        first_name: adminForm.first_name?.trim(),
        last_name: adminForm.last_name?.trim(),
        email: adminForm.email?.trim(),
        phone_number: adminForm.phone_number,
        street_address: adminForm.street_address?.trim(),
        city: adminForm.city?.trim(),
        state: adminForm.state,
        zip_code: adminForm.zip_code?.trim(),
        date_of_birth: adminForm.date_of_birth?.slice(0, 10),
      });
      setAdminProfile({ ...adminProfile, ...adminForm });
      alert("Profile updated successfully");
      setShowProfileModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      setPasswordErrors({ new_password: "Min. 6 characters" });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: "Passwords do not match" });
      return;
    }
    setPasswordErrors({});
    setChangingPassword(true);
    try {
      await changeMyPassword(passwordForm.new_password);
      alert("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordForm({ new_password: "", confirm_password: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setChangingPassword(false);
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
    localStorage.setItem("adminActiveTab", tabId);
    setSearchTerm("");
    setIsMobileMenuOpen(false);
    if (tabId !== "exhibitions") setShowExhibitionArchive(false);
    if (tabId !== "galleries") setShowGalleryArchive(false);
    if (tabId !== "artwork") setShowArtworkArchive(false);
    if (tabId !== "events") setShowEventArchive(false);

    setTimeout(() => {
      const mainContent = document.querySelector('.admin-main');
      if (mainContent) mainContent.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 0);
  };

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

  return (
    <>
      <div className="dashboard-toasts-stack">
        {showStockToast && stockAlerts.length > 0 && (
          <div className="dashboard-stock-toast">
            <div className="dashboard-stock-toast-content">
              <div className="dashboard-stock-toast-title">Inventory Alerts</div>
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

        {showEndedExhibitions && endedExhibitions.length > 0 && (
          <div className="dashboard-stock-toast">
            <div className="dashboard-stock-toast-content">
              <div className="dashboard-stock-toast-title">Exhibitions Have Ended</div>
              <div className="dashboard-stock-toast-list">
                {endedExhibitions.map(e => (
                  <div key={e.exhibition_id} className="dashboard-stock-toast-item">
                    <strong>{e.exhibition_name}</strong> ended on <strong>{new Date(e.end_date).toLocaleDateString()}</strong> — consider archiving it.
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowEndedExhibitions(false)}>Dismiss</button>
          </div>
        )}

        {showEndedEvents && endedEvents.length > 0 && (
          <div className="dashboard-stock-toast">
            <div className="dashboard-stock-toast-content">
              <div className="dashboard-stock-toast-title">Past Events</div>
              <div className="dashboard-stock-toast-list">
                {endedEvents.map(e => (
                  <div key={e.event_id} className="dashboard-stock-toast-item">
                    <strong>{e.event_name}</strong> occurred on <strong>{new Date(e.event_date).toLocaleDateString()}</strong> — consider archiving it.
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowEndedEvents(false)}>Dismiss</button>
          </div>
        )}
      </div>

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

          {adminProfile && (
          <div className="admin-profile-mini">
            <div className="admin-avatar">
              {adminProfile.first_name?.charAt(0)}{adminProfile.last_name?.charAt(0)}
            </div>
            <div className="admin-info">
              <div className="admin-name">{adminProfile.first_name} {adminProfile.last_name}</div>
              <div className="admin-role">System Administrator</div>
            </div>
            <div className="admin-actions">
              <button
                className="admin-profile-btn"
                onClick={() => setShowProfileModal(true)}
                title="Edit Profile"
              >
                ⚙️
              </button>
              <button
                className="admin-password-btn"
                onClick={() => setShowPasswordModal(true)}
                title="Change Password"
              >
                🔑
              </button>
            </div>
          </div>
        )}

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
                    <option value="Deaccessioned">Deaccessioned</option>
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

          <div className="content-area">
            {activeTab === "artists" && (
              <ArtistManager
                artists={artists}
                onAdd={handleAddArtist}
                onUpdate={handleUpdateArtist}
                onDelete={handleDeleteArtist}
                loading={loading}
                error={artistsError}
              />
            )}

            {activeTab === "artwork" && (
              <>
                {showArtworkArchive && (
                  <Archive type="artwork" onRestored={() => loadArtworks()} />
                )}
                <ArtworkManager
                  artworks={filteredArtworks}
                  onAdd={handleAddArtwork}
                  onUpdate={handleUpdateArtwork}
                  onDelete={handleDeleteArtwork}
                  onArchive={handleArtworkArchive}
                  loading={false}
                  error={artworksError}
                />
              </>
            )}

            {activeTab === "provenance" && (
              <ProvenanceManager
                provenance={filteredProvenance}
                onAdd={handleAddProvenance}
                onUpdate={handleUpdateProvenance}
                onDelete={handleDeleteProvenance}
                loading={false}
                error={provenanceError}
              />
            )}

            {activeTab === "exhibitions" && (
              <>
                {showExhibitionArchive && (
                  <Archive type="exhibitions" onRestored={() => loadExhibitions()} />
                )}
                <ExhibitionManager
                  exhibitions={filteredExhibitions}
                  onAdd={handleAddExhibition}
                  onUpdate={handleUpdateExhibition}
                  onDelete={handleDeleteExhibition}
                  onArchive={handleExhibitionArchive}
                  loading={false}
                  error={exhibitionsError}
                />
              </>
            )}

            {activeTab === "galleries" && (
              <>
                {showGalleryArchive && (
                  <Archive type="galleries" onRestored={() => loadGalleries()} />
                )}
                <GalleryManager
                  galleries={filteredGalleries}
                  onAdd={handleAddGallery}
                  onUpdate={handleUpdateGallery}
                  onDelete={handleDeleteGallery}
                  onArchive={handleGalleryArchive}
                  loading={false}
                  error={galleriesError}
                />
              </>
            )}

            {activeTab === "events" && (
              <>
                {showEventArchive && (
                  <Archive type="events" onRestored={() => loadEvents()} />
                )}
                <EventManager
                  events={filteredEvents}
                  onAdd={handleAddEvent}
                  onUpdate={handleUpdateEvent}
                  onDelete={handleDeleteEvent}
                  onArchive={handleEventArchive}
                  loading={false}
                  error={eventsError}
                />
              </>
            )}

            {activeTab === "cafe" && <CafeAdminPanel />}
            {activeTab === "giftshop" && <GiftShopAdminPanel />}
            {activeTab === "reports" && <ReportsPanel />}
            {activeTab === "users" && <UserManagement ref={userMgmtRef} searchTerm={searchTerm} onSubTabChange={setUserMgmtSubTab} />}
            {activeTab === "departments" && <DepartmentManagement ref={deptMgmtRef} searchTerm={searchTerm} />}
          </div>
        </main>

        {/* Admin Profile Edit Modal */}
        {showProfileModal && (
          <div className="um-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="um-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="um-modal-header">
                <h3>Edit Admin Profile</h3>
                <button className="um-modal-close" onClick={() => setShowProfileModal(false)}>×</button>
              </div>
              <form onSubmit={handleAdminProfileUpdate}>
                <div className="um-modal-body">
                  <div className="um-form-grid">
                    <div className="um-form-group"><label>First Name *</label>
                      <input name="first_name" value={adminForm.first_name || ""} onChange={e => setAdminForm(p => ({ ...p, first_name: e.target.value }))} /></div>
                    <div className="um-form-group"><label>Last Name *</label>
                      <input name="last_name" value={adminForm.last_name || ""} onChange={e => setAdminForm(p => ({ ...p, last_name: e.target.value }))} /></div>
                    <div className="um-form-group full"><label>Email *</label>
                      <input name="email" type="email" value={adminForm.email || ""} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="um-form-group"><label>Phone *</label>
                      <input name="phone_number" value={adminForm.phone_number || ""} onChange={e => setAdminForm(p => ({ ...p, phone_number: e.target.value }))} /></div>
                    <div className="um-form-group full"><label>Street Address</label>
                      <input name="street_address" value={adminForm.street_address || ""} onChange={e => setAdminForm(p => ({ ...p, street_address: e.target.value }))} /></div>
                    <div className="um-form-group"><label>City</label>
                      <input name="city" value={adminForm.city || ""} onChange={e => setAdminForm(p => ({ ...p, city: e.target.value }))} /></div>
                    <div className="um-form-group"><label>State</label>
                      <input name="state" value={adminForm.state || ""} onChange={e => setAdminForm(p => ({ ...p, state: e.target.value }))} /></div>
                    <div className="um-form-group"><label>Zip</label>
                      <input name="zip_code" value={adminForm.zip_code || ""} onChange={e => setAdminForm(p => ({ ...p, zip_code: e.target.value }))} /></div>
                    <div className="um-form-group"><label>Date of Birth</label>
                      <input name="date_of_birth" type="date" value={adminForm.date_of_birth?.slice(0, 10) || ""} onChange={e => setAdminForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                  </div>
                </div>
                <div className="um-modal-footer">
                  <button type="button" className="um-cancel-btn" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="um-save-btn" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="um-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="um-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <div className="um-modal-header">
                <h3>Change Password</h3>
                <button className="um-modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <form onSubmit={handleAdminPasswordChange}>
                <div className="um-modal-body">
                  <div className="um-form-group full">
                    <label>New Password (min. 6 characters)</label>
                    <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} />
                    {passwordErrors.new_password && <span style={{ color: "#dc2626", fontSize: 11 }}>{passwordErrors.new_password}</span>}
                  </div>
                  <div className="um-form-group full">
                    <label>Confirm New Password</label>
                    <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} />
                    {passwordErrors.confirm_password && <span style={{ color: "#dc2626", fontSize: 11 }}>{passwordErrors.confirm_password}</span>}
                  </div>
                </div>
                <div className="um-modal-footer">
                  <button type="button" className="um-cancel-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="um-save-btn" disabled={changingPassword}>
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Archive Reason Modal */}
      {archiveModal && (
        <ArchiveReasonModal
          type={archiveModal.type}
          onConfirm={(reason) => {
            handleArchiveWithReason(archiveModal.type, archiveModal.id, reason);
            setArchiveModal(null);
          }}
          onCancel={() => setArchiveModal(null)}
        />
      )}
    </>
  );
}
