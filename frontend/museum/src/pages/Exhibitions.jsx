// pages/Exhibitions.jsx - PLACEHOLDER
import { useEffect, useState } from "react";
import { getExhibitions } from "../services/api";

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExhibitions()
      .then(data => setExhibitions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading exhibitions...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Exhibitions</h1>
      {exhibitions.length === 0 ? (
        <p>No exhibitions found.</p>
      ) : (
        <ul>
          {exhibitions.map(e => (
            <li key={e.exhibition_id}>
              <strong>{e.exhibition_name}</strong> — {e.exhibition_type}
              <br />
              {e.start_date} to {e.end_date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}