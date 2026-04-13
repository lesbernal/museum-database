// components/EventArchive.jsx
import { useEffect, useState } from "react";
import "../styles/ExhibitionArchive.css";

export default function EventArchive({ apiBase, onRestored }) {
  const [archived, setArchived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/events/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived events");
      setArchived(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this event? It will become visible again.")) return;
    try {
      const res = await fetch(`${apiBase}/events/${id}/reactivate`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      setArchived(prev => prev.filter(e => e.event_id !== id));
      onRestored();
    } catch (err) {
      alert("Failed to restore event: " + err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr.toString().slice(0, 10)).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  return (
    <div className="archived-exhibitions-panel">
      <div className="archived-panel-header">
        <h3 className="archived-panel-title">Archived Events</h3>
        <span className="archived-panel-count">{archived.length} archived</span>
      </div>

      {loading && <p className="archived-state-msg">Loading…</p>}
      {error   && <p className="archived-state-msg archived-error">{error}</p>}

      {!loading && !error && archived.length === 0 && (
        <p className="archived-state-msg">No archived events.</p>
      )}

      {!loading && !error && archived.length > 0 && (
        <div className="archived-table-wrap">
          <table className="archived-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Name</th>
                <th>Date</th>
                <th>Capacity</th>
                <th>Attendees</th>
                <th>Members Only</th>
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((e) => (
                <tr key={e.event_id}>
                  <td>{e.event_id}</td>
                  <td className="archived-title">{e.event_name}</td>
                  <td>{formatDate(e.event_date)}</td>
                  <td>{e.capacity}</td>
                  <td>{e.total_attendees}</td>
                  <td>{e.member_only ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn-restore" onClick={() => handleRestore(e.event_id)}>
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