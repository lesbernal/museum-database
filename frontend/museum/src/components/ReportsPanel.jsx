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

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/reports/sales-summary`);
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load sales report:", err);
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
    else if (activeReport === "sales") loadSalesReport();
    else if (activeReport === "exhibitions") loadExhibitionReport();
  }, [activeReport]);

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
          className={activeReport === "sales" ? "active" : ""} 
          onClick={() => setActiveReport("sales")}
        >
          Sales Summary
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
        <h3>Data Report</h3>
        {loading ? (
          <div className="loading">Loading report...</div>
        ) : reportData ? (
          <pre className="report-data">{JSON.stringify(reportData, null, 2)}</pre>
        ) : (
          <p>Select a report to view</p>
        )}
      </div>

      {/* Data Queries Section */}
      <div className="queries-section">
        <h3>Data Queries</h3>
        
        {/* Query 1: By Artist */}
        <div className="query-card">
          <h4>Query 1: Find Artworks by Artist</h4>
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
          <h4>Query 2: Find Artworks by Year Range</h4>
          <div className="query-input">
            <input type="number" placeholder="Start Year (e.g., 1880)" id="startYear" />
            <span>to</span>
            <input type="number" placeholder="End Year (e.g., 1900)" id="endYear" />
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
          <h4>Query 3: Find Artworks by Medium</h4>
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
          <h4>Query 4: Top Valued Artworks</h4>
          <div className="query-input">
            <input 
              type="number" 
              placeholder="Number of results (e.g., 10)"
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

        {/* Query Results */}
        {queryLoading && <div className="loading">Running query...</div>}
        {queryResult && (
          <div className="query-results">
            <h4>Results ({Array.isArray(queryResult) ? queryResult.length : 1} items):</h4>
            <pre>{JSON.stringify(queryResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}