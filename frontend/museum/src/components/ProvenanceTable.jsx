// components/ProvenanceTable.jsx
import "../styles/ProvenanceTable.css";

export default function ProvenanceTable({ provenance, onEdit, onDelete }) {
  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (provenance.length === 0) {
    return <div className="empty-state">No provenance records found</div>;
  }

  return (
    <div className="provenance-table-container">
      <table className="provenance-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Artwork</th>
            <th>Owner</th>
            <th>Acquisition Date</th>
            <th>Method</th>
            <th>Price Paid</th>
            <th>Transfer Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {provenance.map(record => (
            <tr key={record.provenance_id}>
              <td>{record.provenance_id}</td>
              <td className="artwork-cell">{record.artwork_title || `Artwork #${record.artwork_id}`}</td>
              <td>{record.owner_name}</td>
              <td>{record.acquisition_date || "—"}</td>
              <td>
                <span className={`method-badge method-${record.acquisition_method?.toLowerCase()}`}>
                  {record.acquisition_method || "—"}
                </span>
              </td>
              <td>{formatPrice(record.price_paid)}</td>
              <td>{record.transfer_date || "—"}</td>
              <td className="actions">
                <button className="edit-btn" onClick={() => onEdit(record)} title="Edit">✏️</button>
                <button className="delete-btn" onClick={() => onDelete(record.provenance_id)} title="Delete">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}