// components/ArtworkArchive.jsx
import { useEffect, useState } from "react";
import "../styles/ExhibitionArchive.css";

export default function ArtworkArchive({ apiBase, onRestored }) {
  const [archived, setArchived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/artwork/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived artworks");
      setArchived(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this artwork? It will become visible again.")) return;
    try {
      const res = await fetch(`${apiBase}/artwork/${id}/reactivate`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      setArchived(prev => prev.filter(a => a.artwork_id !== id));
      onRestored();
    } catch (err) {
      alert("Failed to restore artwork: " + err.message);
    }
  };

  return (
    <div className="archived-exhibitions-panel">
      <div className="archived-panel-header">
        <h3 className="archived-panel-title">Archived Artworks</h3>
        <span className="archived-panel-count">{archived.length} archived</span>
      </div>

      {loading && <p className="archived-state-msg">Loading…</p>}
      {error   && <p className="archived-state-msg archived-error">{error}</p>}

      {!loading && !error && archived.length === 0 && (
        <p className="archived-state-msg">No archived artworks.</p>
      )}

      {!loading && !error && archived.length > 0 && (
        <div className="archived-table-wrap">
          <table className="archived-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Year</th>
                <th>Medium</th>
                <th>Status</th>
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((a) => (
                <tr key={a.artwork_id}>
                  <td>{a.artwork_id}</td>
                  <td className="archived-title">{a.title}</td>
                  <td>{a.artist_name || "—"}</td>
                  <td>{a.creation_year || "—"}</td>
                  <td>{a.medium || "—"}</td>
                  <td>
                    <span className={`status-badge ${a.current_display_status === 'Deaccessioned' ? 'badge-deaccessioned' : ''}`}>
                      {a.current_display_status || "—"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-restore" onClick={() => handleRestore(a.artwork_id)}>
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