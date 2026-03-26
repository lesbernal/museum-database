import { useState, useEffect } from "react";
import "../styles/ReportsPanel.css";

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState("revenue");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Dynamic BASE_URL - works locally and in production
  const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://museum-backend-lck5.onrender.com';

  // ==================== DATA REPORTS ====================
  
  // Report 1: Revenue (Tickets + Donations)
  const loadRevenueReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/revenue-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load revenue report:", err);
    } finally {
      setLoading(false);
    }
  };

  // Report 2: Art Collection (Artists + Artwork + Exhibitions)
  const loadArtCollectionReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/art-collection-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load art collection report:", err);
    } finally {
      setLoading(false);
    }
  };

  // Report 3: Gift Shop Summary
  const loadGiftShopReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/giftshop-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load gift shop report:", err);
    } finally {
      setLoading(false);
    }
  };

  // Report 4: User Summary
  const loadUserReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/user-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load user report:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== DATA QUERIES ====================
  
  const searchByArtist = async (artistName) => {
    if (!artistName) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-artist?name=${encodeURIComponent(artistName)}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const searchByYearRange = async (startYear, endYear) => {
    if (!startYear || !endYear) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-year?start=${startYear}&end=${endYear}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const searchByMedium = async (medium) => {
    if (!medium) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-medium?medium=${encodeURIComponent(medium)}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const searchTopValued = async (limit = 10) => {
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/top-valued-artworks?limit=${limit}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const searchGiftShopLowStock = async () => {
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/giftshop-low-stock`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === "revenue") loadRevenueReport();
    else if (activeReport === "artCollection") loadArtCollectionReport();
    else if (activeReport === "giftShop") loadGiftShopReport();
    else if (activeReport === "users") loadUserReport();
  }, [activeReport]);

  // Helper functions
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // ==================== RENDER FUNCTIONS ====================

  // Render Revenue Report (Tickets + Donations)
  const renderRevenueReport = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <h4>🎟️ Ticket Sales</h4>
        <div className="stats-grid two-columns">
          <div className="stat-card">
            <div className="stat-icon">🎟️</div>
            <div className="stat-value">{formatCurrency(reportData.total_ticket_revenue)}</div>
            <div className="stat-label">Total Ticket Revenue</div>
            <div className="stat-sub">{formatNumber(reportData.total_tickets_sold)} tickets sold</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{formatCurrency(reportData.avg_ticket_price)}</div>
            <div className="stat-label">Average Ticket Price</div>
          </div>
        </div>

        <div className="stats-grid four-columns">
          <div className="stat-card small">
            <div className="stat-label">Adult (19+)</div>
            <div className="stat-value">{formatCurrency(reportData.adult_ticket_revenue)}</div>
            <div className="stat-sub">{formatNumber(reportData.adult_tickets_sold)} sold</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Senior (65+)</div>
            <div className="stat-value">{formatCurrency(reportData.senior_ticket_revenue)}</div>
            <div className="stat-sub">{formatNumber(reportData.senior_tickets_sold)} sold</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Youth (13-18)</div>
            <div className="stat-value">{formatCurrency(reportData.youth_ticket_revenue)}</div>
            <div className="stat-sub">{formatNumber(reportData.youth_tickets_sold)} sold</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Child (12 & under)</div>
            <div className="stat-value">{formatCurrency(reportData.child_ticket_revenue)}</div>
            <div className="stat-sub">{formatNumber(reportData.child_tickets_sold)} sold</div>
          </div>
        </div>

        <h4>💝 Donations</h4>
        <div className="stats-grid two-columns">
          <div className="stat-card">
            <div className="stat-icon">💝</div>
            <div className="stat-value">{formatCurrency(reportData.total_donation_revenue)}</div>
            <div className="stat-label">Total Donations</div>
            <div className="stat-sub">{formatNumber(reportData.total_donations)} donations</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{formatCurrency(reportData.avg_donation_amount)}</div>
            <div className="stat-label">Average Donation</div>
          </div>
        </div>

        <div className="stats-grid two-columns">
          <div className="stat-card">
            <div className="stat-label">One-time Donations</div>
            <div className="stat-value">{formatCurrency(reportData.one_time_donations)}</div>
            <div className="stat-sub">{formatNumber(reportData.one_time_donation_count)} donations</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recurring Donations</div>
            <div className="stat-value">{formatCurrency(reportData.recurring_donations)}</div>
            <div className="stat-sub">{formatNumber(reportData.recurring_donation_count)} donations</div>
          </div>
        </div>

        <div className="total-revenue-card">
          <div className="total-label">COMBINED TOTAL REVENUE</div>
          <div className="total-value">{formatCurrency(reportData.total_revenue)}</div>
        </div>
      </div>
    );
  };

  // Render Art Collection Report (Artists + Artwork + Exhibitions)
  const renderArtCollectionReport = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎨</div>
            <div className="stat-value">{formatNumber(reportData.total_artworks)}</div>
            <div className="stat-label">Total Artworks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🎨</div>
            <div className="stat-value">{formatNumber(reportData.total_artists)}</div>
            <div className="stat-label">Total Artists</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-value">{formatNumber(reportData.total_nationalities)}</div>
            <div className="stat-label">Nationalities</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{formatCurrency(reportData.total_collection_value)}</div>
            <div className="stat-label">Collection Value</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-group">
            <h4>Display Status</h4>
            <div className="status-bars">
              <div className="status-item">
                <span>On Display</span>
                <div className="progress-bar">
                  <div className="progress-fill display" style={{ width: `${(reportData.artworks_on_display / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.artworks_on_display}</span>
              </div>
              <div className="status-item">
                <span>In Storage</span>
                <div className="progress-bar">
                  <div className="progress-fill storage" style={{ width: `${(reportData.artworks_in_storage / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.artworks_in_storage}</span>
              </div>
              <div className="status-item">
                <span>On Loan</span>
                <div className="progress-bar">
                  <div className="progress-fill loan" style={{ width: `${(reportData.artworks_on_loan / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.artworks_on_loan}</span>
              </div>
            </div>
          </div>

          <div className="stat-group">
            <h4>Collection Highlights</h4>
            <div className="highlight-item">
              <span>🥇 Most Prolific Artist</span>
              <strong>{reportData.top_artist_by_count}</strong>
              <span>({reportData.top_artist_count} artworks)</span>
            </div>
            <div className="highlight-item">
              <span>📅 Date Range</span>
              <strong>{reportData.oldest_artwork} - {reportData.newest_artwork}</strong>
            </div>
            <div className="highlight-item">
              <span>💰 Average Artwork Value</span>
              <strong>{formatCurrency(reportData.avg_artwork_value)}</strong>
            </div>
          </div>
        </div>

        <h4>🏛️ Exhibition Summary</h4>
        <div className="stats-grid four-columns">
          <div className="stat-card small">
            <div className="stat-label">Total Exhibitions</div>
            <div className="stat-value">{formatNumber(reportData.total_exhibitions)}</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Permanent</div>
            <div className="stat-value">{formatNumber(reportData.permanent_exhibitions)}</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Temporary</div>
            <div className="stat-value">{formatNumber(reportData.temporary_exhibitions)}</div>
          </div>
          <div className="stat-card small">
            <div className="stat-label">Artworks in Exhibitions</div>
            <div className="stat-value">{formatNumber(reportData.artworks_in_exhibitions)}</div>
          </div>
        </div>
        {reportData.current_exhibition && (
          <div className="current-exhibition">
            <span>📅 Current Exhibition:</span>
            <strong>{reportData.current_exhibition}</strong>
          </div>
        )}
      </div>
    );
  };

  // Render Gift Shop Report
  const renderGiftShopReport = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{formatCurrency(reportData.total_revenue)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-sub">{formatNumber(reportData.total_transactions)} transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{formatCurrency(reportData.avg_transaction_value)}</div>
            <div className="stat-label">Average Transaction</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{formatCurrency(reportData.max_transaction)}</div>
            <div className="stat-label">Largest Sale</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{formatNumber(reportData.total_items)}</div>
            <div className="stat-label">Total Products</div>
            <div className="stat-sub">{formatNumber(reportData.total_stock)} units in stock</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-group">
            <h4>⚠️ Inventory Alerts</h4>
            <div className="alert-item warning">
              <span>⚠️ Low Stock Items</span>
              <strong>{formatNumber(reportData.low_stock_items)} items below 10 units</strong>
            </div>
            <div className="alert-item danger">
              <span>❌ Out of Stock</span>
              <strong>{formatNumber(reportData.out_of_stock_items)} items</strong>
            </div>
          </div>

          <div className="stat-group">
            <h4>🏆 Top Performers</h4>
            <div className="highlight-item">
              <span>🥇 Best Selling Item</span>
              <strong>{reportData.top_selling_item}</strong>
              <span>({reportData.top_selling_quantity} sold)</span>
            </div>
            <div className="highlight-item">
              <span>💰 Top Revenue Item</span>
              <strong>{reportData.top_revenue_item}</strong>
              <span>{formatCurrency(reportData.top_revenue_amount)}</span>
            </div>
          </div>
        </div>

        <div className="stats-grid two-columns">
          <div className="stat-card">
            <div className="stat-label">Most Common Category</div>
            <div className="stat-value">{reportData.most_common_category || 'N/A'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Most Used Payment Method</div>
            <div className="stat-value">{reportData.most_used_payment || 'N/A'}</div>
          </div>
        </div>

        <div className="query-card" style={{ marginTop: '20px' }}>
          <h4>🔍 Check Low Stock Items</h4>
          <div className="query-input">
            <button onClick={searchGiftShopLowStock}>
              View Low Stock Items
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render User Summary Report
  const renderUserReport = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{formatNumber(reportData.total_users)}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-value">{formatNumber(reportData.admin_count)}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👔</div>
            <div className="stat-value">{formatNumber(reportData.employee_count)}</div>
            <div className="stat-label">Employees</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{formatNumber(reportData.member_count)}</div>
            <div className="stat-label">Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚶</div>
            <div className="stat-value">{formatNumber(reportData.visitor_count)}</div>
            <div className="stat-label">Visitors</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-group">
            <h4>📊 Visitor Statistics</h4>
            <div className="highlight-item">
              <span>Visitors with recorded visits</span>
              <strong>{formatNumber(reportData.visitors_with_visits)}</strong>
            </div>
            <div className="highlight-item">
              <span>Average visits per visitor</span>
              <strong>{reportData.avg_visits_per_visitor || '0'}</strong>
            </div>
            <div className="highlight-item">
              <span>Most frequent visitor</span>
              <strong>{reportData.max_visits || '0'} visits</strong>
            </div>
          </div>

          <div className="stat-group">
            <h4>💎 Membership Statistics</h4>
            <div className="highlight-item">
              <span>Active Members</span>
              <strong>{formatNumber(reportData.active_members)}</strong>
            </div>
            <div className="highlight-item">
              <span>Expired Memberships</span>
              <strong>{formatNumber(reportData.expired_members)}</strong>
            </div>
            <div className="highlight-item">
              <span>Most Common Level</span>
              <strong>{reportData.most_common_membership || 'N/A'}</strong>
            </div>
          </div>
        </div>

        <div className="current-exhibition">
          <span>📈 New Users (Last 30 Days):</span>
          <strong>{formatNumber(reportData.new_users_last_30_days)}</strong>
        </div>
      </div>
    );
  };

  // Render Query Results
  const renderQueryResults = () => {
    if (!queryResult) return null;
    if (!Array.isArray(queryResult) || queryResult.length === 0) {
      return <div className="no-results">No results found</div>;
    }
    return (
      <div className="query-results-table">
        <table>
          <thead>
            <tr>
              {Object.keys(queryResult[0]).map(key => (
                <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResult.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>
                    {typeof value === 'number' && key.includes('price') || key.includes('value') || key.includes('amount') 
                      ? formatCurrency(value) 
                      : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="reports-panel">
      {/* Report Buttons */}
      <div className="report-buttons">
        <button 
          className={activeReport === "revenue" ? "active" : ""} 
          onClick={() => setActiveReport("revenue")}
        >
          💰 Revenue (Tickets + Donations)
        </button>
        <button 
          className={activeReport === "artCollection" ? "active" : ""} 
          onClick={() => setActiveReport("artCollection")}
        >
          🎨 Art Collection
        </button>
        <button 
          className={activeReport === "giftShop" ? "active" : ""} 
          onClick={() => setActiveReport("giftShop")}
        >
          🛍️ Gift Shop
        </button>
        <button 
          className={activeReport === "users" ? "active" : ""} 
          onClick={() => setActiveReport("users")}
        >
          👥 User Summary
        </button>
      </div>

      {/* Report Display */}
      <div className="report-display">
        <h3>
          {activeReport === "revenue" && "💰 Revenue Report (Ticket Sales + Donations)"}
          {activeReport === "artCollection" && "🎨 Art Collection Report"}
          {activeReport === "giftShop" && "🛍️ Gift Shop Report"}
          {activeReport === "users" && "👥 User Summary Report"}
        </h3>
        {loading ? (
          <div className="loading">Loading report...</div>
        ) : reportData ? (
          <>
            {activeReport === "revenue" && renderRevenueReport()}
            {activeReport === "artCollection" && renderArtCollectionReport()}
            {activeReport === "giftShop" && renderGiftShopReport()}
            {activeReport === "users" && renderUserReport()}
          </>
        ) : (
          <p>Select a report to view</p>
        )}
      </div>

      {/* Data Queries Section */}
      <div className="queries-section">
        <h3>🔍 Data Queries</h3>
        
        <div className="queries-grid">
          {/* Query 1: By Artist */}
          <div className="query-card">
            <h4>🎨 Find Artworks by Artist</h4>
            <div className="query-input">
              <input 
                type="text" 
                placeholder="Enter artist name (e.g., Monet)"
                id="artistName"
              />
              <button onClick={() => {
                const name = document.getElementById('artistName').value;
                searchByArtist(name);
              }}>
                Search
              </button>
            </div>
          </div>

          {/* Query 2: By Year Range */}
          <div className="query-card">
            <h4>📅 Find Artworks by Year Range</h4>
            <div className="query-input">
              <input type="number" placeholder="Start Year" id="startYear" />
              <span>to</span>
              <input type="number" placeholder="End Year" id="endYear" />
              <button onClick={() => {
                const start = document.getElementById('startYear').value;
                const end = document.getElementById('endYear').value;
                searchByYearRange(start, end);
              }}>
                Search
              </button>
            </div>
          </div>

          {/* Query 3: By Medium */}
          <div className="query-card">
            <h4>🖌️ Find Artworks by Medium</h4>
            <div className="query-input">
              <input 
                type="text" 
                placeholder="Enter medium (e.g., Oil on canvas)"
                id="medium"
              />
              <button onClick={() => {
                const medium = document.getElementById('medium').value;
                searchByMedium(medium);
              }}>
                Search
              </button>
            </div>
          </div>

          {/* Query 4: Top Valued Artworks */}
          <div className="query-card">
            <h4>💎 Top Valued Artworks</h4>
            <div className="query-input">
              <input 
                type="number" 
                placeholder="Number of results"
                id="topLimit"
                defaultValue="10"
              />
              <button onClick={() => {
                const limit = document.getElementById('topLimit').value;
                searchTopValued(limit);
              }}>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Query Results */}
        {queryLoading && <div className="loading">Running query...</div>}
        {queryResult && (
          <div className="query-results">
            <h4>Results ({Array.isArray(queryResult) ? queryResult.length : 1} items):</h4>
            {renderQueryResults()}
          </div>
        )}
      </div>
    </div>
  );
}