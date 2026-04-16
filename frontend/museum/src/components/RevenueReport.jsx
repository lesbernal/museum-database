// components/RevenueReport.jsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import "../styles/RevenueReport.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CHART_COLORS = ["#c5a028", "#1d4ed8", "#065f46", "#92400e"];

export default function RevenueReport() {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [revenueType, setRevenueType] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Applied filters
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedRevenueType, setAppliedRevenueType] = useState("all");
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState("");
  const [appliedMinAmount, setAppliedMinAmount] = useState("");
  const [appliedMaxAmount, setAppliedMaxAmount] = useState("");
  const [appliedCustomerName, setAppliedCustomerName] = useState("");

  const [paymentMethodsList] = useState(["Credit Card", "Debit Card"]);

  useEffect(() => {
    if (hasGenerated) loadReportData();
  }, [appliedStartDate, appliedEndDate, appliedRevenueType, appliedPaymentMethod, appliedMinAmount, appliedMaxAmount, appliedCustomerName, hasGenerated]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let dataUrl = `${BASE_URL}/reports/revenue-data?`;
      if (appliedStartDate) dataUrl += `startDate=${appliedStartDate}&`;
      if (appliedEndDate) dataUrl += `endDate=${appliedEndDate}&`;
      if (appliedRevenueType && appliedRevenueType !== "all") dataUrl += `type=${appliedRevenueType}`;

      let summaryUrl = `${BASE_URL}/reports/revenue-summary?`;
      if (appliedStartDate) summaryUrl += `startDate=${appliedStartDate}&`;
      if (appliedEndDate) summaryUrl += `endDate=${appliedEndDate}&`;

      const [dataResponse, summaryResponse] = await Promise.all([
        fetch(dataUrl), fetch(summaryUrl)
      ]);

      const data = await dataResponse.json();
      const summaryData = await summaryResponse.json();

      const dataArray = Array.isArray(data) ? data : [];
      setReportData(dataArray);
      setFilteredData(dataArray);
      setSummary({
        totalRevenue:      summaryData.totalRevenue      || 0,
        totalTransactions: summaryData.totalTransactions || 0,
        avgTransaction:    summaryData.avgTransaction    || 0,
        ticketRevenue:     summaryData.ticketRevenue     || 0,
        donationRevenue:   summaryData.donationRevenue   || 0,
        cafeRevenue:       summaryData.cafeRevenue       || 0,
        giftShopRevenue:   summaryData.giftShopRevenue   || 0,
        largestDonation: 0,
        largestTicket:   0,
      });
    } catch (err) {
      console.error("Failed to load revenue data:", err);
      setReportData([]);
      setFilteredData([]);
      setSummary({ totalRevenue: 0, totalTransactions: 0, avgTransaction: 0, ticketRevenue: 0, donationRevenue: 0, cafeRevenue: 0, giftShopRevenue: 0, largestDonation: 0, largestTicket: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Start Date cannot be after End Date.");
      return;
    }
    setAppliedStartDate(startDate || "");
    setAppliedEndDate(endDate || "");
    setAppliedRevenueType(revenueType);
    setAppliedPaymentMethod(paymentMethod);
    setAppliedMinAmount(minAmount);
    setAppliedMaxAmount(maxAmount);
    setAppliedCustomerName(customerName);
    setHasGenerated(true);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStartDate(""); setEndDate(""); setRevenueType("all");
    setPaymentMethod(""); setMinAmount(""); setMaxAmount(""); setCustomerName("");
    setAppliedStartDate(""); setAppliedEndDate(""); setAppliedRevenueType("all");
    setAppliedPaymentMethod(""); setAppliedMinAmount(""); setAppliedMaxAmount(""); setAppliedCustomerName("");
    setHasGenerated(false);
    setReportData([]); setFilteredData([]);
    setSummary({ totalRevenue: 0, totalTransactions: 0, avgTransaction: 0, ticketRevenue: 0, donationRevenue: 0, cafeRevenue: 0, giftShopRevenue: 0, largestDonation: 0, largestTicket: 0 });
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastRow  = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows     = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages      = Math.ceil(filteredData.length / rowsPerPage) || 1;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector('.table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "$0.00";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(numValue);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0";
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${month}/${day}/${year}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Chart data derived from summary
  const barChartData = summary ? [
    { name: "Tickets",   revenue: parseFloat(summary.ticketRevenue)   || 0 },
    { name: "Donations", revenue: parseFloat(summary.donationRevenue) || 0 },
    { name: "Cafe",      revenue: parseFloat(summary.cafeRevenue)     || 0 },
    { name: "Gift Shop", revenue: parseFloat(summary.giftShopRevenue) || 0 },
  ] : [];

  const pieChartData = summary ? [
    { name: "Tickets",   value: parseFloat(summary.ticketRevenue)   || 0 },
    { name: "Donations", value: parseFloat(summary.donationRevenue) || 0 },
    { name: "Cafe",      value: parseFloat(summary.cafeRevenue)     || 0 },
    { name: "Gift Shop", value: parseFloat(summary.giftShopRevenue) || 0 },
  ].filter(d => d.value > 0) : [];

  const totalRevenue = parseFloat(summary?.totalRevenue) || 0;

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
            <label>Start Date (Optional)</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>End Date (Optional)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Transaction Type</label>
            <select value={revenueType} onChange={(e) => setRevenueType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="ticket">Tickets</option>
              <option value="donation">Donations</option>
              <option value="cafe">Cafe</option>
              <option value="gift">Gift Shop</option>
            </select>
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
              <div className="summary-value">{formatNumber(summary.totalTransactions)}</div>
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

          {/* ── CHARTS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>

            {/* Bar Chart — Revenue by Source */}
            <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: 4 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Revenue by Source
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" radius={[2, 2, 0, 0]}>
                    {barChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart — Revenue Distribution */}
            <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: 4 }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Revenue Distribution
              </h4>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                  No revenue data to display
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {hasGenerated && filteredData.length > 0 && (
        <div className="data-section">
          <div className="data-header">
            <h3>Transaction Details</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Customer</th>
                  <th>Type/Item</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => {
                  let typeValue = "—";
                  if (row.type && row.type !== "null")       typeValue = row.type;
                  else if (row.donation_type)                typeValue = row.donation_type;
                  else if (row.item_name)                    typeValue = row.item_name;
                  else if (row.source === "Cafe")            typeValue = "Cafe Purchase";
                  else if (row.source === "Gift Shop")       typeValue = "Gift Purchase";
                  else if (row.source === "Ticket")          typeValue = "Ticket Sale";
                  else if (row.source === "Donation")        typeValue = "Donation";
                  return (
                    <tr key={idx}>
                      <td>{formatDate(row.date)}</td>
                      <td>
                        <span className={`source-badge ${row.source?.toLowerCase().replace(' ', '-')}`}>
                          {row.source || "Unknown"}
                        </span>
                      </td>
                      <td>{row.customer_name || "—"}</td>
                      <td>{typeValue}</td>
                      <td className="amount-cell">{formatCurrency(row.amount)}</td>
                    </tr>
                  );
                })}
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

      {hasGenerated && filteredData.length === 0 && !loading && (
        <div className="no-results">No transactions found. Try adjusting your filters.</div>
      )}
      {loading && <div className="loading">Loading report data...</div>}
    </div>
  );
}