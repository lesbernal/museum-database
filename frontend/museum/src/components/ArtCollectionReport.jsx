// components/ArtCollectionReport.jsx
import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line
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

  // Filters - simplified (single source of truth)
  const [filters, setFilters] = useState({
    artistId: "",
    startYear: "",
    endYear: "",
    status: "",
    medium: "",
    minValue: "",
    maxValue: "",
    galleryId: ""
  });

  // Dropdown options
  const [artists, setArtists] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [statuses] = useState(["On Display", "In Storage", "On Loan", "Under Restoration", "Deaccessioned"]);

  // Derived insights (calculated from data)
  const insights = useMemo(() => {
    if (!reportData.length) return null;

    // Most valuable artists (top 5 by total insurance value)
    const artistValue = {};
    reportData.forEach(artwork => {
      if (artwork.artist_name) {
        artistValue[artwork.artist_name] = (artistValue[artwork.artist_name] || 0) + (parseFloat(artwork.insurance_value) || 0);
      }
    });
    const topArtists = Object.entries(artistValue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Most prolific artists (most artworks)
    const artistCount = {};
    reportData.forEach(artwork => {
      if (artwork.artist_name) {
        artistCount[artwork.artist_name] = (artistCount[artwork.artist_name] || 0) + 1;
      }
    });
    const topProlificArtists = Object.entries(artistCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Value distribution by century
    const centuryValue = {};
    reportData.forEach(artwork => {
      const year = artwork.creation_year;
      if (year && year > 0) {
        const century = Math.floor(year / 100) + 1;
        const centuryLabel = `${century}th Century`;
        centuryValue[centuryLabel] = (centuryValue[centuryLabel] || 0) + (parseFloat(artwork.insurance_value) || 0);
      }
    });
    const centuryData = Object.entries(centuryValue)
      .map(([century, value]) => ({ century, value }))
      .sort((a, b) => {
        const aNum = parseInt(a.century);
        const bNum = parseInt(b.century);
        return aNum - bNum;
      });

    // Gallery value distribution
    const galleryValue = {};
    reportData.forEach(artwork => {
      if (artwork.gallery_name && artwork.gallery_name !== "Not Assigned") {
        galleryValue[artwork.gallery_name] = (galleryValue[artwork.gallery_name] || 0) + (parseFloat(artwork.insurance_value) || 0);
      }
    });
    const topGalleries = Object.entries(galleryValue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // At-risk value (art on loan or in storage - insurance risk)
    const atRiskValue = reportData
      .filter(artwork => artwork.current_display_status === "On Loan" || artwork.current_display_status === "In Storage")
      .reduce((sum, artwork) => sum + (parseFloat(artwork.insurance_value) || 0), 0);

    // Restoration needed value
    const restorationValue = reportData
      .filter(artwork => artwork.current_display_status === "Under Restoration")
      .reduce((sum, artwork) => sum + (parseFloat(artwork.insurance_value) || 0), 0);

    // Oldest and newest acquisitions (if acquisition_date exists)
    const datedArtworks = reportData.filter(a => a.acquisition_date);
    const oldestAcquisition = datedArtworks.length > 0 
      ? datedArtworks.reduce((oldest, current) => new Date(current.acquisition_date) < new Date(oldest.acquisition_date) ? current : oldest)
      : null;
    const newestAcquisition = datedArtworks.length > 0
      ? datedArtworks.reduce((newest, current) => new Date(current.acquisition_date) > new Date(newest.acquisition_date) ? current : newest)
      : null;

    return {
      topArtists,
      topProlificArtists,
      centuryData,
      topGalleries,
      atRiskValue,
      restorationValue,
      oldestAcquisition,
      newestAcquisition,
      uniqueArtists: Object.keys(artistValue).length,
      uniqueGalleries: Object.keys(galleryValue).length,
      percentOnLoan: ((reportData.filter(a => a.current_display_status === "On Loan").length / reportData.length) * 100).toFixed(1),
      percentInStorage: ((reportData.filter(a => a.current_display_status === "In Storage").length / reportData.length) * 100).toFixed(1)
    };
  }, [reportData]);

  useEffect(() => {
    loadArtists();
    loadMediums();
    loadGalleries();
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

  const loadGalleries = async () => {
    try {
      const res = await fetch(`${BASE_URL}/galleries`);
      setGalleries(await res.json());
    } catch (err) { console.error("Failed to load galleries:", err); }
  };

  useEffect(() => {
    if (hasGenerated) loadReportData();
  }, [filters, hasGenerated]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/reports/art-collection-data?`;
      if (filters.artistId)   url += `artistId=${filters.artistId}&`;
      if (filters.startYear)  url += `startYear=${filters.startYear}&`;
      if (filters.endYear)    url += `endYear=${filters.endYear}&`;
      if (filters.status)     url += `status=${filters.status}&`;
      if (filters.medium)     url += `medium=${filters.medium}&`;
      if (filters.minValue)   url += `minValue=${filters.minValue}&`;
      if (filters.maxValue)   url += `maxValue=${filters.maxValue}&`;
      if (filters.galleryId)  url += `galleryId=${filters.galleryId}&`;

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

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    setHasGenerated(true);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      artistId: "", startYear: "", endYear: "",
      status: "", medium: "", minValue: "", maxValue: "", galleryId: ""
    });
    setHasGenerated(false);
    setReportData([]);
    setSummary(null);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage) || 1;

  const formatCurrency = (value) => {
    if (!value) return "$0";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(num);
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

  // Chart data
  const statusChartData = statuses.map(s => ({
    name: s,
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
        <h2> Art Collection Report</h2>
        <p>Comprehensive analysis of the museum's art collection including valuations, artist insights, and risk assessment</p>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Artist</label>
            <select value={filters.artistId} onChange={(e) => updateFilter('artistId', e.target.value)}>
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
            <select value={filters.medium} onChange={(e) => updateFilter('medium', e.target.value)}>
              <option value="">All Mediums</option>
              {mediums.map(medium => <option key={medium} value={medium}>{medium}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Year Range (From)</label>
            <input type="number" placeholder="e.g., 1900" value={filters.startYear} onChange={(e) => updateFilter('startYear', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Year Range (To)</label>
            <input type="number" placeholder="e.g., 2026" value={filters.endYear} onChange={(e) => updateFilter('endYear', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Value Range (From)</label>
            <input type="number" placeholder="Min $" value={filters.minValue} onChange={(e) => updateFilter('minValue', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Value Range (To)</label>
            <input type="number" placeholder="Max $" value={filters.maxValue} onChange={(e) => updateFilter('maxValue', e.target.value)} />
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
            <div className="summary-card primary">
              <div className="summary-label">Total Artworks</div>
              <div className="summary-value">{summary.total_artworks?.toLocaleString() || 0}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Collection Value</div>
              <div className="summary-value">{formatCurrency(summary.total_value)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Average Value</div>
              <div className="summary-value">{formatCurrency(summary.avg_value)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Unique Artists</div>
              <div className="summary-value">{insights?.uniqueArtists || 0}</div>
            </div>
          </div>

          {/* NEW: Risk & Insurance Insights */}
          {insights && (
            <div className="insights-section">
              <h3> Collection Insights & Risk Assessment</h3>
              <div className="summary-grid">
                <div className="summary-card risk-card">
                  <div className="summary-label">⚠️ At-Risk Value (On Loan/Storage)</div>
                  <div className="summary-value">{formatCurrency(insights.atRiskValue)}</div>
                  <div className="insight-subtext">{insights.percentOnLoan}% on loan, {insights.percentInStorage}% in storage</div>
                </div>
                <div className="summary-card restoration-card">
                  <div className="summary-label">🔧 Under Restoration Value</div>
                  <div className="summary-value">{formatCurrency(insights.restorationValue)}</div>
                  <div className="insight-subtext">Artworks needing conservation</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label"> Active Galleries</div>
                  <div className="summary-value">{insights.uniqueGalleries}</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Artists & Galleries Section */}
          {insights && (insights.topArtists.length > 0 || insights.topGalleries.length > 0) && (
            <div className="charts-grid">
              {insights.topArtists.length > 0 && (
                <div className="chart-container">
                  <h4> Most Valuable Artists</h4>
                  <table className="insights-table">
                    <tbody>
                      {insights.topArtists.map((artist, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`rank-badge ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`}>
                              {i + 1}
                            </span>
                            {artist.name}
                          </td>
                          <td>{formatCurrency(artist.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {insights.topGalleries.length > 0 && (
                <div className="chart-container">
                  <h4> Gallery Value Distribution</h4>
                  <table className="insights-table">
                    <tbody>
                      {insights.topGalleries.map((gallery, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`rank-badge ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`}>
                              {i + 1}
                            </span>
                            {gallery.name}
                          </td>
                          <td>{formatCurrency(gallery.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Value by Century Chart - NEW */}
          {insights?.centuryData.length > 0 && (
            <div className="chart-container" style={{ marginTop: "1.5rem" }}>
              <h4> Collection Value by Century</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={insights.centuryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="century" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#c5a028" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status & Medium Charts */}
          <div className="charts-grid">
            {/* Status Bar Chart */}
            <div className="chart-container">
              <h4>Artworks by Display Status</h4>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#c5a028"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No data to display</div>
              )}
            </div>

            {/* Medium Bar Chart */}
            <div className="chart-container">
              <h4>Artworks by Medium (Top 8)</h4>
              {mediumChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={mediumChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {mediumChartData.map((_, i) => (
                        <Cell key={i} fill={MEDIUM_COLORS[i % MEDIUM_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No data to display</div>
              )}
            </div>
          </div>

          {/* NEW: Acquisition Insights */}
          {insights?.oldestAcquisition && (
            <div className="insights-section">
              <h3>📅 Acquisition Insights</h3>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Oldest Acquisition</div>
                  <div className="summary-value">{insights.oldestAcquisition.title}</div>
                  <div className="insight-subtext">{new Date(insights.oldestAcquisition.acquisition_date).toLocaleDateString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Newest Acquisition</div>
                  <div className="summary-value">{insights.newestAcquisition.title}</div>
                  <div className="insight-subtext">{new Date(insights.newestAcquisition.acquisition_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
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
                  <th>Status</th>
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
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pagination-btn">⏮ First</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">◀ Prev</button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn">Next ▶</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="pagination-btn">Last ⏭</button>
            </div>
          </div>
        </div>
      )}

      {hasGenerated && reportData.length === 0 && !loading && (
        <div className="no-results">No artworks found. Try adjusting your filters.</div>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select date range and click Generate Report to view Art Collection analytics.</div>
      )}

      {loading && <div className="loading">Loading collection data...</div>}
    </div>
  );
}