import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getGiftShopItems, getMyMemberRecord } from "../services/api";
import { readGiftShopCart, writeGiftShopCart } from "../utils/giftShopCart";
import { calculateDiscountedAmount, formatMoney, getGiftShopDiscountPercent } from "../utils/shopDiscounts";
import "../styles/GiftShopPage.css";

function SignInPrompt({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shop-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign In Required</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="shop-auth-body">
          <p>Please sign in to add items to your cart and complete your purchase.</p>
          <div className="shop-auth-actions">
            <Link to="/login" className="auth-btn auth-btn-primary">Sign In</Link>
            <Link to="/login" className="auth-btn auth-btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftShopPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [cartCount, setCartCount] = useState(() =>
    readGiftShopCart().reduce((sum, item) => sum + item.quantity, 0)
  );
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [cartToast, setCartToast] = useState("");
  const [memberDiscountPercent, setMemberDiscountPercent] = useState(0);
  const [memberLevel, setMemberLevel] = useState("");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function loadMemberDiscount() {
      try {
        const member = await getMyMemberRecord();
        const level = member?.membership_level || "";
        setMemberLevel(level);
        setMemberDiscountPercent(getGiftShopDiscountPercent(level));
      } catch {
        setMemberLevel("");
        setMemberDiscountPercent(0);
      }
    }

    loadMemberDiscount();
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

    const currentCart = readGiftShopCart();
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

    writeGiftShopCart(nextCart);
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
    <div className="giftshop-page">
      <section className="giftshop-hero">
        <div className="giftshop-hero-copy">
          <h1>The MFA Gift Shop</h1>
          <h2 className="giftshop-subtitle">Artful Gifts, Prints, Books, & More</h2>
          <h1></h1>
          <p>
            Find the perfect keepsake for yourself or a loved one. Our curated selection features exclusive museum merchandise, art-inspired gifts, and treasures you won't find anywhere else.
          </p>
        </div>

        <div className="giftshop-info-card">
          <h2>Shop Details</h2>
          <p><strong>Hours:</strong> During regular museum hours</p>
          <p><strong>Location:</strong> Beck Building street level</p>
          <p><strong>Phone:</strong> 713.639.7360</p>
          <p>
            <strong>Member Benefit:</strong>{" "}
            {memberDiscountPercent > 0
              ? `${memberLevel} discount applied online (${memberDiscountPercent}% off)`
              : "Member discounts available"}
          </p>
          <Link to="/gift-shop/cart" className="btn btn-primary giftshop-cart-link">
            View Cart ({cartCount})
          </Link>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="giftshop-filters-section">
        <div className="giftshop-search-bar">
          <input
            type="text"
            placeholder="Search gifts, books, prints, and more..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="giftshop-search-input"
          />
        </div>

        <div className="giftshop-filters-grid">
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
              <span>Show in-stock only</span>
            </label>
          </div>

          <button
            className={`clear-filters-btn${hasActiveFilters ? "" : " is-hidden"}`}
            onClick={clearFilters}
            type="button"
            disabled={!hasActiveFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="giftshop-results-count">
        {filteredAndSortedItems.length} product{filteredAndSortedItems.length !== 1 ? "s" : ""} found
      </div>

      {/* Loading/Error/Empty States */}
      {loading ? (
        <div className="giftshop-loading">Loading gift shop items...</div>
      ) : error ? (
        <div className="giftshop-message error">{error}</div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="giftshop-empty">
          <p>No products match your filters.</p>
          <button className="reset-btn" onClick={clearFilters}>Reset Filters</button>
        </div>
      ) : (
        <div className="giftshop-grid">
          {filteredAndSortedItems.map((item) => (
            <article className="giftshop-card" key={item.item_id}>
              <div className="giftshop-card-art">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="giftshop-card-image"
                  />
                ) : (
                  <span>{item.category?.slice(0, 1) || "M"}</span>
                )}
              </div>
              <div className="giftshop-card-body">
                <p className="giftshop-category">{item.category}</p>
                <h3>{item.item_name}</h3>
                {memberDiscountPercent > 0 ? (
                  <div className="giftshop-price-block">
                    <p className="giftshop-price giftshop-price-original">{formatMoney(item.price)}</p>
                    <p className="giftshop-price">{formatMoney(calculateDiscountedAmount(item.price, memberDiscountPercent))}</p>
                    <p className="giftshop-member-discount">{memberDiscountPercent}% member discount</p>
                  </div>
                ) : (
                  <p className="giftshop-price">{formatMoney(item.price)}</p>
                )}
                <p className="giftshop-stock">
                  {Number(item.stock_quantity) > 0
                    ? `${item.stock_quantity} available`
                    : "Currently unavailable"}
                </p>
                <div className="giftshop-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={Number(item.stock_quantity) <= 0}
                    onClick={() => handleAddToCart(item)}
                  >
                    {Number(item.stock_quantity) > 0 ? "Add to Cart" : "Sold Out"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAuthPrompt && <SignInPrompt onClose={() => setShowAuthPrompt(false)} />}
      {cartToast && <div className="giftshop-toast">{cartToast}</div>}
    </div>
  );
}
