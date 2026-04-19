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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const formatCurrency = (value) => {
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Pagination for top visitors
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentVisitors = data?.topVisitors?.slice(indexOfFirstRow, indexOfLastRow) || [];
  const totalPages = Math.ceil((data?.topVisitors?.length || 0) / rowsPerPage);

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
                <div className="summary-label">Tickets Sold</div>
                <div className="summary-value">{formatNumber(data.summary.total_tickets_sold)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Ticket Revenue</div>
                <div className="summary-value">{formatCurrency(data.summary.total_ticket_revenue)}</div>
              </div>
            </div>
            
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Avg Revenue per Visitor</div>
                <div className="summary-value">{formatCurrency(data.summary.avg_revenue_per_visitor)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Avg Visits per Visitor</div>
                <div className="summary-value">{data.summary.avg_visits_per_visitor || 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Donations</div>
                <div className="summary-value">{formatCurrency(data.summary.total_donations)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Event Signups</div>
                <div className="summary-value">{formatNumber(data.summary.total_event_signups)}</div>
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
                <h4>👥 Visitor Type Breakdown</h4>
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

            {/* Peak Hours Chart */}
            {data.peakHours && data.peakHours.length > 0 && (
              <div className="chart-container">
                <h4>⏰ Peak Visiting Hours</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="tickets_sold" fill="#c5a028" radius={[4, 4, 0, 0]} name="Tickets Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Visitors Table */}
          {data.topVisitors && data.topVisitors.length > 0 && (
            <div className="data-section">
              <div className="data-header">
                <h3>🏆 Most Frequent Visitors</h3>
                <div className="pagination-controls">
                  <span>Rows per page:</span>
                  <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
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
                      <th>Total Visits</th>
                      <th>Tickets Purchased</th>
                      <th>Total Spent</th>
                      <th>Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVisitors.map((visitor, idx) => (
                      <tr key={idx}>
                        <td className="title-cell">{visitor.name}</td>
                        <td>{visitor.city}, {visitor.state}</td>
                        <td>
                          <span className={`visitor-badge ${visitor.membership_level ? 'badge-member' : 'badge-nonmember'}`}>
                            {visitor.membership_level || "Non-Member"}
                          </span>
                        </td>
                        <td>{visitor.visit_days || visitor.total_visits || 0}</td>  {/* Use visit_days if available */}
                        <td>{visitor.tickets_purchased || 0}</td>
                        <td className="amount-cell">{formatCurrency(visitor.total_spent)}</td>
                        <td>{visitor.last_visit ? new Date(visitor.last_visit).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-controls">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pagination-btn">⏮ First</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">◀ Prev</button>
                    <span className="page-info">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn">Next ▶</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="pagination-btn">Last ⏭</button>
                  </div>
                </div>
              )}
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