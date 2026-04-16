// components/ArtCollectionReport.jsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import "../styles/ArtCollectionReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_COLORS = {
  "On Display":        "#c5a028",
  "In Storage":        "#6b7280",
  "On Loan":           "#1d4ed8",
  "Under Restoration": "#dc2626",
  "Deaccessioned":     "#9ca3af",
};

const MEDIUM_COLORS = ["#c5a028", "#1d4ed8", "#065f46", "#92400e", "#5b21b6", "#9d174d", "#0891b2", "#65a30d"];

export default function ArtCollectionReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [artistFilter, setArtistFilter] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mediumFilter, setMediumFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Applied filters
  const [appliedArtistFilter, setAppliedArtistFilter] = useState("");
  const [appliedStartYear, setAppliedStartYear] = useState("");
  const [appliedEndYear, setAppliedEndYear] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("");
  const [appliedMediumFilter, setAppliedMediumFilter] = useState("");
  const [appliedMinValue, setAppliedMinValue] = useState("");
  const [appliedMaxValue, setAppliedMaxValue] = useState("");

  // Dropdown options
  const [artists, setArtists] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [statuses] = useState(["On Display", "In Storage", "On Loan", "Under Restoration", "Deaccessioned"]);

  useEffect(() => {
    loadArtists();
    loadMediums();
  }, []);

  const loadArtists = async () => {
    try {
      const res = await fetch(`${BASE_URL}/artists`);
      setArtists(await res.json());
    } catch (err) { console.error("Failed to load artists:", err); }
  };

  const loadMediums = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reports/filter-options?type=mediums`);
      setMediums(await res.json());
    } catch (err) { console.error("Failed to load mediums:", err); }
  };

  useEffect(() => {
    if (hasGenerated) loadReportData();
  }, [appliedArtistFilter, appliedStartYear, appliedEndYear, appliedStatusFilter, appliedMediumFilter, appliedMinValue, appliedMaxValue, hasGenerated]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/reports/art-collection-data?`;
      if (appliedArtistFilter)  url += `artistId=${appliedArtistFilter}&`;
      if (appliedStartYear)     url += `startYear=${appliedStartYear}&`;
      if (appliedEndYear)       url += `endYear=${appliedEndYear}&`;
      if (appliedStatusFilter)  url += `status=${appliedStatusFilter}&`;
      if (appliedMediumFilter)  url += `medium=${appliedMediumFilter}&`;
      if (appliedMinValue)      url += `minValue=${appliedMinValue}&`;
      if (appliedMaxValue)      url += `maxValue=${appliedMaxValue}&`;

      const response = await fetch(url);
      const data = await response.json();
      setReportData(data.data || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Failed to load art collection data:", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    setAppliedArtistFilter(artistFilter);
    setAppliedStartYear(startYear);
    setAppliedEndYear(endYear);
    setAppliedStatusFilter(statusFilter);
    setAppliedMediumFilter(mediumFilter);
    setAppliedMinValue(minValue);
    setAppliedMaxValue(maxValue);
    setHasGenerated(true);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setArtistFilter(""); setStartYear(""); setEndYear("");
    setStatusFilter(""); setMediumFilter(""); setMinValue(""); setMaxValue("");
    setAppliedArtistFilter(""); setAppliedStartYear(""); setAppliedEndYear("");
    setAppliedStatusFilter(""); setAppliedMediumFilter(""); setAppliedMinValue(""); setAppliedMaxValue("");
    setHasGenerated(false);
    setReportData([]); setSummary(null);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastRow  = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows     = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages      = Math.ceil(reportData.length / rowsPerPage) || 1;

  const formatCurrency = (value) => {
    if (!value) return "$0";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "On Display":        return "badge-display";
      case "In Storage":        return "badge-storage";
      case "On Loan":           return "badge-loan";
      case "Under Restoration": return "badge-restoration";
      case "Deaccessioned":     return "badge-deaccessioned";
      default: return "";
    }
  };

  // Chart data derived from reportData
  const statusChartData = statuses.map(s => ({
    name:  s,
    count: reportData.filter(a => a.current_display_status === s).length,
  })).filter(d => d.count > 0);

  const mediumCounts = reportData.reduce((acc, a) => {
    if (a.medium) acc[a.medium] = (acc[a.medium] || 0) + 1;
    return acc;
  }, {});
  const mediumChartData = Object.entries(mediumCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="art-collection-report">
      <div className="report-header">
        <h2>Art Collection Report</h2>
        <p>Browse and filter the museum's art collection</p>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Artist</label>
            <select value={artistFilter} onChange={(e) => setArtistFilter(e.target.value)}>
              <option value="">All Artists</option>
              {artists.map(artist => (
                <option key={artist.artist_id} value={artist.artist_id}>
                  {artist.first_name} {artist.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Medium</label>
            <select value={mediumFilter} onChange={(e) => setMediumFilter(e.target.value)}>
              <option value="">All Mediums</option>
              {mediums.map(medium => <option key={medium} value={medium}>{medium}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Year Range (From)</label>
            <input type="number" placeholder="e.g., 1900" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Year Range (To)</label>
            <input type="number" placeholder="e.g., 2026" value={endYear} onChange={(e) => setEndYear(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Value Range (From)</label>
            <input type="number" placeholder="Min $" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Value Range (To)</label>
            <input type="number" placeholder="Max $" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? "Loading..." : "Generate Report"}
            </button>
            <button className="reset-btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {hasGenerated && summary && (
        <div className="summary-section">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Artworks</div>
              <div className="summary-value">{summary.total_artworks?.toLocaleString() || 0}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Value</div>
              <div className="summary-value">{formatCurrency(summary.total_value)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Average Value</div>
              <div className="summary-value">{formatCurrency(summary.avg_value)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Artists</div>
              <div className="summary-value">{summary.total_artists?.toLocaleString() || 0}</div>
            </div>
          </div>

          {/* ── CHARTS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>

            {/* Status Bar Chart */}
            <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: 4 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Artworks by Display Status
              </h4>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusChartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Artworks" radius={[2, 2, 0, 0]}>
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#c5a028"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                  No data to display
                </div>
              )}
            </div>

            {/* Medium Bar Chart */}
            <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: 4 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Artworks by Medium (Top 8)
              </h4>
              {mediumChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={mediumChartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Artworks" radius={[2, 2, 0, 0]}>
                      {mediumChartData.map((_, i) => (
                        <Cell key={i} fill={MEDIUM_COLORS[i % MEDIUM_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                  No data to display
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {hasGenerated && reportData.length > 0 && (
        <div className="data-section">
          <div className="data-header">
            <h3>Artwork Details</h3>
            <div className="pagination-controls">
              <span>Rows per page:</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Year</th>
                  <th>Medium</th>
                  <th>Display Status</th>
                  <th>Insurance Value</th>
                  <th>Gallery</th>
                  <th>Gallery Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((artwork, idx) => (
                  <tr key={idx}>
                    <td className="title-cell">{artwork.title}</td>
                    <td>{artwork.artist_name}</td>
                    <td>{artwork.creation_year || "—"}</td>
                    <td>{artwork.medium || "—"}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(artwork.current_display_status)}`}>
                        {artwork.current_display_status || "Unknown"}
                      </span>
                    </td>
                    <td className="value-cell">{formatCurrency(artwork.insurance_value)}</td>
                    <td>{artwork.gallery_name || "Not Assigned"}</td>
                    <td>{artwork.gallery_active === 1 ? "🟢 Active" : "⚪ Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <div className="pagination-controls">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>⏮ First</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>◀ Prev</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ▶</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last ⏭</button>
            </div>
          </div>
        </div>
      )}

      {hasGenerated && reportData.length === 0 && !loading && (
        <div className="no-results">No artworks found. Try adjusting your filters.</div>
      )}
      {loading && <div className="loading">Loading collection data...</div>}
    </div>
  );
}