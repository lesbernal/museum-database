// components/GalleryTable.jsx
import "../styles/GalleryTable.css";

export default function GalleryTable({ galleries, onEdit, onDelete, onArchive }) {
  const formatSquareFootage = (sqft) => {
    if (!sqft) return "—";
    return Number(sqft).toLocaleString() + " sq ft";
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

  if (galleries.length === 0) {
    return <div className="empty-state">No galleries found</div>;
  }

  return (
    <div className="gallery-table-container">
      <table className="gallery-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Gallery Name</th>
            <th>Building</th>
            <th>Floor</th>
            <th>Square Footage</th>
            <th>Climate Control</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {galleries.map((gallery) => (
            <tr key={gallery.gallery_id}>
              <td>{gallery.gallery_id}</td>
              <td className="title-cell">{gallery.gallery_name}</td>
              <td>{gallery.building_name || "—"}</td>
              <td>{getOrdinalFloor(gallery.floor_number)}</td>
              <td>{formatSquareFootage(gallery.square_footage)}</td>
              <td>
                <span className={`status-badge ${gallery.climate_controlled ? "badge-standard" : "badge-none"}`}>
                  {gallery.climate_controlled ? "Yes" : "No"}
                </span>
              </td>
              <td className="actions">
                <button className="edit-btn" onClick={() => onEdit(gallery)} title="Edit">Edit</button>
                <button className="archive-btn" onClick={() => onArchive(gallery.gallery_id)} title="Archive">Archive</button>
                <button className="delete-btn" onClick={() => onDelete(gallery.gallery_id)} title="Permanently delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}