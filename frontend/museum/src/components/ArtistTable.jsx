import "../styles/ArtistTable.css";

export default function ArtistTable({ artists, onEdit, onDelete }) {
  if (artists.length === 0) {
    return <div className="empty-state">No artists found</div>;
  }

  return (
    <div className="artist-table-container">
      <table className="artist-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Nationality</th>
            <th>Born</th>
            <th>Died</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {artists.map(artist => (
            <tr key={artist.artist_id}>
              <td>{artist.artist_id}</td>
              <td>
                <div className="artist-name">
                  <span className="artist-avatar"></span>
                  <span>{artist.first_name} {artist.last_name}</span>
                </div>
              </td>
              <td>{artist.nationality}</td>
              <td>{artist.birth_year || "—"}</td>
              <td>{artist.death_year || "—"}</td>
              <td className="actions">
                <button className="edit-btn" onClick={() => onEdit(artist)} title="Edit">✏️</button>
                <button className="delete-btn" onClick={() => onDelete(artist.artist_id)} title="Delete">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}