// components/GalleryArchive.jsx
import { useEffect, useState } from "react";
import "../styles/ExhibitionArchive.css";

export default function GalleryArchive({ apiBase, onRestored }) {
  const [archived, setArchived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/galleries/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived galleries");
      const data = await res.json();
      setArchived(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this gallery? It will become active again.")) return;
    try {
      const res = await fetch(`${apiBase}/galleries/${id}/reactivate`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      setArchived((prev) => prev.filter((g) => g.gallery_id !== id));
      onRestored();
    } catch (err) {
      alert("Failed to restore gallery: " + err.message);
    }
  };

  const getOrdinalFloor = (floor) => {
    if (floor === null || floor === undefined || floor === "") return "—";
    const n = parseInt(floor);
    if (n === 0) return "Ground";
    if (n < 0) return `Basement ${Math.abs(n)}`;
    const suffix = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  return (
    <div className="archived-exhibitions-panel">
      <div className="archived-panel-header">
        <h3 className="archived-panel-title">🗄 Archived Galleries</h3>
        <span className="archived-panel-count">{archived.length} archived</span>
      </div>

      {loading && <p className="archived-state-msg">Loading…</p>}
      {error   && <p className="archived-state-msg archived-error">{error}</p>}

      {!loading && !error && archived.length === 0 && (
        <p className="archived-state-msg">No archived galleries.</p>
      )}

      {!loading && !error && archived.length > 0 && (
        <div className="archived-table-wrap">
          <table className="archived-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Gallery Name</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Climate Controlled</th>
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((g) => (
                <tr key={g.gallery_id}>
                  <td>{g.gallery_id}</td>
                  <td className="archived-title">{g.gallery_name}</td>
                  <td>{g.building_name || "—"}</td>
                  <td>{getOrdinalFloor(g.floor_number)}</td>
                  <td>{g.climate_controlled ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn-restore" onClick={() => handleRestore(g.gallery_id)}>
                      ↩ Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}