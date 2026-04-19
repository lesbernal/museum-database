import { useEffect, useMemo, useState } from "react";
import "../styles/OperationsManagement.css";
import { formatDateTimeToCST } from "../utils/dateUtils";

function formatValue(value, field) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  // Handle datetime fields - convert UTC to CST
  if (field?.type === "datetime") {
    return formatDateTimeToCST(value);
  }

  // Handle currency
  if (field?.type === "currency") {
    return `$${Number(value).toFixed(2)}`;
  }

  const formatted = String(value);

  if (field?.maxLength && formatted.length > field.maxLength) {
    return `${formatted.slice(0, field.maxLength)}...`;
  }

  return formatted;
}

function buildInitialForm(fields, record = null) {
  return fields.reduce((acc, field) => {
    if (record && record[field.name] !== undefined && record[field.name] !== null) {
      let value = record[field.name];
      if (field.type === "date") {
        value = String(value).slice(0, 10);
      } else if (field.type === "datetime") {
        value = String(value).replace("T", " ").slice(0, 19);
      } else {
        value = String(value);
      }
      acc[field.name] = value;
    } else {
      acc[field.name] = field.defaultValue ?? "";
    }
    return acc;
  }, {});
}

function RecordFormModal({ resource, record, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(resource.fields, record));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(resource.fields, record));
  }, [resource, record]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content operations-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{record ? `Edit ${resource.label}` : `Add ${resource.label}`}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form className="operations-form" onSubmit={handleSubmit}>
          <div className="operations-form-grid">
            {resource.fields.map((field) => {
              const isDisabled = record && field.readOnlyOnEdit;

              return (
                <div
                  className={`form-group ${field.fullWidth ? "full-width" : ""}`}
                  key={field.name}
                >
                  <label>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      disabled={isDisabled}
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "datetime" ? "datetime-local" : (field.type || "text")}
                      name={field.name}
                      value={form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      disabled={isDisabled}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {error && <div className="error-message submit-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Saving..." : record ? `Update ${resource.label}` : `Add ${resource.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// New component for transaction items expandable view
function TransactionItemsTable({ transactionId, getTransactionItems, itemsData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadItems() {
      if (!transactionId) return;
      
      // If itemsData is provided (pre-loaded), use it
      if (itemsData && itemsData[transactionId]) {
        setItems(itemsData[transactionId]);
        return;
      }
      
      setLoading(true);
      try {
        const allItems = await getTransactionItems();
        const filteredItems = allItems.filter(item => item.transaction_id == transactionId);
        setItems(filteredItems);
      } catch (err) {
        console.error("Failed to load transaction items:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadItems();
  }, [transactionId, getTransactionItems, itemsData]);

  if (loading) {
    return <div className="expanded-loading">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div className="expanded-empty">No items in this transaction</div>;
  }

  return (
    <div className="transaction-items-table-container">
      <table className="transaction-items-table">
        <thead>
          <tr>
            <th>Item ID</th>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.item_id}</td>
              <td>{item.item_name || `Item #${item.item_id}`}</td>
              <td>{item.quantity}</td>
              <td>${(item.subtotal / item.quantity).toFixed(2)}</td>
              <td>${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="items-total-row">
            <td colSpan="4" className="items-total-label">Total:</td>
            <td className="items-total-amount">
              ${items.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// New component for filters
function FilterBar({ filters, onFilterChange, activeFilters }) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="filter-bar">
      {filters.map((filter) => (
        <div className="filter-group" key={filter.field}>
          <label>{filter.label}:</label>
          
          {filter.type === "select" && (
            <select
              value={activeFilters[filter.field] || ""}
              onChange={(e) => onFilterChange(filter.field, e.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {filter.type === "range" && (
            <div className="range-filter">
              <input
                type="number"
                placeholder={`Min ${filter.unit || ""}`}
                value={activeFilters[`${filter.field}_min`] || ""}
                onChange={(e) => onFilterChange(`${filter.field}_min`, e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder={`Max ${filter.unit || ""}`}
                value={activeFilters[`${filter.field}_max`] || ""}
                onChange={(e) => onFilterChange(`${filter.field}_max`, e.target.value)}
              />
            </div>
          )}
          
          {filter.type === "dateRange" && (
            <div className="date-range-filter">
              <input
                type="date"
                placeholder="From"
                value={activeFilters[`${filter.field}_from`] || ""}
                onChange={(e) => onFilterChange(`${filter.field}_from`, e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                placeholder="To"
                value={activeFilters[`${filter.field}_to`] || ""}
                onChange={(e) => onFilterChange(`${filter.field}_to`, e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
      
      <button 
        className="clear-filters-btn"
        onClick={() => onFilterChange("clear", null)}
      >
        Clear Filters
      </button>
    </div>
  );
}

export default function OperationsManagement({ 
  title, 
  description, 
  resources, 
  getTransactionItems, // New prop for fetching transaction items
  isLowStock 
}) {
  const [activeResourceId, setActiveResourceId] = useState(resources[0].id);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [transactionItemsCache, setTransactionItemsCache] = useState({});

  const activeResource = resources.find((resource) => resource.id === activeResourceId);

  async function loadResource(resource) {
    const records = await resource.load();
    setData((prev) => ({ ...prev, [resource.id]: records }));
  }

  async function loadAllResources() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(resources.map((resource) => resource.load()));
      const nextData = {};
      const errors = [];

      results.forEach((result, index) => {
        const resource = resources[index];
        if (result.status === "fulfilled") {
          nextData[resource.id] = result.value;
        } else {
          nextData[resource.id] = [];
          errors.push(`${resource.labelPlural}: ${result.reason.message}`);
        }
      });

      setData(nextData);
      setError(errors.join(" | "));
      
      // Pre-load transaction items if this is the transactions resource and we have the fetcher
      if (activeResourceId === "giftshop-transactions" && getTransactionItems) {
        const allItems = await getTransactionItems();
        const itemsByTransaction = {};
        allItems.forEach(item => {
          if (!itemsByTransaction[item.transaction_id]) {
            itemsByTransaction[item.transaction_id] = [];
          }
          itemsByTransaction[item.transaction_id].push(item);
        });
        setTransactionItemsCache(itemsByTransaction);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllResources();
  }, []);

  // Reload transaction items cache when switching to transactions tab
  useEffect(() => {
    async function reloadTransactionItems() {
      if (activeResourceId === "giftshop-transactions" && getTransactionItems) {
        const allItems = await getTransactionItems();
        const itemsByTransaction = {};
        allItems.forEach(item => {
          if (!itemsByTransaction[item.transaction_id]) {
            itemsByTransaction[item.transaction_id] = [];
          }
          itemsByTransaction[item.transaction_id].push(item);
        });
        setTransactionItemsCache(itemsByTransaction);
      }
    }
    
    reloadTransactionItems();
  }, [activeResourceId]);

  const toggleExpand = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const applyFilters = (records) => {
    if (!activeResource.filters) return records;
    
    return records.filter(record => {
      for (const [key, value] of Object.entries(activeFilters)) {
        if (!value || value === "") continue;
        
        // Handle range filters
        if (key.endsWith("_min")) {
          const field = key.replace("_min", "");
          const min = parseFloat(value);
          if (!isNaN(min) && (record[field] === undefined || parseFloat(record[field]) < min)) {
            return false;
          }
        } else if (key.endsWith("_max")) {
          const field = key.replace("_max", "");
          const max = parseFloat(value);
          if (!isNaN(max) && (record[field] === undefined || parseFloat(record[field]) > max)) {
            return false;
          }
        } else if (key.endsWith("_from")) {
          const field = key.replace("_from", "");
          if (record[field] && new Date(record[field]) < new Date(value)) {
            return false;
          }
        } else if (key.endsWith("_to")) {
          const field = key.replace("_to", "");
          if (record[field] && new Date(record[field]) > new Date(value)) {
            return false;
          }
        } else if (key === "stock_status") {
          const stock = record.stock_quantity;
          if (value === "low" && (stock > 20 || stock === 0)) return false;
          if (value === "out" && stock > 0) return false;
          if (value === "in" && (stock <= 20 || stock === 0)) return false;
        } else {
          // Direct field match
          if (record[key] != value && String(record[key] || "").toLowerCase() !== String(value).toLowerCase()) {
            return false;
          }
        }
      }
      return true;
    });
  };

  const handleFilterChange = (filterKey, value) => {
    if (filterKey === "clear") {
      setActiveFilters({});
      return;
    }
    
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value || undefined
    }));
  };

  const filteredRecords = useMemo(() => {
    const records = data[activeResourceId] || [];
    let filtered = records;
    
    // Apply search
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((record) =>
        activeResource.searchKeys.some((key) =>
          String(record[key] ?? "").toLowerCase().includes(lowerSearch)
        )
      );
    }
    
    // Apply filters
    filtered = applyFilters(filtered);
    
    return filtered;
  }, [activeResource, activeResourceId, data, searchTerm, activeFilters]);

  async function handleSave(form) {
    if (editingRecord) {
      await activeResource.update(editingRecord[activeResource.idKey], form);
    } else {
      await activeResource.create(form);
    }

    await loadResource(activeResource);
    setShowModal(false);
    setEditingRecord(null);
  }

  async function handleDelete(recordId) {
    const confirmed = window.confirm(`Delete this ${activeResource.label.toLowerCase()}?`);
    if (!confirmed) return;

    try {
      await activeResource.remove(recordId);
      setError("");
      await loadResource(activeResource);
    } catch (err) {
      setError(err.message);
    }
  }

  // Check if a record is low stock (for cafe/gift shop items)
  const isLowStockRecord = (record) => {
    if (activeResourceId !== "cafe-items" && activeResourceId !== "giftshop-items") {
      return false;
    }
    // Check using the database flag or calculate from stock_quantity
    return record.low_stock_alert === 1 || Number(record.stock_quantity) <= 20;
  };

  // Check if this resource supports expandable rows (transactions)
  const supportsExpandable = getTransactionItems && activeResource?.isTransactionResource === true;
    
  return (
    <div className="operations-management">
      <header className="operations-header">
        <div>
          <h1>{title}</h1>
          <p className="admin-subtitle">{description}</p>
        </div>
      </header>

      <div className="resource-tabs">
        {resources.map((resource) => (
          <button
            key={resource.id}
            className={`resource-tab ${activeResourceId === resource.id ? "active" : ""}`}
            onClick={() => {
              setActiveResourceId(resource.id);
              setSearchTerm("");
              setActiveFilters({});
              setExpandedRows({});
              setEditingRecord(null);
              setShowModal(false);
            }}
          >
            {resource.labelPlural}
          </button>
        ))}
      </div>

      <div className="operations-toolbar">
        <input
          type="text"
          placeholder={`Search ${activeResource.labelPlural.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="add-btn"
          onClick={() => {
            setEditingRecord(null);
            setShowModal(true);
          }}
        >
          Add {activeResource.label}
        </button>
      </div>

      {/* Filter Bar */}
      {activeResource.filters && (
        <FilterBar 
          filters={activeResource.filters}
          onFilterChange={handleFilterChange}
          activeFilters={activeFilters}
        />
      )}

      {error && <div className="error-message dashboard-error">{error}</div>}

      <div className="content-area">
        {loading ? (
          <div className="loading-spinner">Loading {activeResource.labelPlural.toLowerCase()}...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">No {activeResource.labelPlural.toLowerCase()} found</div>
        ) : (
          <div className="operations-table-container">
            <table className="operations-table">
              <thead>
                <tr>
                  {supportsExpandable && <th style={{ width: "40px" }}></th>}
                  {activeResource.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const isLowStockItem = isLowStockRecord(record);
                  const isExpanded = expandedRows[record[activeResource.idKey]];
                  
                  return (
                    <>
                      <tr 
                        key={record[activeResource.idKey]} 
                        className={`${isLowStockItem ? "low-stock-row" : ""} ${supportsExpandable ? "expandable-row" : ""}`}
                      >
                        {supportsExpandable && (
                          <td className="expand-cell">
                            <button
                              className="expand-btn"
                              onClick={() => toggleExpand(record[activeResource.idKey])}
                            >
                              {isExpanded ? "▼" : "▶"}
                            </button>
                          </td>
                        )}
                        {activeResource.columns.map((column) => (
                          <td key={column.key} title={record[column.key] ?? ""}>
                            {formatValue(record[column.key], column)}
                            {isLowStockItem && column.key === "stock_quantity" && (
                              <span className="low-stock-badge">Low Stock!</span>
                            )}
                          </td>
                        ))}
                        <td className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditingRecord(record);
                              setShowModal(true);
                            }}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(record[activeResource.idKey])}
                            title="Delete"
                          >
                            Delete
                          </button>
                         </td>
                      </tr>
                      {supportsExpandable && isExpanded && (
                        <tr className="expanded-details-row">
                          <td colSpan={activeResource.columns.length + 2}>
                            <div className="expanded-content">
                              <h4>Transaction Items</h4>
                              <TransactionItemsTable
                                transactionId={record[activeResource.idKey]}
                                getTransactionItems={getTransactionItems}
                                itemsData={transactionItemsCache}
                              />
                            </div>
                           </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <RecordFormModal
          resource={activeResource}
          record={editingRecord}
          onClose={() => {
            setShowModal(false);
            setEditingRecord(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}