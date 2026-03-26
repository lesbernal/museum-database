import { useState, useEffect } from "react";
import "../styles/ReportsPanel.css";

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState("artwork");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Dynamic BASE_URL - works locally and in production
  const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://museum-backend-lck5.onrender.com';

  // ==================== DATA REPORTS ====================
  
  const loadArtworkReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/artwork-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load artwork report:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/artist-stats`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load artist report:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const loadExhibitionReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/exhibition-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load exhibition report:", err);
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

  useEffect(() => {
    if (activeReport === "artwork") loadArtworkReport();
    else if (activeReport === "artists") loadArtistReport();
    else if (activeReport === "revenue") loadRevenueReport();
    else if (activeReport === "exhibitions") loadExhibitionReport();
  }, [activeReport]);

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  };

  // Helper function to format numbers
  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Render Artwork Summary Report
  const renderArtworkSummary = () => {
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
            <div className="stat-value">{formatCurrency(reportData.total_insurance_value)}</div>
            <div className="stat-label">Total Collection Value</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-group">
            <h4>Display Status</h4>
            <div className="status-bars">
              <div className="status-item">
                <span>On Display</span>
                <div className="progress-bar">
                  <div className="progress-fill display" style={{ width: `${(reportData.on_display / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.on_display}</span>
              </div>
              <div className="status-item">
                <span>In Storage</span>
                <div className="progress-bar">
                  <div className="progress-fill storage" style={{ width: `${(reportData.in_storage / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.in_storage}</span>
              </div>
              <div className="status-item">
                <span>On Loan</span>
                <div className="progress-bar">
                  <div className="progress-fill loan" style={{ width: `${(reportData.on_loan / reportData.total_artworks) * 100}%` }}></div>
                </div>
                <span className="status-count">{reportData.on_loan}</span>
              </div>
            </div>
          </div>

          <div className="stat-group">
            <h4>Date Range</h4>
            <div className="date-range">
              <div className="date-card">
                <span className="date-label">Oldest</span>
                <span className="date-value">{reportData.oldest_artwork_year}</span>
              </div>
              <div className="date-arrow">→</div>
              <div className="date-card">
                <span className="date-label">Newest</span>
                <span className="date-value">{reportData.newest_artwork_year}</span>
              </div>
            </div>
            <div className="avg-value">
              <span>Average Insurance Value:</span>
              <strong>{formatCurrency(reportData.avg_insurance_value)}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Artist Statistics Report
  const renderArtistStats = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    return (
      <div className="report-content">
        <div className="artist-table-container">
          <table className="artist-stats-table">
            <thead>
              <tr>
                <th>Artist</th>
                <th>Nationality</th>
                <th>Artworks</th>
                <th>Total Value</th>
                <th>Avg Value</th>
                <th>Years Active</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((artist, index) => (
                <tr key={artist.artist_id} className={index < 3 ? 'top-artist' : ''}>
                  <td className="artist-name">
                    {index < 3 && <span className="medal">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>}
                    {artist.artist_name}
                  </td>
                  <td>{artist.nationality}</td>
                  <td className="text-center">{artist.artwork_count}</td>
                  <td className="text-right">{formatCurrency(artist.total_artwork_value)}</td>
                  <td className="text-right">{formatCurrency(artist.avg_artwork_value)}</td>
                  <td className="text-center">{artist.earliest_work} - {artist.latest_work}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Revenue Summary Report
  const renderRevenueSummary = () => {
    if (!reportData) return null;
    return (
      <div className="report-content">
        <div className="stats-grid revenue-grid">
          <div className="stat-card revenue-card cafe">
            <div className="stat-icon">☕</div>
            <div className="stat-value">{formatCurrency(reportData.cafe_revenue || 0)}</div>
            <div className="stat-label">Cafe Revenue</div>
            <div className="stat-sub">{formatNumber(reportData.cafe_transaction_count)} transactions</div>
          </div>
          <div className="stat-card revenue-card gift">
            <div className="stat-icon">🛍️</div>
            <div className="stat-value">{formatCurrency(reportData.gift_shop_revenue || 0)}</div>
            <div className="stat-label">Gift Shop Revenue</div>
            <div className="stat-sub">{formatNumber(reportData.gift_shop_transaction_count)} transactions</div>
          </div>
          <div className="stat-card revenue-card ticket">
            <div className="stat-icon">🎟️</div>
            <div className="stat-value">{formatCurrency(reportData.ticket_revenue || 0)}</div>
            <div className="stat-label">Ticket Revenue</div>
            <div className="stat-sub">{formatNumber(reportData.ticket_sales_count)} tickets sold</div>
          </div>
        </div>
        
        <div className="total-revenue-card">
          <div className="total-label">TOTAL REVENUE</div>
          <div className="total-value">{formatCurrency(reportData.total_revenue)}</div>
        </div>
      </div>
    );
  };

  // Render Exhibition Summary Report
  const renderExhibitionSummary = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    return (
      <div className="report-content">
        <div className="exhibition-table-container">
          <table className="exhibition-table">
            <thead>
              <tr>
                <th>Exhibition</th>
                <th>Type</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((exhibition) => (
                <tr key={exhibition.exhibition_id}>
                  <td className="exhibition-title">{exhibition.exhibition_title}</td>
                  <td><span className={`type-badge ${exhibition.type?.toLowerCase()}`}>{exhibition.type}</span></td>
                  <td>{exhibition.gallery_name} <span className="building-name">({exhibition.building_name})</span></td>
                  <td>{new Date(exhibition.start_date).toLocaleDateString()}</td>
                  <td>{new Date(exhibition.end_date).toLocaleDateString()}</td>
                  <td>{exhibition.duration_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <td key={i}>{typeof value === 'number' ? formatCurrency(value) : value}</td>
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
          className={activeReport === "artwork" ? "active" : ""} 
          onClick={() => setActiveReport("artwork")}
        >
          Artwork Summary
        </button>
        <button 
          className={activeReport === "artists" ? "active" : ""} 
          onClick={() => setActiveReport("artists")}
        >
          Artist Statistics
        </button>
        <button 
          className={activeReport === "revenue" ? "active" : ""} 
          onClick={() => setActiveReport("revenue")}
        >
          Revenue Summary
        </button>
        <button 
          className={activeReport === "exhibitions" ? "active" : ""} 
          onClick={() => setActiveReport("exhibitions")}
        >
          Exhibition Summary
        </button>
      </div>

      {/* Report Display */}
      <div className="report-display">
        <h3>
          {activeReport === "artwork" && "📊 Artwork Collection Summary"}
          {activeReport === "artists" && "🏆 Artist Statistics"}
          {activeReport === "revenue" && "💰 Revenue Summary"}
          {activeReport === "exhibitions" && "🏛️ Exhibition Summary"}
        </h3>
        {loading ? (
          <div className="loading">Loading report...</div>
        ) : reportData ? (
          <>
            {activeReport === "artwork" && renderArtworkSummary()}
            {activeReport === "artists" && renderArtistStats()}
            {activeReport === "revenue" && renderRevenueSummary()}
            {activeReport === "exhibitions" && renderExhibitionSummary()}
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