// components/MembershipReport.jsx
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "../styles/MembershipReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CHART_COLORS = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Platinum: "#e5e4e2",
  Benefactor: "#9b59b6",
  "Leadership Circle": "#c5a028"
};

export default function MembershipReport() {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [data, setData] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const response = await fetch(`${BASE_URL}/reports/membership-analytics?${params}`);
      const result = await response.json();
      console.log("API Response:", result); // Debug log
      setData(result);
      setHasGenerated(true);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load membership data:", err);
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
    if (!value || value === 0) return "$0";
    // Ensure value is a number and not astronomical
    const numValue = Number(value);
    if (isNaN(numValue) || numValue > 1000000) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numValue);
  };

  const formatNumber = (value) => {
    if (!value) return "0";
    const numValue = Number(value);
    if (isNaN(numValue)) return "0";
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel?.includes("Critical")) return "#ef4444";
    if (riskLevel?.includes("Warning")) return "#f59e0b";
    return "#10b981";
  };

  // Use activeMembers from the API response (backend sends activeMembers now)
  const membersList = data?.activeMembers || [];
  
  // Pagination for members
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentMembers = membersList.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(membersList.length / rowsPerPage) || 1;

  // Prepare chart data
  const pieData = data?.levelBreakdown?.map(level => ({
    name: level.membership_level,
    value: level.count,
    color: CHART_COLORS[level.membership_level] || "#c5a028"
  })) || [];

  // Calculate retention rate from funnel data
  const retentionRate = useMemo(() => {
    if (!data?.conversionFunnel) return 0;
    const activeMembersCount = data.conversionFunnel.find(s => s.stage === "Active Members")?.count || 0;
    const totalVisitors = data.conversionFunnel.find(s => s.stage === "Visitors with tickets")?.count || 0;
    return totalVisitors > 0 ? ((activeMembersCount / totalVisitors) * 100).toFixed(1) : 0;
  }, [data]);

  // Calculate member lifetime value from valueTier data - with sanity check
  const avgMemberLTV = useMemo(() => {
    if (!data?.valueTier || data.valueTier.length === 0) return 0;
    
    // Filter out unreasonable values (> $1,000,000 is suspicious)
    const validTiers = data.valueTier.filter(tier => {
      const total = (Number(tier.avg_ticket_spend) || 0) + (Number(tier.avg_cafe_spend) || 0) + (Number(tier.avg_shop_spend) || 0);
      return total < 1000000 && total >= 0;
    });
    
    if (validTiers.length === 0) return 0;
    
    const totalSpend = validTiers.reduce((sum, tier) => {
      return sum + (Number(tier.avg_ticket_spend) || 0) + (Number(tier.avg_cafe_spend) || 0) + (Number(tier.avg_shop_spend) || 0);
    }, 0);
    
    return totalSpend / validTiers.length;
  }, [data]);

  return (
    <div className="membership-report">
      <div className="report-header">
        <h2>Membership Analytics</h2>
        <p>Track member acquisition, retention, engagement, and at-risk members</p>
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

      {loading && <div className="loading">Loading membership data...</div>}

      {hasGenerated && data && (
        <>
          {/* Summary Cards */}
          <div className="summary-section">
            <div className="summary-grid">
              <div className="summary-card primary">
                <div className="summary-label">Total Members</div>
                <div className="summary-value">{formatNumber(data.summary?.total_members)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Active Members</div>
                <div className="summary-value">{formatNumber(data.summary?.active_members)}</div>
                <div className="insight-subtext">{formatNumber(data.summary?.expired_members)} expired</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Upgrade Rate</div>
                <div className="summary-value">{data.summary?.upgrade_rate || 0}%</div>
                <div className="insight-subtext">of transactions are upgrades</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Member Retention Rate</div>
                <div className="summary-value">{retentionRate}%</div>
                <div className="insight-subtext">visitors who became members</div>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Avg Member LTV</div>
                <div className="summary-value">{formatCurrency(avgMemberLTV)}</div>
                <div className="insight-subtext">annual spend per member</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Pending Changes</div>
                <div className="summary-value">{formatNumber(data.summary?.pending_changes)}</div>
                <div className="insight-subtext">{formatNumber(data.summary?.pending_cancellations)} cancelling</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Avg Membership Duration</div>
                <div className="summary-value">{data.summary?.avg_membership_days || 0} days</div>
              </div>
            </div>
          </div>

          {/* Simplified Charts - Just 2 key visuals */}
          <div className="charts-grid">
            {/* Membership Level Distribution */}
            <div className="chart-container">
              <h4>Membership Level Distribution</h4>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatNumber(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No membership data</div>
              )}
            </div>

            {/* Value by Tier - Bar Chart */}
            <div className="chart-container">
              <h4>Annual Value by Tier</h4>
              {data.valueTier && data.valueTier.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.valueTier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="membership_level" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="avg_ticket_spend" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ticket Spend" />
                    <Bar dataKey="avg_cafe_spend" fill="#10b981" radius={[4, 4, 0, 0]} name="Cafe Spend" />
                    <Bar dataKey="avg_shop_spend" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Shop Spend" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No value data</div>
              )}
            </div>
          </div>

          {/* ===== MAIN DATA TABLE ===== */}
          <div className="data-section">
            <div className="data-header">
              <h3>📊 Member Analytics Data</h3>
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
                    <th>Member Name</th>
                    <th>Email</th>
                    <th>Level</th>
                    <th>Join Date</th>
                    <th>Expires</th>
                    <th>Days as Member</th>
                    <th>Status</th>
                    <th>Pending Change</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>
                        No active members found
                      </td>
                    </tr>
                  ) : (
                    currentMembers.map((member, idx) => {
                      // Calculate days as member using join_date
                      let daysAsMember = 0;
                      if (member.join_date) {
                        const joinDate = new Date(member.join_date);
                        const today = new Date();
                        daysAsMember = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
                      }
                      
                      const isExpiringSoon = member.days_remaining <= 30;
                      const status = member.days_remaining > 0 ? "Active" : "Expired";
                      
                      return (
                        <tr key={idx} className={isExpiringSoon ? "expiring-soon" : ""}>
                          <td className="title-cell">{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`membership-badge badge-${member.membership_level?.toLowerCase().replace(' ', '-')}`}>
                              {member.membership_level}
                            </span>
                          </td>
                          <td>{formatDate(member.join_date)}</td>
                          <td>{formatDate(member.expiration_date)}</td>
                          <td className="amount-cell">{daysAsMember} days</td>
                          <td>
                            <span className={`status-badge ${status === "Active" ? "status-active" : "status-expired"}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            {member.pending_level === "cancelled" ? (
                              <span className="pending-badge pending-cancel">Cancelling</span>
                            ) : member.pending_level ? (
                              <span className="pending-badge pending-change">→ {member.pending_level}</span>
                            ) : (
                              <span className="pending-badge pending-none">—</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              color: getRiskColor(member.risk_level),
                              fontWeight: 600,
                              fontSize: 12,
                              background: member.risk_level?.includes("Critical") ? "#fee2e2" : 
                                         member.risk_level?.includes("Warning") ? "#fef3c7" : "#d1fae5",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              display: "inline-block"
                            }}>
                              {member.risk_level || "Healthy"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
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

          {/* Summary Stats Footer */}
          <div className="summary-footer">
            <div className="footer-stats">
              <div className="footer-stat">
                <span className="footer-label">Total Active Members:</span>
                <span className="footer-value">{formatNumber(membersList.length)}</span>
              </div>
              <div className="footer-stat">
                <span className="footer-label">Expiring in 30 days:</span>
                <span className="footer-value critical">
                  {formatNumber(membersList.filter(m => m.days_remaining <= 30).length)}
                </span>
              </div>
              <div className="footer-stat">
                <span className="footer-label">Expiring in 60 days:</span>
                <span className="footer-value warning">
                  {formatNumber(membersList.filter(m => m.days_remaining > 30 && m.days_remaining <= 60).length)}
                </span>
              </div>
              <div className="footer-stat">
                <span className="footer-label">Pending Cancellations:</span>
                <span className="footer-value">{formatNumber(data.summary?.pending_cancellations)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select date range and click Generate Report to view membership analytics.</div>
      )}
    </div>
  );
}