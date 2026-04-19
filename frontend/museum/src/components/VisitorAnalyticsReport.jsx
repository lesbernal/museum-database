// components/VisitorAnalyticsReport.jsx
import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";
import "../styles/VisitorAnalyticsReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function VisitorAnalyticsReport() {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [data, setData] = useState(null);
  
  // Pagination - matching other reports
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);  // Changed from 10 to 25 to match others

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const response = await fetch(`${BASE_URL}/reports/visitor-analytics?${params}`);
      const result = await response.json();
      setData(result);
      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to load visitor analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ startDate: "", endDate: "" });
    setHasGenerated(false);
    setData(null);
    setCurrentPage(1);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Pagination - matching other reports (using handlePageChange)
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentVisitors = data?.topVisitors?.slice(indexOfFirstRow, indexOfLastRow) || [];
  const totalPages = Math.ceil((data?.topVisitors?.length || 0) / rowsPerPage) || 1;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Optional: scroll to top of table
    document.querySelector('.table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="visitor-analytics-report">
      <div className="report-header">
        <h2>Visitor Analytics</h2>
        <p>Track museum attendance, visitor behavior, and engagement metrics</p>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
            />
          </div>
          <div className="filter-group">
            <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? "Loading..." : "Generate Report"}
            </button>
            <button className="reset-btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading visitor data...</div>}

      {hasGenerated && data && (
        <>
          {/* Summary Cards */}
          <div className="summary-section">
            <div className="summary-grid">
              <div className="summary-card primary">
                <div className="summary-label">Total Visitors</div>
                <div className="summary-value">{formatNumber(data.summary.total_visitors)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Active Members</div>
                <div className="summary-value">{formatNumber(data.summary.active_members)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Retention Rate</div>
                <div className="summary-value">{data.summary.retention_rate || 0}%</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Avg Visits per Visitor</div>
                <div className="summary-value">{data.summary.avg_visits_per_visitor || 0}</div>
              </div>
            </div>
            
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Unique Visitors (Period)</div>
                <div className="summary-value">{formatNumber(data.summary.unique_visitors)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Tickets Sold</div>
                <div className="summary-value">{formatNumber(data.summary.total_tickets_sold)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Event Signups</div>
                <div className="summary-value">{formatNumber(data.summary.total_event_signups)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Active Days</div>
                <div className="summary-value">{formatNumber(data.summary.active_days)}</div>
              </div>
            </div>
          </div>

          {/* Daily Trends Chart */}
          {data.dailyTrends && data.dailyTrends.length > 0 && (
            <div className="chart-container">
              <h4>Daily Visitor Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyTrends.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="unique_visitors" stroke="#c5a028" fill="#c5a028" fillOpacity={0.2} name="Unique Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two-column layout for breakdowns */}
          <div className="charts-grid">
            {/* Visitor Type Breakdown */}
            {data.visitorBreakdown && data.visitorBreakdown.length > 0 && (
              <div className="chart-container">
                <h4>Visitor Type Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.visitorBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="visitor_type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="visitor_count" fill="#c5a028" radius={[4, 4, 0, 0]} name="Visitors" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Frequency Distribution Chart */}
            {data.frequencyDistribution && data.frequencyDistribution.length > 0 && (
              <div className="chart-container">
                <h4>Visitor Frequency</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.frequencyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="frequency_group" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="visitor_count" fill="#c5a028" radius={[4, 4, 0, 0]} name="Visitors" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* All Visitors Table */}
          {data.topVisitors && data.topVisitors.length > 0 && (
            <div className="data-section">
              <div className="data-header">
                <h3>All Visitors</h3>
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
                      <th>Visitor</th>
                      <th>Location</th>
                      <th>Membership</th>
                      <th>Visit Days</th>
                      <th>Tickets</th>
                      <th>Events Attended</th>
                      <th>Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVisitors.map((visitor, idx) => (
                      <tr key={idx}>
                        <td className="title-cell">{visitor.name}</td>
                        <td>{visitor.city}, {visitor.state || "—"}</td>
                        <td>
                          <span className={`visitor-badge ${visitor.membership_level ? 'badge-member' : 'badge-nonmember'}`}>
                            {visitor.membership_level || "Non-Member"}
                          </span>
                        </td>
                        <td>{visitor.visit_days || visitor.total_visits || 0}</td>
                        <td>{visitor.tickets_purchased || 0}</td>
                        <td>{visitor.events_attended || 0}</td>
                        <td>{visitor.last_visit ? new Date(visitor.last_visit).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-container">
                <div className="pagination-controls">
                  <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="pagination-btn">⏮ First</button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">◀ Prev</button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">Next ▶</button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="pagination-btn">Last ⏭</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select date range and click Generate Report to view visitor analytics.</div>
      )}
    </div>
  );
}