import { useState, useEffect } from "react";
import "../styles/ReportsPanel.css";
import { exportToCSV, exportToJSON, printReport } from "../utils/exportUtils";

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState("revenue");
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // ============ COMMON FILTERS ============
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // ============ REVENUE REPORT FILTERS ============
  const [revenueType, setRevenueType] = useState("all");
  const [revenuePaymentMethod, setRevenuePaymentMethod] = useState("");
  const [revenueMinAmount, setRevenueMinAmount] = useState("");
  const [revenueMaxAmount, setRevenueMaxAmount] = useState("");
  const [revenueCustomer, setRevenueCustomer] = useState("");
  
  // ============ ART COLLECTION FILTERS ============
  const [artArtistId, setArtArtistId] = useState("");
  const [artStartYear, setArtStartYear] = useState("");
  const [artEndYear, setArtEndYear] = useState("");
  const [artStatus, setArtStatus] = useState("");
  const [artMedium, setArtMedium] = useState("");
  const [artMinValue, setArtMinValue] = useState("");
  const [artMaxValue, setArtMaxValue] = useState("");
  const [artExhibition, setArtExhibition] = useState("");
  const [artSearchTitle, setArtSearchTitle] = useState("");
  
  // ============ VISITOR ANALYTICS FILTERS ============
  const [visitorMembershipLevel, setVisitorMembershipLevel] = useState("");
  const [visitorTicketType, setVisitorTicketType] = useState("");
  const [visitorMinVisits, setVisitorMinVisits] = useState("");
  const [visitorMaxVisits, setVisitorMaxVisits] = useState("");
  const [visitorLocation, setVisitorLocation] = useState("");
  const [visitorMemberOnly, setVisitorMemberOnly] = useState(false);
  const [visitorExpiringSoon, setVisitorExpiringSoon] = useState(false);
  
  // ============ GIFT SHOP FILTERS ============
  const [giftCategory, setGiftCategory] = useState("");
  const [giftMinPrice, setGiftMinPrice] = useState("");
  const [giftMaxPrice, setGiftMaxPrice] = useState("");
  const [giftPaymentMethod, setGiftPaymentMethod] = useState("");
  const [giftCustomer, setGiftCustomer] = useState("");
  
  // ============ SORTING ============
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // ============ DROPDOWN OPTIONS ============
  const [artistsList, setArtistsList] = useState([]);
  const [mediumsList, setMediumsList] = useState([]);
  const [statusesList, setStatusesList] = useState([]);
  const [ticketTypesList, setTicketTypesList] = useState([]);
  const [membershipLevelsList, setMembershipLevelsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);

  const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://museum-backend-lck5.onrender.com';

  // ============ LOAD DROPDOWN OPTIONS ============
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const artists = await fetch(`${BASE_URL}/reports/filter-options?type=artists`).then(r => r.json()).catch(() => []);
        const mediums = await fetch(`${BASE_URL}/reports/filter-options?type=mediums`).then(r => r.json()).catch(() => []);
        const statuses = await fetch(`${BASE_URL}/reports/filter-options?type=statuses`).then(r => r.json()).catch(() => []);
        const ticketTypes = await fetch(`${BASE_URL}/reports/filter-options?type=ticket-types`).then(r => r.json()).catch(() => []);
        const membershipLevels = await fetch(`${BASE_URL}/reports/filter-options?type=membership-levels`).then(r => r.json()).catch(() => []);
        const categories = await fetch(`${BASE_URL}/reports/filter-options?type=categories`).then(r => r.json()).catch(() => []);
        
        setArtistsList(Array.isArray(artists) ? artists : []);
        setMediumsList(Array.isArray(mediums) ? mediums : []);
        setStatusesList(Array.isArray(statuses) ? statuses : []);
        setTicketTypesList(Array.isArray(ticketTypes) ? ticketTypes : []);
        setMembershipLevelsList(Array.isArray(membershipLevels) ? membershipLevels : []);
        setCategoriesList(Array.isArray(categories) ? categories : []);
        setPaymentMethodsList(["Card", "Cash", "Mobile", "Check"]);
      } catch (err) {
        console.error("Failed to load dropdown options:", err);
      }
    };
    loadDropdowns();
  }, []);

  // ============ LOAD DATA ============
  useEffect(() => {
    loadReportData();
  }, [activeReport]);

  // ============ APPLY FILTERS ============
  useEffect(() => {
    if (reportData.length > 0) {
      applyFilters();
    }
  }, [reportData, startDate, endDate, revenueType, revenuePaymentMethod, revenueMinAmount, revenueMaxAmount, revenueCustomer,
      artArtistId, artStartYear, artEndYear, artStatus, artMedium, artMinValue, artMaxValue, artExhibition, artSearchTitle,
      visitorMembershipLevel, visitorTicketType, visitorMinVisits, visitorMaxVisits, visitorLocation, visitorMemberOnly, visitorExpiringSoon,
      giftCategory, giftMinPrice, giftMaxPrice, giftPaymentMethod, giftCustomer]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let url = "";
      if (activeReport === "revenue") {
        url = `${BASE_URL}/reports/revenue-data?`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (revenueType) url += `type=${revenueType}`;
      } else if (activeReport === "artCollection") {
        url = `${BASE_URL}/reports/art-collection-data?`;
        if (artArtistId) url += `artistId=${artArtistId}&`;
        if (artStartYear) url += `startYear=${artStartYear}&`;
        if (artEndYear) url += `endYear=${artEndYear}&`;
        if (artStatus) url += `status=${artStatus}&`;
        if (artMedium) url += `medium=${artMedium}`;
      } else if (activeReport === "visitorAnalytics") {
        url = `${BASE_URL}/reports/visitor-analytics?`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (visitorMembershipLevel) url += `membershipLevel=${visitorMembershipLevel}&`;
        if (visitorTicketType) url += `ticketType=${visitorTicketType}`;
      } else if (activeReport === "giftShop") {
        url = `${BASE_URL}/reports/giftshop-data?`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (giftCategory) url += `category=${giftCategory}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (activeReport === "visitorAnalytics") {
        setReportData(data.visitors || []);
        setSummary(data.summary);
      } else if (activeReport === "artCollection") {
        setReportData(data.data || []);
        setSummary(data.summary);
      } else if (activeReport === "giftShop") {
        setReportData(data.data || []);
        setSummary(data.summary);
      } else {
        setReportData(data || []);
      }
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reportData];
    
    if (activeReport === "revenue") {
      if (revenuePaymentMethod) {
        filtered = filtered.filter(item => item.payment_method === revenuePaymentMethod);
      }
      if (revenueMinAmount) {
        filtered = filtered.filter(item => (item.amount || 0) >= parseFloat(revenueMinAmount));
      }
      if (revenueMaxAmount) {
        filtered = filtered.filter(item => (item.amount || 0) <= parseFloat(revenueMaxAmount));
      }
      if (revenueCustomer) {
        filtered = filtered.filter(item => 
          item.customer_name?.toLowerCase().includes(revenueCustomer.toLowerCase())
        );
      }
    } else if (activeReport === "artCollection") {
      if (artMinValue) {
        filtered = filtered.filter(item => (item.insurance_value || 0) >= parseFloat(artMinValue));
      }
      if (artMaxValue) {
        filtered = filtered.filter(item => (item.insurance_value || 0) <= parseFloat(artMaxValue));
      }
      if (artExhibition) {
        filtered = filtered.filter(item => item.current_exhibition?.toLowerCase().includes(artExhibition.toLowerCase()));
      }
      if (artSearchTitle) {
        filtered = filtered.filter(item => item.title?.toLowerCase().includes(artSearchTitle.toLowerCase()));
      }
    } else if (activeReport === "visitorAnalytics") {
      if (visitorMinVisits) {
        filtered = filtered.filter(item => (item.total_visits || 0) >= parseInt(visitorMinVisits));
      }
      if (visitorMaxVisits) {
        filtered = filtered.filter(item => (item.total_visits || 0) <= parseInt(visitorMaxVisits));
      }
      if (visitorLocation) {
        filtered = filtered.filter(item => 
          `${item.city} ${item.state}`.toLowerCase().includes(visitorLocation.toLowerCase())
        );
      }
      if (visitorMemberOnly) {
        filtered = filtered.filter(item => item.is_member === "Yes");
      }
      if (visitorExpiringSoon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        filtered = filtered.filter(item => 
          item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow
        );
      }
    } else if (activeReport === "giftShop") {
      if (giftMinPrice) {
        filtered = filtered.filter(item => (item.price || 0) >= parseFloat(giftMinPrice));
      }
      if (giftMaxPrice) {
        filtered = filtered.filter(item => (item.price || 0) <= parseFloat(giftMaxPrice));
      }
      if (giftPaymentMethod) {
        filtered = filtered.filter(item => item.payment_method === giftPaymentMethod);
      }
      if (giftCustomer) {
        filtered = filtered.filter(item => 
          item.customer_name?.toLowerCase().includes(giftCustomer.toLowerCase())
        );
      }
    }
    
    setFilteredData(filtered);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    
    const sorted = [...filteredData].sort((a, b) => {
      let valA = a[column] || "";
      let valB = b[column] || "";
      if (typeof valA === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    setFilteredData(sorted);
  };

  const exportData = (format) => {
    if (format === "csv") {
      exportToCSV(filteredData, `${activeReport}_report.csv`);
    } else if (format === "json") {
      exportToJSON(filteredData, `${activeReport}_report.json`);
    } else if (format === "print") {
      printReport("report-print-content", `${activeReport.toUpperCase()} Report`);
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setRevenueType("all");
    setRevenuePaymentMethod("");
    setRevenueMinAmount("");
    setRevenueMaxAmount("");
    setRevenueCustomer("");
    setArtArtistId("");
    setArtStartYear("");
    setArtEndYear("");
    setArtStatus("");
    setArtMedium("");
    setArtMinValue("");
    setArtMaxValue("");
    setArtExhibition("");
    setArtSearchTitle("");
    setVisitorMembershipLevel("");
    setVisitorTicketType("");
    setVisitorMinVisits("");
    setVisitorMaxVisits("");
    setVisitorLocation("");
    setVisitorMemberOnly(false);
    setVisitorExpiringSoon(false);
    setGiftCategory("");
    setGiftMinPrice("");
    setGiftMaxPrice("");
    setGiftPaymentMethod("");
    setGiftCustomer("");
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getColumns = () => {
    if (activeReport === "revenue") {
      return ["source", "date", "customer_name", "type", "amount", "payment_method"];
    } else if (activeReport === "artCollection") {
      return ["title", "artist_name", "creation_year", "medium", "current_display_status", "insurance_value", "current_owner", "current_exhibition"];
    } else if (activeReport === "visitorAnalytics") {
      return ["first_name", "last_name", "email", "city", "state", "total_visits", "last_visit_date", "is_member", "membership_level", "expiration_date"];
    } else if (activeReport === "giftShop") {
      return ["transaction_datetime", "customer_name", "item_name", "category", "quantity", "price", "subtotal", "payment_method"];
    }
    return [];
  };

  const columnLabels = {
    source: "Source",
    date: "Date",
    customer_name: "Customer",
    type: "Type",
    amount: "Amount",
    payment_method: "Payment",
    title: "Title",
    artist_name: "Artist",
    creation_year: "Year",
    medium: "Medium",
    current_display_status: "Status",
    insurance_value: "Value",
    current_owner: "Owner",
    current_exhibition: "Exhibition",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    city: "City",
    state: "State",
    total_visits: "Visits",
    last_visit_date: "Last Visit",
    is_member: "Member",
    membership_level: "Level",
    expiration_date: "Expires",
    transaction_datetime: "Date",
    item_name: "Item",
    category: "Category",
    quantity: "Qty",
    price: "Price",
    subtotal: "Subtotal"
  };

  const renderRevenueFilters = () => (
    <div className="filters-grid">
      <div className="filter-group">
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <label>End Date</label>
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
        <label>Payment Method</label>
        <select value={revenuePaymentMethod} onChange={(e) => setRevenuePaymentMethod(e.target.value)}>
          <option value="">All Methods</option>
          {Array.isArray(paymentMethodsList) && paymentMethodsList.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Amount Range ($)</label>
        <div className="range-inputs">
          <input type="number" placeholder="Min" value={revenueMinAmount} onChange={(e) => setRevenueMinAmount(e.target.value)} />
          <span>-</span>
          <input type="number" placeholder="Max" value={revenueMaxAmount} onChange={(e) => setRevenueMaxAmount(e.target.value)} />
        </div>
      </div>
      <div className="filter-group">
        <label>Customer Name</label>
        <input type="text" placeholder="Search by name" value={revenueCustomer} onChange={(e) => setRevenueCustomer(e.target.value)} />
      </div>
    </div>
  );

  const renderArtCollectionFilters = () => (
    <div className="filters-grid">
      <div className="filter-group">
        <label>Artist</label>
        <select value={artArtistId} onChange={(e) => setArtArtistId(e.target.value)}>
          <option value="">All Artists</option>
          {Array.isArray(artistsList) && artistsList.map(artist => (
            <option key={artist.artist_id} value={artist.artist_id}>
              {artist.first_name} {artist.last_name}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Year Range</label>
        <div className="range-inputs">
          <input type="number" placeholder="From" value={artStartYear} onChange={(e) => setArtStartYear(e.target.value)} />
          <span>-</span>
          <input type="number" placeholder="To" value={artEndYear} onChange={(e) => setArtEndYear(e.target.value)} />
        </div>
      </div>
      <div className="filter-group">
        <label>Status</label>
        <select value={artStatus} onChange={(e) => setArtStatus(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(statusesList) && statusesList.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Medium</label>
        <select value={artMedium} onChange={(e) => setArtMedium(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(mediumsList) && mediumsList.map(medium => <option key={medium} value={medium}>{medium}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Value Range ($M)</label>
        <div className="range-inputs">
          <input type="number" placeholder="Min" value={artMinValue} onChange={(e) => setArtMinValue(e.target.value)} />
          <span>-</span>
          <input type="number" placeholder="Max" value={artMaxValue} onChange={(e) => setArtMaxValue(e.target.value)} />
        </div>
      </div>
      <div className="filter-group">
        <label>Exhibition</label>
        <input type="text" placeholder="Search exhibition" value={artExhibition} onChange={(e) => setArtExhibition(e.target.value)} />
      </div>
      <div className="filter-group full-width">
        <label>Title Search</label>
        <input type="text" placeholder="Search by title..." value={artSearchTitle} onChange={(e) => setArtSearchTitle(e.target.value)} />
      </div>
    </div>
  );

  const renderVisitorFilters = () => (
    <div className="filters-grid">
      <div className="filter-group">
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <label>End Date</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <label>Membership Level</label>
        <select value={visitorMembershipLevel} onChange={(e) => setVisitorMembershipLevel(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(membershipLevelsList) && membershipLevelsList.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Ticket Type</label>
        <select value={visitorTicketType} onChange={(e) => setVisitorTicketType(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(ticketTypesList) && ticketTypesList.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Visit Count Range</label>
        <div className="range-inputs">
          <input type="number" placeholder="Min" value={visitorMinVisits} onChange={(e) => setVisitorMinVisits(e.target.value)} />
          <span>-</span>
          <input type="number" placeholder="Max" value={visitorMaxVisits} onChange={(e) => setVisitorMaxVisits(e.target.value)} />
        </div>
      </div>
      <div className="filter-group">
        <label>Location</label>
        <input type="text" placeholder="City or State" value={visitorLocation} onChange={(e) => setVisitorLocation(e.target.value)} />
      </div>
      <div className="filter-group checkbox-group">
        <label>
          <input type="checkbox" checked={visitorMemberOnly} onChange={(e) => setVisitorMemberOnly(e.target.checked)} />
          Members Only
        </label>
      </div>
      <div className="filter-group checkbox-group">
        <label>
          <input type="checkbox" checked={visitorExpiringSoon} onChange={(e) => setVisitorExpiringSoon(e.target.checked)} />
          Expiring Soon (30 days)
        </label>
      </div>
    </div>
  );

  const renderGiftShopFilters = () => (
    <div className="filters-grid">
      <div className="filter-group">
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <label>End Date</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <label>Category</label>
        <select value={giftCategory} onChange={(e) => setGiftCategory(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(categoriesList) && categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Price Range ($)</label>
        <div className="range-inputs">
          <input type="number" placeholder="Min" value={giftMinPrice} onChange={(e) => setGiftMinPrice(e.target.value)} />
          <span>-</span>
          <input type="number" placeholder="Max" value={giftMaxPrice} onChange={(e) => setGiftMaxPrice(e.target.value)} />
        </div>
      </div>
      <div className="filter-group">
        <label>Payment Method</label>
        <select value={giftPaymentMethod} onChange={(e) => setGiftPaymentMethod(e.target.value)}>
          <option value="">All</option>
          {Array.isArray(paymentMethodsList) && paymentMethodsList.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Customer Name</label>
        <input type="text" placeholder="Search by name" value={giftCustomer} onChange={(e) => setGiftCustomer(e.target.value)} />
      </div>
    </div>
  );

  const renderFilters = () => {
    return (
      <div className="filters-section">
        <div className="filters-header">
          <h4>🔍 Filters</h4>
          <button className="reset-btn" onClick={resetFilters}>Reset All Filters</button>
        </div>
        {activeReport === "revenue" && renderRevenueFilters()}
        {activeReport === "artCollection" && renderArtCollectionFilters()}
        {activeReport === "visitorAnalytics" && renderVisitorFilters()}
        {activeReport === "giftShop" && renderGiftShopFilters()}
      </div>
    );
  };

  const renderTable = () => {
    const columns = getColumns();
    if (filteredData.length === 0) {
      return <div className="no-results">No data found. Try adjusting your filters.</div>;
    }
    
    return (
      <>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} onClick={() => handleSort(col)} className="sortable">
                    {columnLabels[col] || col}
                    {sortColumn === col && (sortDirection === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => {
                    let value = row[col];
                    if (col === "amount" || col === "insurance_value" || col === "price" || col === "subtotal") {
                      value = formatCurrency(value);
                    } else if (col === "date" || col === "transaction_datetime" || col === "last_visit_date" || col === "expiration_date") {
                      value = formatDate(value);
                    } else if (col === "is_member") {
                      value = value === "Yes" ? "✅ Yes" : "❌ No";
                    }
                    return <td key={col}>{value || "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {filteredData.length} of {reportData.length} records</span>
        </div>
      </>
    );
  };

  const renderSummary = () => {
    if (!summary) return null;
    
    if (activeReport === "visitorAnalytics") {
      return (
        <div className="summary-stats">
          <div className="stat-badge">👥 Total Visitors: {formatNumber(summary.total_visitors)}</div>
          <div className="stat-badge">⭐ Members: {formatNumber(summary.total_members)}</div>
          <div className="stat-badge">📊 Total Visits: {formatNumber(summary.total_visits)}</div>
          <div className="stat-badge">📈 Avg Visits: {summary.avg_visits_per_visitor}</div>
          <div className="stat-badge">🎟️ Tickets Sold: {formatNumber(summary.total_tickets_sold)}</div>
          <div className="stat-badge">💰 Revenue: {formatCurrency(summary.total_ticket_revenue)}</div>
        </div>
      );
    } else if (activeReport === "artCollection") {
      return (
        <div className="summary-stats">
          <div className="stat-badge">🎨 Total Artworks: {formatNumber(summary.total_artworks)}</div>
          <div className="stat-badge">💰 Total Value: {formatCurrency(summary.total_value)}</div>
          <div className="stat-badge">📊 Avg Value: {formatCurrency(summary.avg_value)}</div>
          <div className="stat-badge">👨‍🎨 Artists: {formatNumber(summary.total_artists)}</div>
        </div>
      );
    } else if (activeReport === "giftShop") {
      return (
        <div className="summary-stats">
          <div className="stat-badge">🛍️ Transactions: {formatNumber(summary.total_transactions)}</div>
          <div className="stat-badge">💰 Revenue: {formatCurrency(summary.total_revenue)}</div>
          <div className="stat-badge">📊 Avg Transaction: {formatCurrency(summary.avg_transaction)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="reports-panel">
      <div className="report-buttons">
        <button className={activeReport === "revenue" ? "active" : ""} onClick={() => setActiveReport("revenue")}>
          💰 Revenue Report
        </button>
        <button className={activeReport === "artCollection" ? "active" : ""} onClick={() => setActiveReport("artCollection")}>
          🎨 Art Collection
        </button>
        <button className={activeReport === "visitorAnalytics" ? "active" : ""} onClick={() => setActiveReport("visitorAnalytics")}>
          📊 Visitor Analytics
        </button>
        <button className={activeReport === "giftShop" ? "active" : ""} onClick={() => setActiveReport("giftShop")}>
          🛍️ Gift Shop
        </button>
      </div>

      {renderFilters()}

      <div className="export-section">
        <button className="export-btn csv" onClick={() => exportData("csv")}>📊 Export CSV</button>
        <button className="export-btn json" onClick={() => exportData("json")}>📄 Export JSON</button>
        <button className="export-btn print" onClick={() => exportData("print")}>🖨️ Print Report</button>
      </div>

      {renderSummary()}

      <div className="report-display" id="report-print-content">
        <h3>
          {activeReport === "revenue" && "💰 Revenue Report"}
          {activeReport === "artCollection" && "🎨 Art Collection Report"}
          {activeReport === "visitorAnalytics" && "📊 Visitor Analytics Report"}
          {activeReport === "giftShop" && "🛍️ Gift Shop Report"}
        </h3>
        {loading ? <div className="loading">Loading...</div> : renderTable()}
      </div>

      {/* Data Queries Section */}
      <div className="queries-section">
        <h3>🔍 Data Queries</h3>
        <div className="queries-grid">
          <div className="query-card">
            <h4>🎨 Find Artworks by Artist</h4>
            <div className="query-input">
              <input type="text" placeholder="Enter artist name" id="artistName" />
              <button type="button" onClick={() => {
                const name = document.getElementById('artistName').value;
                if (name) searchByArtist(name);
              }}>Search</button>
            </div>
          </div>
          <div className="query-card">
            <h4>📅 Find Artworks by Year Range</h4>
            <div className="query-input">
              <input type="number" placeholder="Start Year" id="startYear" />
              <span>to</span>
              <input type="number" placeholder="End Year" id="endYear" />
              <button type="button" onClick={() => {
                const start = document.getElementById('startYear').value;
                const end = document.getElementById('endYear').value;
                if (start && end) searchByYearRange(start, end);
              }}>Search</button>
            </div>
          </div>
          <div className="query-card">
            <h4>🖌️ Find Artworks by Medium</h4>
            <div className="query-input">
              <input type="text" placeholder="Enter medium" id="medium" />
              <button type="button" onClick={() => {
                const medium = document.getElementById('medium').value;
                if (medium) searchByMedium(medium);
              }}>Search</button>
            </div>
          </div>
          <div className="query-card">
            <h4>💎 Top Valued Artworks</h4>
            <div className="query-input">
              <input type="number" placeholder="Number of results" id="topLimit" defaultValue="10" />
              <button type="button" onClick={() => {
                const limit = document.getElementById('topLimit').value;
                searchTopValued(limit);
              }}>Search</button>
            </div>
          </div>
        </div>

        {queryLoading && <div className="loading">Running query...</div>}
        {queryResult && (
          <div className="query-results">
            <h4>Results ({Array.isArray(queryResult) ? queryResult.length : 1} items):</h4>
            <div className="query-results-table">
              <table className="data-table">
                <thead>
                  <tr>
                    {queryResult.length > 0 && Object.keys(queryResult[0]).map(key => (
                      <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key}>
                          {typeof value === 'number' && (key.includes('value') || key.includes('price')) 
                            ? formatCurrency(value) 
                            : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Query functions
  async function searchByArtist(artistName) {
    if (!artistName) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-artist?name=${encodeURIComponent(artistName)}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setQueryResult({ error: err.message });
    } finally {
      setQueryLoading(false);
    }
  }

  async function searchByYearRange(startYear, endYear) {
    if (!startYear || !endYear) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-year?start=${startYear}&end=${endYear}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setQueryResult({ error: err.message });
    } finally {
      setQueryLoading(false);
    }
  }

  async function searchByMedium(medium) {
    if (!medium) return;
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/artworks-by-medium?medium=${encodeURIComponent(medium)}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setQueryResult({ error: err.message });
    } finally {
      setQueryLoading(false);
    }
  }

  async function searchTopValued(limit = 10) {
    setQueryLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/queries/top-valued-artworks?limit=${limit}`);
      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setQueryResult({ error: err.message });
    } finally {
      setQueryLoading(false);
    }
  }
}