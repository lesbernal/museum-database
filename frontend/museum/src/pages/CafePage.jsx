import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCafeItems } from "../services/api";
import { readCafeCart, writeCafeCart } from "../utils/cafeCart";
import "../styles/CafePage.css";

function SignInPrompt({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cafe-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign In Required</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="cafe-auth-body">
          <p>Please sign in to add items to your pickup cart.</p>
          <div className="cafe-auth-actions">
            <Link to="/login" className="auth-btn auth-btn-primary">Sign In</Link>
            <Link to="/login" className="auth-btn auth-btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CafePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [cartCount, setCartCount] = useState(() =>
    readCafeCart().reduce((sum, item) => sum + item.quantity, 0)
  );
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [cartToast, setCartToast] = useState("");

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

  useEffect(() => {
    if (!cartToast) return;
    const timeoutId = window.setTimeout(() => setCartToast(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [cartToast]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch =
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesPriceMin = !priceRange.min || Number(item.price) >= Number(priceRange.min);
      const matchesPriceMax = !priceRange.max || Number(item.price) <= Number(priceRange.max);
      const matchesStock = !showInStockOnly || Number(item.stock_quantity) > 0;
      return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax && matchesStock;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.item_name.localeCompare(b.item_name);
        case "name_desc":
          return b.item_name.localeCompare(a.item_name);
        case "price_asc":
          return Number(a.price) - Number(b.price);
        case "price_desc":
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, priceRange, sortBy, showInStockOnly]);

  function handleAddToCart(item) {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }

    const currentCart = readCafeCart();
    const existing = currentCart.find((entry) => entry.item_id === item.item_id);
    let nextCart;

    if (existing) {
      nextCart = currentCart.map((entry) =>
        entry.item_id === item.item_id
          ? {
              ...entry,
              quantity: Math.min(entry.quantity + 1, Number(item.stock_quantity)),
            }
          : entry
      );
    } else {
      nextCart = [
        ...currentCart,
        {
          item_id: item.item_id,
          item_name: item.item_name,
          category: item.category,
          price: Number(item.price),
          stock_quantity: Number(item.stock_quantity),
          quantity: 1,
        },
      ];
    }

    writeCafeCart(nextCart);
    setCartCount(nextCart.reduce((sum, entry) => sum + entry.quantity, 0));
    setCartToast(`${item.item_name} added to cart`);
  }

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
    setSortBy("name");
    setShowInStockOnly(false);
  };

  const hasActiveFilters = searchTerm || selectedCategory || priceRange.min || priceRange.max || sortBy !== "name" || showInStockOnly;

  return (
    <div className="cafe-page">
      {/* Hero Section */}
      <div className="cafe-hero">
        <div className="cafe-hero-content">
          <p className="cafe-eyebrow">Coffee & Light Bites</p>
          <h1 className="cafe-title">Café Leonelli</h1>
          <p className="cafe-subtitle">
            Take a moment to recharge between galleries. Fresh coffee, pastries, and light fare available daily.
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="cafe-info-bar">
        <div className="cafe-info-item">
          <div>
            <strong>Hours</strong>
            <p>During regular museum hours</p>
          </div>
        </div>
        <div className="cafe-info-item">
          <div>
            <strong>Location</strong>
            <p>Main museum level, near the lobby</p>
          </div>
        </div>
        <div className="cafe-info-item">
          <div>
            <strong>Best For</strong>
            <p>Quick coffee, pastries, and light bites</p>
          </div>
        </div>
        <div className="cafe-info-item">
          <Link to="/cafe/cart" className="cafe-cart-btn">
            View Cart ({cartCount})
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="cafe-filters-section">
        <div className="cafe-search-bar">
          <input
            type="text"
            placeholder="Search coffee, pastries, and more..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cafe-search-input"
          />
        </div>

        <div className="cafe-filters-grid">
          <div className="filter-group">
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div className="filter-group price-range">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min $"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max $"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-group stock-filter">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
              />
              <span>Show available only</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="cafe-results-count">
        {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? "s" : ""} on the menu
      </div>

      {/* Loading/Error/Empty States */}
      {loading ? (
        <div className="cafe-loading">Loading our menu...</div>
      ) : error ? (
        <div className="cafe-message error">{error}</div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="cafe-empty">
          <p>No items match your filters.</p>
          <button className="reset-btn" onClick={clearFilters}>Reset Filters</button>
        </div>
      ) : (
        <div className="cafe-grid">
          {filteredAndSortedItems.map((item) => (
            <article className="cafe-card" key={item.item_id}>
              <div className="cafe-card-image-wrapper">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.item_name} className="cafe-card-image" />
                ) : (
                  <div className="cafe-card-placeholder">
                    <span>{item.category === "Coffee" ? "☕" : item.category === "Pastry" ? "🥐" : "🍽️"}</span>
                  </div>
                )}
                {Number(item.stock_quantity) <= 10 && Number(item.stock_quantity) > 0 && (
                  <span className="low-stock-badge">Low Stock</span>
                )}
                {Number(item.stock_quantity) === 0 && (
                  <span className="sold-out-badge">Sold Out</span>
                )}
              </div>
              <div className="cafe-card-body">
                <p className="cafe-category">{item.category}</p>
                <h3>{item.item_name}</h3>
                <p className="cafe-price">${Number(item.price).toFixed(2)}</p>
                <p className="cafe-stock">
                  {Number(item.stock_quantity) > 0 
                    ? "Available today" 
                    : "Temporarily unavailable"}
                </p>
                <button
                  className="cafe-add-btn"
                  type="button"
                  disabled={Number(item.stock_quantity) <= 0}
                  onClick={() => handleAddToCart(item)}
                >
                  {Number(item.stock_quantity) > 0 ? "Add to Cart" : "Sold Out"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAuthPrompt && <SignInPrompt onClose={() => setShowAuthPrompt(false)} />}
      {cartToast && <div className="cafe-toast">{cartToast}</div>}
    </div>
  );
}