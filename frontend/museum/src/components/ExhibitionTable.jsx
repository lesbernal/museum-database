import "../styles/ExhibitionTable.css";

export default function ExhibitionTable({ exhibitions, onEdit, onDelete }) {
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Permanent":      return "badge-permanent";
      case "Temporary":      return "badge-temporary";
      case "Traveling":      return "badge-traveling";
      case "Retrospective":  return "badge-retrospective";
      case "Group Show":     return "badge-group";
      case "Solo Show":      return "badge-solo";
      case "Thematic":       return "badge-thematic";
      default:               return "";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDateRangeStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return { label: "Upcoming", cls: "date-upcoming" };
    if (now > end)   return { label: "Ended",    cls: "date-ended" };
    return              { label: "Active",    cls: "date-active" };
  };

  if (exhibitions.length === 0) {
    return <div className="empty-state">No exhibitions found</div>;
  }

  return (
    <div className="exhibition-table-container">
      <table className="exhibition-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Gallery</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exhibitions.map((exhibition) => {
            const dateStatus = getDateRangeStatus(exhibition.start_date, exhibition.end_date);
            return (
              <tr key={exhibition.exhibition_id}>
                <td>{exhibition.exhibition_id}</td>
                <td className="title-cell">{exhibition.exhibition_name}</td>
                <td>{exhibition.gallery_name || "—"}</td>
                <td>
                  <span className={`status-badge ${getTypeBadgeClass(exhibition.exhibition_type)}`}>
                    {exhibition.exhibition_type || "Unknown"}
                  </span>
                </td>
                <td>{formatDate(exhibition.start_date)}</td>
                <td>{formatDate(exhibition.end_date)}</td>
                <td>
                  <span className={`date-status ${dateStatus.cls}`}>
                    {dateStatus.label}
                  </span>
                </td>
                <td className="actions">
                  <button className="edit-btn" onClick={() => onEdit(exhibition)} title="Edit">✏️</button>
                  <button className="delete-btn" onClick={() => onDelete(exhibition.exhibition_id)} title="Delete">🗑️</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}