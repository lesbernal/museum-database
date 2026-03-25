import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCafeItems } from "../services/api";
import "../styles/CafePage.css";

export default function CafePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const data = await getCafeItems();
        setItems(data);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  return (
    <div className="cafe-page">
      <section className="cafe-hero">
        <div className="cafe-hero-copy">
          <p className="cafe-kicker">Cafe Leonelli</p>
          <h1>Pause Between Galleries</h1>
          <p>
            Browse the current cafe menu inspired by the museum visit experience.
            This page is driven by your live cafe inventory and is designed as a
            menu and visit-planning page rather than an online ordering flow.
          </p>
          <div className="cafe-badges">
            <span>Fresh Coffee</span>
            <span>Pastries & Light Bites</span>
            <span>Available In Person</span>
          </div>
        </div>

        <div className="cafe-info-card">
          <h2>Visit the Cafe</h2>
          <p><strong>Hours:</strong> During regular museum hours</p>
          <p><strong>Location:</strong> Main museum level near the lobby</p>
          <p><strong>Best For:</strong> Quick coffee, pastries, and a midday reset</p>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </section>

      <section className="cafe-toolbar">
        <input
          type="text"
          placeholder="Search coffee, pastries, and cafe items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </section>

      <section className="cafe-section-header">
        <div>
          <p className="cafe-kicker">Current Menu</p>
          <h2>Today at the Museum Cafe</h2>
        </div>
        <p className="cafe-section-note">
          Menu items and availability are pulled directly from the current cafe database.
        </p>
      </section>

      {loading ? (
        <div className="cafe-message">Loading cafe menu...</div>
      ) : error ? (
        <div className="cafe-message cafe-message-error">{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="cafe-message">No cafe items match your search right now.</div>
      ) : (
        <section className="cafe-grid">
          {filteredItems.map((item) => (
            <article className="cafe-card" key={item.item_id}>
              <div className="cafe-card-mark">{item.category?.slice(0, 1) || "C"}</div>
              <div className="cafe-card-body">
                <p className="cafe-category">{item.category}</p>
                <h3>{item.item_name}</h3>
                <p className="cafe-price">${Number(item.price).toFixed(2)}</p>
                <p className="cafe-stock">
                  {Number(item.stock_quantity) > 0
                    ? `Available today`
                    : "Temporarily unavailable"}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
