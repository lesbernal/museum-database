// components/RevenueReport.jsx
import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line
} from "recharts";
import "../styles/RevenueReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CHART_COLORS = ["#c5a028", "#1d4ed8", "#065f46", "#92400e"];

export default function RevenueReport() {
  // Simplified state - no duplicate "applied" versions
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Filters - single source of truth
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    revenueType: "all",
    paymentMethod: "",
    minAmount: "",
    maxAmount: "",
    customerName: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Derived insights (calculated from data)
  const insights = useMemo(() => {
    if (!reportData.length) return null;

    // Calculate daily revenue trend
    const dailyRevenue = {};
    reportData.forEach(row => {
      const date = row.date?.split('T')[0];
      if (date) {
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(row.amount || 0);
      }
    });

    const trendData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days

    // Calculate top customers
    const customerSpending = {};
    reportData.forEach(row => {
      if (row.customer_name && row.customer_name !== "—") {
        customerSpending[row.customer_name] = (customerSpending[row.customer_name] || 0) + parseFloat(row.amount || 0);
      }
    });
    const topCustomers = Object.entries(customerSpending)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Calculate payment method breakdown
    const paymentBreakdown = {};
    reportData.forEach(row => {
      if (row.payment_method) {
        paymentBreakdown[row.payment_method] = (paymentBreakdown[row.payment_method] || 0) + parseFloat(row.amount || 0);
      }
    });

    // Calculate average donation amount (excluding non-donations)
    const donations = reportData.filter(row => row.source === "Donation");
    const avgDonation = donations.length > 0 
      ? donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) / donations.length 
      : 0;


    const dayOfWeekCount = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
    };
    reportData.forEach(row => {
      if (row.day_of_week) {
        dayOfWeekCount[row.day_of_week] = (dayOfWeekCount[row.day_of_week] || 0) + 1;
      }
    });
    const dayOfWeekData = Object.entries(dayOfWeekCount)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => {
        const order = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
        return order[a.day] - order[b.day];
      });

    // Best selling items (cafe + gift shop)
    const itemSales = {};
    reportData.forEach(row => {
      if ((row.source === "Cafe" || row.source === "Gift Shop") && row.item_name) {
        itemSales[row.item_name] = (itemSales[row.item_name] || 0) + (row.quantity || 1);
      }
    });
    const topItems = Object.entries(itemSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      trendData,
      topCustomers,
      paymentBreakdown,
      avgDonation,
      topItems,
      dayOfWeekData,
      totalDays: Object.keys(dailyRevenue).length,
      avgDailyRevenue: Object.values(dailyRevenue).reduce((a, b) => a + b, 0) / Object.keys(dailyRevenue).length || 0
    };
  }, [reportData]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.revenueType && filters.revenueType !== "all") params.append('type', filters.revenueType);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.customerName) params.append('customerName', filters.customerName);

      const dataUrl = `${BASE_URL}/reports/revenue-data?${params}`;
      const summaryUrl = `${BASE_URL}/reports/revenue-summary?${params}`;

      const [dataResponse, summaryResponse] = await Promise.all([
        fetch(dataUrl), fetch(summaryUrl)
      ]);

      const data = await dataResponse.json();
      const summaryData = await summaryResponse.json();

      const dataArray = Array.isArray(data) ? data : [];
      setReportData(dataArray);
      setSummary({
        totalRevenue: summaryData.totalRevenue || 0,
        totalTransactions: summaryData.totalTransactions || 0,
        avgTransaction: summaryData.avgTransaction || 0,
        ticketRevenue: summaryData.ticketRevenue || 0,
        donationRevenue: summaryData.donationRevenue || 0,
        cafeRevenue: summaryData.cafeRevenue || 0,
        giftShopRevenue: summaryData.giftShopRevenue || 0,
      });
    } catch (err) {
      console.error("Failed to load revenue data:", err);
      setReportData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      alert("Start Date cannot be after End Date.");
      return;
    }
    setHasGenerated(true);
    setCurrentPage(1);
    loadReportData();
  };

  const resetFilters = () => {
    setFilters({
      startDate: "", endDate: "", revenueType: "all",
      paymentMethod: "", minAmount: "", maxAmount: "", customerName: ""
    });
    setHasGenerated(false);
    setReportData([]);
    setSummary(null);
    setCurrentPage(1);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage) || 1;

  const formatCurrency = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTierClass = (tier) => {
    if (!tier) return "";
    if (tier.includes("High") || tier.includes("Major")) return "tier-high";
    if (tier.includes("Medium") || tier.includes("Significant") || tier.includes("Moderate")) return "tier-medium";
    if (tier.includes("Low") || tier.includes("Small")) return "tier-low";
    return "tier-standard";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector('.table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Chart data
  const barChartData = summary ? [
    { name: "Tickets", revenue: parseFloat(summary.ticketRevenue) || 0 },
    { name: "Donations", revenue: parseFloat(summary.donationRevenue) || 0 },
    { name: "Cafe", revenue: parseFloat(summary.cafeRevenue) || 0 },
    { name: "Gift Shop", revenue: parseFloat(summary.giftShopRevenue) || 0 },
  ] : [];

  const pieChartData = summary ? [
    { name: "Tickets", value: parseFloat(summary.ticketRevenue) || 0 },
    { name: "Donations", value: parseFloat(summary.donationRevenue) || 0 },
    { name: "Cafe", value: parseFloat(summary.cafeRevenue) || 0 },
    { name: "Gift Shop", value: parseFloat(summary.giftShopRevenue) || 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="revenue-report">
      <div className="report-header">
        <h2>Revenue Report</h2>
        <p>Track ticket sales, donations, cafe, and gift shop revenue</p>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Transaction Type</label>
            <select value={filters.revenueType} onChange={(e) => updateFilter('revenueType', e.target.value)}>
              <option value="all">All Types</option>
              <option value="ticket">Tickets</option>
              <option value="donation">Donations</option>
              <option value="cafe">Cafe</option>
              <option value="gift">Gift Shop</option>
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Min Amount ($)</label>
            <input type="number" step="0.01" placeholder="0.00" value={filters.minAmount} onChange={(e) => updateFilter('minAmount', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Max Amount ($)</label>
            <input type="number" step="0.01" placeholder="9999.99" value={filters.maxAmount} onChange={(e) => updateFilter('maxAmount', e.target.value)} />
          </div>
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
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value">{formatCurrency(summary.totalRevenue)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Transactions</div>
              <div className="summary-value">{summary.totalTransactions.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Average Transaction</div>
              <div className="summary-value">{formatCurrency(summary.avgTransaction)}</div>
            </div>
          </div>

          <div className="breakdown-grid">
            <div className="breakdown-item ticket">
              <span className="breakdown-label">Ticket Sales</span>
              <span className="breakdown-value">{formatCurrency(summary.ticketRevenue)}</span>
            </div>
            <div className="breakdown-item donation">
              <span className="breakdown-label">Donations</span>
              <span className="breakdown-value">{formatCurrency(summary.donationRevenue)}</span>
            </div>
            <div className="breakdown-item cafe">
              <span className="breakdown-label">Cafe Sales</span>
              <span className="breakdown-value">{formatCurrency(summary.cafeRevenue)}</span>
            </div>
            <div className="breakdown-item giftshop">
              <span className="breakdown-label">Gift Shop</span>
              <span className="breakdown-value">{formatCurrency(summary.giftShopRevenue)}</span>
            </div>
          </div>

          {/* NEW: Insights Cards */}
          {insights && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#1a1a2e" }}> Key Insights</h3>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Average Daily Revenue</div>
                  <div className="summary-value">{formatCurrency(insights.avgDailyRevenue)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Average Donation</div>
                  <div className="summary-value">{formatCurrency(insights.avgDonation)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Reporting Period</div>
                  <div className="summary-value">{insights.totalDays} days</div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Trend Chart - NEW */}
          {insights?.trendData.length > 0 && (
            <div style={{ marginTop: "1.5rem", background: "white", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Revenue Trend (Last 7 Days)
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={insights.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#c5a028" strokeWidth={2} dot={{ fill: "#c5a028", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two-column charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            {/* Bar Chart */}
            <div style={{ background: "white", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Revenue by Source
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {barChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transactions by Day of Week Chart */}
            <div style={{ background: "white", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Transactions by Day of Week
              </h4>
              {insights?.dayOfWeekData && insights.dayOfWeekData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={insights.dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Bar dataKey="count" fill="#c5a028" radius={[4, 4, 0, 0]} name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                  No data to display
                </div>
              )}
            </div>
          </div>

          {/* NEW: Top Customers & Best Sellers */}
          {(insights?.topCustomers.length > 0 || insights?.topItems.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
              {insights.topCustomers.length > 0 && (
                <div style={{ background: "white", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 8 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                     Top Customers
                  </h4>
                  <table style={{ width: "100%", fontSize: "0.875rem" }}>
                    <tbody>
                      {insights.topCustomers.map((customer, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.5rem 0" }}>{i + 1}. {customer.name}</td>
                          <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 600 }}>{formatCurrency(customer.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {insights.topItems.length > 0 && (
                <div style={{ background: "white", border: "1px solid #e5e5e5", padding: "1.25rem", borderRadius: 8 }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    Best Selling Items
                  </h4>
                  <table style={{ width: "100%", fontSize: "0.875rem" }}>
                    <tbody>
                      {insights.topItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.5rem 0" }}>{i + 1}. {item.name}</td>
                          <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 600 }}>{item.quantity} sold</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      {hasGenerated && reportData.length > 0 && (
        <div className="data-section">
          <div className="data-header">
            <h3>Transaction Details</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Customer Type</th>
                  <th>Amount</th>
                  <th>Tier</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.source_with_icon || row.source}</td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.customer_name || "—"}</td>
                    <td>{row.type || "—"}</td>
                    <td>
                      <span className={`customer-badge ${row.customer_type === 'Member' ? 'badge-member' : 'badge-nonmember'}`}>
                        {row.customer_type || "—"}
                      </span>
                    </td>
                    <td className="amount-cell">{formatCurrency(row.amount)}</td>
                    <td>
                      <span className={`tier-badge ${getTierClass(row.revenue_tier)}`}>
                        {row.revenue_tier || "—"}
                      </span>
                    </td>
                    <td>{row.payment_method || "—"}</td>
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
              <div className="rows-per-page">
                <span>Show:</span>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasGenerated && reportData.length === 0 && !loading && (
        <div className="no-results">No transactions found. Try adjusting your filters.</div>
      )}

      {!hasGenerated && !loading && (
        <div className="no-results">Select date range and click Generate Report to view revenue analytics.</div>
      )}
      
      {loading && <div className="loading">Loading report data...</div>}
    </div>
  );
}