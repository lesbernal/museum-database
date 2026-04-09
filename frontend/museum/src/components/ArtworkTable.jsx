// components/ArtworkTable.jsx
import "../styles/ArtworkTable.css";

export default function ArtworkTable({ artworks, onEdit, onDelete, onArchive }) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "On Display":        return "badge-display";
      case "In Storage":        return "badge-storage";
      case "On Loan":           return "badge-loan";
      case "Under Restoration": return "badge-restoration";
      default: return "";
    }
  };

  if (artworks.length === 0) {
    return <div className="empty-state">No artworks found</div>;
  }

  return (
    <div className="artwork-table-container">
      <table className="artwork-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>ID</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Year</th>
            <th>Medium</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {artworks.map(artwork => (
            <tr key={artwork.artwork_id}>
              <td className="image-cell">
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="thumbnail-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "";
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = '<div class="thumbnail-placeholder">🖼️</div>';
                    }}
                  />
                ) : (
                  <div className="thumbnail-placeholder">🖼️</div>
                )}
              </td>
              <td>{artwork.artwork_id}</td>
              <td className="title-cell">{artwork.title}</td>
              <td>{artwork.artist_name || `${artwork.first_name} ${artwork.last_name}`}</td>
              <td>{artwork.creation_year || "—"}</td>
              <td>{artwork.medium || "—"}</td>
              <td>
                <span className={`status-badge ${getStatusBadgeClass(artwork.current_display_status)}`}>
                  {artwork.current_display_status || "Unknown"}
                </span>
              </td>
              <td className="actions">
                <button className="edit-btn"    onClick={() => onEdit(artwork)}              title="Edit">Edit</button>
                <button className="archive-btn" onClick={() => onArchive(artwork.artwork_id)} title="Archive">Archive</button>
                <button className="delete-btn"  onClick={() => onDelete(artwork.artwork_id)}  title="Permanently delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}