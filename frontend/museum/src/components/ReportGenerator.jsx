import { useState } from "react";
import "../styles/ReportGenerator.css";

export default function ReportGenerator({ reportType, onGenerate, onExport, isGenerating }) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    dataTypes: [],
    groupBy: "",
    sortBy: "",
    limit: ""
  });

  const [selectedFormat, setSelectedFormat] = useState("csv");

  // Available data types for each report
  const getDataTypes = () => {
    switch(reportType) {
      case "revenue":
        return [
          { id: "tickets", label: "Ticket Sales", checked: true },
          { id: "donations", label: "Donations", checked: true },
          { id: "cafe", label: "Cafe Sales", checked: false },
          { id: "giftshop", label: "Gift Shop Sales", checked: false }
        ];
      case "artCollection":
        return [
          { id: "artworks", label: "Artwork Details", checked: true },
          { id: "artists", label: "Artist Information", checked: true },
          { id: "exhibitions", label: "Exhibition History", checked: false },
          { id: "provenance", label: "Ownership History", checked: false }
        ];
      case "visitorAnalytics":
        return [
          { id: "demographics", label: "Visitor Demographics", checked: true },
          { id: "tickets", label: "Ticket Types", checked: true },
          { id: "attendance", label: "Attendance Trends", checked: true },
          { id: "events", label: "Event Participation", checked: false },
          { id: "members", label: "Member Statistics", checked: false }
        ];
      default:
        return [];
    }
  };

  const [selectedDataTypes, setSelectedDataTypes] = useState(getDataTypes());

  const handleDataTypeToggle = (id) => {
    setSelectedDataTypes(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    const selectedTypes = selectedDataTypes.filter(t => t.checked).map(t => t.id);
    onGenerate({ filters, dataTypes: selectedTypes, format: selectedFormat });
  };

  const groupByOptions = {
    revenue: ["None", "Day", "Week", "Month", "Year", "Payment Method", "Ticket Type"],
    artCollection: ["None", "Artist", "Status", "Medium", "Century"],
    visitorAnalytics: ["None", "Day", "Week", "Month", "Membership Level", "Ticket Type"]
  };

  return (
    <div className="report-generator">
      <div className="generator-header">
        <h3>📄 Report Configuration</h3>
        <p>Select what data to include and how to filter it</p>
      </div>

      <div className="generator-body">
        {/* Data Type Selection */}
        <div className="generator-section">
          <label className="section-label">📋 Data to Include</label>
          <div className="data-types-grid">
            {selectedDataTypes.map(type => (
              <label key={type.id} className="data-type-checkbox">
                <input
                  type="checkbox"
                  checked={type.checked}
                  onChange={() => handleDataTypeToggle(type.id)}
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="generator-section">
          <label className="section-label">📅 Date Range</label>
          <div className="date-range">
            <div className="filter-input">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="filter-input">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Group By */}
        <div className="generator-section">
          <label className="section-label">📊 Group By</label>
          <select
            value={filters.groupBy}
            onChange={(e) => handleFilterChange("groupBy", e.target.value)}
          >
            {groupByOptions[reportType]?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="generator-section">
          <label className="section-label">🔽 Sort By</label>
          <div className="sort-row">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="sort-field"
            >
              <option value="">None</option>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="name">Name</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="sort-order"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>

        {/* Limit Results */}
        <div className="generator-section">
          <label className="section-label">🔢 Limit Results</label>
          <input
            type="number"
            placeholder="All results"
            value={filters.limit}
            onChange={(e) => handleFilterChange("limit", e.target.value)}
            className="limit-input"
          />
        </div>

        {/* Export Format */}
        <div className="generator-section">
          <label className="section-label">💾 Export Format</label>
          <div className="format-buttons">
            <button
              className={`format-btn ${selectedFormat === "csv" ? "active" : ""}`}
              onClick={() => setSelectedFormat("csv")}
            >
              📊 CSV
            </button>
            <button
              className={`format-btn ${selectedFormat === "json" ? "active" : ""}`}
              onClick={() => setSelectedFormat("json")}
            >
              📄 JSON
            </button>
            <button
              className={`format-btn ${selectedFormat === "print" ? "active" : ""}`}
              onClick={() => setSelectedFormat("print")}
            >
              🖨️ Print/PDF
            </button>
          </div>
        </div>
      </div>

      <div className="generator-footer">
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "⏳ Generating..." : "📊 Generate Report"}
        </button>
      </div>
    </div>
  );
}