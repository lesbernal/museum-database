import "../styles/GalleryTable.css";

export default function GalleryTable({ galleries, onEdit, onDelete }) {
    const getClimateControlBadgeClass = (range) => {
        switch (range) {
            case "60-65": return "badge-cold";
            case "65-70": return "badge-cool";
            case "70-75": return "badge-standard";
            case "75-80": return "badge-warm";
            case "none": return "badge-none";
            default: return "";
        }
    };

    const getClimateControlLabel = (range) => {
        switch (range) {
            case "60-65": return "60–65°F";
            case "65-70": return "65–70°F";
            case "70-75": return "70–75°F";
            case "75-80": return "75–80°F";
            case "none": return "Not Controlled";
            default: return range || "—";
        }
    };

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
                                <button className="edit-btn" onClick={() => onEdit(gallery)} title="Edit">✏️</button>
                                <button className="delete-btn" onClick={() => onDelete(gallery.gallery_id)} title="Delete">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}