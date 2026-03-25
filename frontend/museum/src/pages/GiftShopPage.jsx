import { useEffect, useMemo, useState } from "react";
import { getGiftShopItems } from "../services/api";
import "../styles/GiftShopPage.css";

export default function GiftShopPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const data = await getGiftShopItems();
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
    <div className="giftshop-page">
      <section className="giftshop-hero">
        <div className="giftshop-hero-copy">
          <p className="giftshop-kicker">The MFA Shop</p>
          <h1>Artful Gifts, Prints, Jewelry, Books, and More</h1>
          <p>
            Inspired by the Museum of Fine Arts, Houston shop experience, this page
            highlights museum merchandise available for in-store pickup.
          </p>
          <div className="giftshop-badges">
            <span>Free to Visit</span>
            <span>Pick Up In Store</span>
            <span>Museum Exclusives</span>
          </div>
        </div>

        <div className="giftshop-info-card">
          <h2>Shop Details</h2>
          <p><strong>Hours:</strong> During regular museum hours</p>
          <p><strong>Location:</strong> Beck Building street level</p>
          <p><strong>Phone:</strong> 713.639.7360</p>
          <p><strong>Member Benefit:</strong> Discounts available in store</p>
        </div>
      </section>

      <section className="giftshop-toolbar">
        <input
          type="text"
          placeholder="Search gifts, books, prints, and more..."
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

      {loading ? (
        <div className="loading-spinner">Loading gift shop items...</div>
      ) : error ? (
        <div className="giftshop-message error">{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="giftshop-message">No products match your filters right now.</div>
      ) : (
        <section className="giftshop-grid">
          {filteredItems.map((item) => (
            <article className="giftshop-card" key={item.item_id}>
              <div className="giftshop-card-art">
                <span>{item.category?.slice(0, 1) || "M"}</span>
              </div>
              <div className="giftshop-card-body">
                <p className="giftshop-category">{item.category}</p>
                <h2>{item.item_name}</h2>
                <p className="giftshop-price">${Number(item.price).toFixed(2)}</p>
                <p className="giftshop-stock">
                  {Number(item.stock_quantity) > 0
                    ? `${item.stock_quantity} available`
                    : "Currently unavailable"}
                </p>
                <div className="giftshop-actions">
                  <button className="btn btn-primary" type="button">
                    Pick Up In Store
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
