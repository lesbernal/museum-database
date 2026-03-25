import "../styles/ArtworkTable.css";

export default function ArtworkTable({ artworks, onEdit, onDelete }) {
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'On Display': return 'badge-display';
      case 'In Storage': return 'badge-storage';
      case 'On Loan': return 'badge-loan';
      case 'Under Restoration': return 'badge-restoration';
      default: return '';
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
                <button className="edit-btn" onClick={() => onEdit(artwork)} title="Edit">✏️</button>
                <button className="delete-btn" onClick={() => onDelete(artwork.artwork_id)} title="Delete">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}