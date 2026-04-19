// components/MembershipReport.jsx
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
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

const DONATION_TYPE_COLORS = {
  General: "#3b82f6",
  Conservation: "#10b981",
  Scholarship: "#8b5cf6",
  Exhibition: "#f59e0b",
  "One-time": "#6b7280"
};

const TRANSACTION_TYPE_COLORS = {
  New: "#10b981",
  Renewal: "#3b82f6",
  Upgrade: "#f59e0b"
};

export default function MembershipReport() {
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
      
      const response = await fetch(`${BASE_URL}/reports/membership-donor?${params}`);
      const result = await response.json();
      setData(result);
      setHasGenerated(true);
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
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  // Pagination for top donors
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentDonors = data?.topDonors?.slice(indexOfFirstRow, indexOfLastRow) || [];
  const totalPages = Math.ceil((data?.topDonors?.length || 0) / rowsPerPage);

  // Prepare chart data
  const pieData = data?.membershipLevels?.map(level => ({
    name: level.membership_level,
    value: level.count,
    color: CHART_COLORS[level.membership_level] || "#c5a028"
  })) || [];

  const donationPieData = data?.donationByType?.map(type => ({
    name: type.donation_type,
    value: parseFloat(type.total),
    color: DONATION_TYPE_COLORS[type.donation_type] || "#c5a028"
  })) || [];

  return (
    <div className="membership-report">
      <div className="report-header">
        <h2>👥 Membership & Donor Report</h2>
        <p>Track member engagement, donation trends, and community support</p>
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
              </div>
              <div className="summary-card">
                <div className="summary-label">Avg Membership</div>
                <div className="summary-value">{data.summary?.avg_membership_days || 0} days</div>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total Donations</div>
                <div className="summary-value">{formatCurrency(data.donationSummary?.total_donations)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Unique Donors</div>
                <div className="summary-value">{formatNumber(data.donationSummary?.unique_donors)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Avg Donation</div>
                <div className="summary-value">{formatCurrency(data.donationSummary?.avg_donation)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Donations Count</div>
                <div className="summary-value">{formatNumber(data.donationSummary?.total_donations_count)}</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Membership Level Distribution */}
            <div className="chart-container">
              <h4>📊 Membership Level Distribution</h4>
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

            {/* Donation by Type */}
            <div className="chart-container">
              <h4>💰 Donations by Type</h4>
              {donationPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={donationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {donationPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No donation data</div>
              )}
            </div>
          </div>

          {/* Donation Trends Chart */}
          {data.donationTrends && data.donationTrends.length > 0 && (
            <div className="chart-container full-width">
              <h4>📈 Donation Trends Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.donationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#c5a028" strokeWidth={2} dot={{ fill: "#c5a028", r: 4 }} name="Donations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transaction Type Breakdown */}
          {data.membershipTransactions && data.membershipTransactions.length > 0 && (
            <div className="chart-container">
              <h4>🔄 Membership Transactions</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.membershipTransactions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="transaction_type" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total_amount" fill="#c5a028" radius={[4, 4, 0, 0]}>
                    {data.membershipTransactions.map((entry, i) => (
                      <Cell key={i} fill={TRANSACTION_TYPE_COLORS[entry.transaction_type] || "#c5a028"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Donors Table */}
          {data.topDonors && data.topDonors.length > 0 && (
            <div className="data-section">
              <div className="data-header">
                <h3>🏆 Top Donors</h3>
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
                      <th>Donor</th>
                      <th>Location</th>
                      <th>Membership</th>
                      <th>Donation Count</th>
                      <th>Total Donated</th>
                      <th>Last Donation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDonors.map((donor, idx) => (
                      <tr key={idx}>
                        <td className="title-cell">{donor.name}</td>
                        <td>{donor.city}, {donor.state}</td>
                        <td>
                          <span className={`membership-badge ${donor.membership_level ? `badge-${donor.membership_level.toLowerCase().replace(' ', '-')}` : 'badge-none'}`}>
                            {donor.membership_level || "Non-Member"}
                          </span>
                        </td>
                        <td>{donor.donation_count}</td>
                        <td className="amount-cell">{formatCurrency(donor.total_donated)}</td>
                        <td>{formatDate(donor.last_donation_date)}</td>
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

          {/* Recent Membership Activity */}
          {data.recentActivity && data.recentActivity.length > 0 && (
            <div className="data-section">
              <div className="data-header">
                <h3>📋 Recent Membership Activity</h3>
              </div>
              <div className="table-container small">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Level</th>
                      <th>Transaction Type</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((activity, idx) => (
                      <tr key={idx}>
                        <td className="title-cell">{activity.member_name}</td>
                        <td>
                          <span className={`membership-badge ${activity.membership_level ? `badge-${activity.membership_level.toLowerCase().replace(' ', '-')}` : 'badge-none'}`}>
                            {activity.membership_level}
                          </span>
                        </td>
                        <td>
                          <span className={`transaction-badge ${activity.transaction_type?.toLowerCase()}`}>
                            {activity.transaction_type}
                          </span>
                        </td>
                        <td>{formatDate(activity.transaction_date)}</td>
                        <td className="amount-cell">{formatCurrency(activity.amount)}</td>
                        <td>{activity.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select date range and click Generate Report to view membership and donor analytics.</div>
      )}
    </div>
  );
}