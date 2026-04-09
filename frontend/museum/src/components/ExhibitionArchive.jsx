// components/ArchivedExhibitions.jsx
import { useEffect, useState } from "react";
import "../styles/ExhibitionArchive.css";

export default function ArchivedExhibitions({ apiBase, onRestored }) {
  const [archived, setArchived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/exhibitions/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived exhibitions");
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
    if (!window.confirm("Restore this exhibition? It will become visible on the public site.")) return;
    try {
      const res = await fetch(`${apiBase}/exhibitions/${id}/reactivate`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      setArchived((prev) => prev.filter((e) => e.exhibition_id !== id));
      onRestored();
    } catch (err) {
      alert("Failed to restore exhibition: " + err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (d.getFullYear() >= 2099) return "Ongoing";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="archived-exhibitions-panel">
      <div className="archived-panel-header">
        <h3 className="archived-panel-title">Archived Exhibitions</h3>
        <span className="archived-panel-count">
          {archived.length} archived
        </span>
      </div>

      {loading && <p className="archived-state-msg">Loading…</p>}
      {error   && <p className="archived-state-msg archived-error">{error}</p>}

      {!loading && !error && archived.length === 0 && (
        <p className="archived-state-msg">No archived exhibitions.</p>
      )}

      {!loading && !error && archived.length > 0 && (
        <div className="archived-table-wrap">
          <table className="archived-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Gallery</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((e) => (
                <tr key={e.exhibition_id}>
                  <td>{e.exhibition_id}</td>
                  <td className="archived-title">{e.exhibition_name}</td>
                  <td>{e.gallery_name || "—"}</td>
                  <td>{e.exhibition_type || "—"}</td>
                  <td>{formatDate(e.start_date)}</td>
                  <td>{formatDate(e.end_date)}</td>
                  <td>
                    <button
                      className="btn-restore"
                      onClick={() => handleRestore(e.exhibition_id)}
                    >
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