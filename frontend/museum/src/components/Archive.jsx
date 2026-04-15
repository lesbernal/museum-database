import { formatToCST } from "../utils/dateUtils";
// components/Archive.jsx
import { useEffect, useState, reloadTrigger} from "react";
import "../styles/ExhibitionArchive.css";

// Configuration for each archive type
const ARCHIVE_CONFIGS = {
  artwork: {
    title: "Archived Artworks",
    endpoint: "/artwork/archived",
    restoreEndpoint: (id) => `/artwork/${id}/reactivate`,
    getId: (item) => item.artwork_id,
    getRowData: (item) => ({
      id: item.artwork_id,
      columns: [
        { label: "Title", value: item.title, className: "archived-title" },
        { label: "Artist", value: item.artist_name || "—" },
        { label: "Year", value: item.creation_year || "—" },
        { label: "Medium", value: item.medium || "—" },
        { 
          label: "Status", 
          value: item.current_display_status || "—",
          badge: item.current_display_status === 'Deaccessioned' ? 'badge-deaccessioned' : null
        }
      ]
    })
  },
  events: {
    title: "Archived Events",
    endpoint: "/events/archived",
    restoreEndpoint: (id) => `/events/${id}/reactivate`,
    getId: (item) => item.event_id,
    formatData: (item) => ({
      ...item,
      formatted_date: item.event_date ? new Date(item.event_date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      }) : "—"
    }),
    getRowData: (item) => ({
      id: item.event_id,
      columns: [
        { label: "Event Name", value: item.event_name, className: "archived-title" },
        { label: "Date", value: item.formatted_date || "—" },
        { label: "Capacity", value: item.capacity || "—" },
        { label: "Attendees", value: item.total_attendees || "—" },
        { label: "Members Only", value: item.member_only ? "Yes" : "No" }
      ]
    })
  },
  exhibitions: {
    title: "Archived Exhibitions",
    endpoint: "/exhibitions/archived",
    restoreEndpoint: (id) => `/exhibitions/${id}/reactivate`,
    getId: (item) => item.exhibition_id,
    formatData: (item) => ({
      ...item,
      formatted_start: item.start_date ? new Date(item.start_date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      }) : "—",
      formatted_end: item.end_date && new Date(item.end_date).getFullYear() < 2099 
        ? new Date(item.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "Ongoing"
    }),
    getRowData: (item) => ({
      id: item.exhibition_id,
      columns: [
        { label: "Title", value: item.exhibition_name, className: "archived-title" },
        { label: "Gallery", value: item.gallery_name || "—" },
        { label: "Type", value: item.exhibition_type || "—" },
        { label: "Start", value: item.formatted_start || "—" },
        { label: "End", value: item.formatted_end || "—" }
      ]
    })
  },
  galleries: {
    title: "Archived Galleries",
    endpoint: "/galleries/archived",
    restoreEndpoint: (id) => `/galleries/${id}/reactivate`,
    getId: (item) => item.gallery_id,
    formatData: (item) => ({
      ...item,
      formatted_floor: (() => {
        const n = parseInt(item.floor_number);
        if (isNaN(n) || n === null) return "—";
        if (n === 0) return "Ground";
        if (n < 0) return `Basement ${Math.abs(n)}`;
        const suffix = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
      })()
    }),
    getRowData: (item) => ({
      id: item.gallery_id,
      columns: [
        { label: "Gallery Name", value: item.gallery_name, className: "archived-title" },
        { label: "Building", value: item.building_name || "—" },
        { label: "Floor", value: item.formatted_floor || "—" },
        { label: "Climate Controlled", value: item.climate_controlled ? "Yes" : "No" }
      ]
    })
  }
};

export default function Archive({ type, onRestored, reloadTrigger }) {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = ARCHIVE_CONFIGS[type];
  
  if (!config) {
    return <div className="archived-state-msg">Invalid archive type: {type}</div>;
  }

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}${config.endpoint}`);
      if (!res.ok) throw new Error(`Failed to fetch archived ${type}`);
      let data = await res.json();
      
      // Apply any formatting if needed
      if (config.formatData) {
        data = data.map(config.formatData);
      }
      
      setArchived(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type, reloadTrigger]);

  const handleRestore = async (id) => {
    const itemName = type.slice(0, -1);
    if (!window.confirm(`Restore this ${itemName}? It will become visible again.`)) return;
    try {
      const res = await fetch(`${API_BASE}${config.restoreEndpoint(id)}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      setArchived(prev => prev.filter(item => config.getId(item) !== id));
      if (onRestored) onRestored();
    } catch (err) {
      alert(`Failed to restore ${itemName}: ` + err.message);
    }
  };

  // Get column headers from the first item
  const firstItem = archived[0];
  const columnConfig = firstItem ? config.getRowData(firstItem).columns : [];

  return (
    <div className="archived-exhibitions-panel">
      <div className="archived-panel-header">
        <h3 className="archived-panel-title">{config.title}</h3>
        <span className="archived-panel-count">{archived.length} archived</span>
      </div>

      {loading && <p className="archived-state-msg">Loading…</p>}
      {error && <p className="archived-state-msg archived-error">{error}</p>}

      {!loading && !error && archived.length === 0 && (
        <p className="archived-state-msg">No archived {type}.</p>
      )}

      {!loading && !error && archived.length > 0 && (
        <div className="archived-table-wrap">
          <table className="archived-table">
            <thead>
              <tr>
                <th>ID</th>
                {columnConfig.map((col, idx) => (
                  <th key={idx}>{col.label}</th>
                ))}
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((item) => {
                const rowData = config.getRowData(item);
                return (
                  <tr key={rowData.id}>
                    <td>{rowData.id}</td>
                    {rowData.columns.map((col, idx) => (
                      <td key={idx} className={col.className || ""}>
                        {col.badge ? (
                          <span className={`status-badge ${col.badge}`}>{col.value}</span>
                        ) : (
                          col.value
                        )}
                      </td>
                    ))}
                    <td>
                      <button className="btn-restore" onClick={() => handleRestore(rowData.id)}>
                        ↩ Restore
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}