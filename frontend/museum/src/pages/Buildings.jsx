// pages/Buildings.jsx
import { useEffect, useState } from "react";
import { getBuildings } from "../services/api";
import "../styles/Buildings.css";

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBuildings()
      .then((data) => setBuildings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="buildings-loading">Loading buildings...</div>;

  return (
    <div className="buildings-page">
      {/* Hero */}
      <div className="buildings-hero">
        <p className="buildings-eyebrow">Museum of Fine Arts, Houston</p>
        <h1 className="buildings-title">Our Buildings</h1>
        <p className="buildings-subtitle">
          Five iconic structures spanning a century of architectural history
        </p>
      </div>

      {/* Buildings list */}
      <div className="buildings-list">
        {buildings.length === 0 ? (
          <p className="buildings-empty">No buildings found.</p>
        ) : (
          buildings.map((building, i) => (
            <div
              key={building.building_id}
              className={`building-card ${i % 2 === 0 ? "card-left" : "card-right"}`}
            >
              {/* Image side */}
              <div className="building-image-wrap">
                {building.image_url ? (
                  <img
                    src={building.image_url}
                    alt={building.building_name}
                    className="building-image"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div className="building-image-placeholder">
                  <span>🏛️</span>
                </div>
              </div>

              {/* Text side */}
              <div className="building-info">
                <h2 className="building-name">{building.building_name}</h2>
                <p className="building-address">📍 {building.address}</p>
                {building.description && (
                  <p className="building-description">{building.description}</p>
                )}
                <div className="building-meta">
                  {building.square_footage && (
                    <span className="building-stat">
                      <strong>{Number(building.square_footage).toLocaleString()}</strong> sq ft
                    </span>
                  )}
                  {building.visitor_capacity && (
                    <span className="building-stat">
                      <strong>{Number(building.visitor_capacity).toLocaleString()}</strong> visitor capacity
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}