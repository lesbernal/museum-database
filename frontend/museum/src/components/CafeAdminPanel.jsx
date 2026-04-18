import OperationsManagement from "./OperationsManagement";
import {
  createCafeItem,
  createCafeTransaction,
  createCafeTransactionItem,
  deleteCafeItem,
  deleteCafeTransaction,
  deleteCafeTransactionItem,
  getCafeItems,
  getCafeTransactions,
  getCafeTransactionItems,
  updateCafeItem,
  updateCafeTransaction,
  updateCafeTransactionItem,
} from "../services/api";

const resources = [
  {
    id: "cafe-items",
    label: "Cafe Item",
    labelPlural: "☕ Menu Items",
    idKey: "item_id",
    load: getCafeItems,
    create: createCafeItem,
    update: updateCafeItem,
    remove: deleteCafeItem,
    searchKeys: ["item_id", "item_name", "category", "image_url"],
    columns: [
      { key: "item_id", label: "ID" },
      { key: "item_name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price", type: "currency" },
      { key: "stock_quantity", label: "Stock" },
      { key: "image_url", label: "Image URL", maxLength: 28 },
    ],
    fields: [
      { name: "item_id", label: "Item ID", required: true, readOnlyOnEdit: true, placeholder: "20" },
      { name: "item_name", label: "Item Name", required: true, placeholder: "Vanilla Latte" },
      { name: "category", label: "Category", required: true, placeholder: "Drink" },
      { name: "price", label: "Price", required: true, placeholder: "6.25" },
      { name: "stock_quantity", label: "Stock Quantity", required: true, placeholder: "10" },
      {
        name: "image_url",
        label: "Image URL",
        placeholder: "https://example.com/cafe-item.jpg",
        fullWidth: true,
      },
    ],
    // Add filters for cafe menu items
    filters: [
      { 
        field: "category", 
        label: "Category", 
        type: "select", 
        options: [
          { value: "", label: "All Categories" },
          { value: "Drink", label: "☕ Drinks" },
          { value: "Food", label: "🍔 Food" },
          { value: "Pastry", label: "🥐 Pastries" },
          { value: "Snack", label: "🍪 Snacks" }
        ]
      },
      {
        field: "stock_status",
        label: "Stock Status",
        type: "select",
        options: [
          { value: "", label: "All" },
          { value: "low", label: "⚠️ Low Stock (≤20)" },
          { value: "in", label: "✅ In Stock (>20)" },
          { value: "out", label: "❌ Out of Stock" }
        ]
      },
      {
        field: "price",
        label: "Price Range",
        type: "range",
        unit: "$"
      }
    ]
  },
  {
    id: "cafe-transactions",
    label: "Cafe Transaction",
    labelPlural: "💰 Sales",
    idKey: "cafe_transaction_id",
    isTransactionResource: true,
    load: getCafeTransactions,
    create: createCafeTransaction,
    update: updateCafeTransaction,
    remove: deleteCafeTransaction,
    searchKeys: ["cafe_transaction_id", "user_id", "payment_method"],
    columns: [
      { key: "cafe_transaction_id", label: "Sale ID" },
      { key: "user_id", label: "Customer ID" },
      { key: "transaction_datetime", label: "Date & Time", type: "datetime" },
      { key: "total_amount", label: "Total", type: "currency" },
      { key: "payment_method", label: "Payment" },
    ],
    fields: [
      { name: "cafe_transaction_id", label: "Transaction ID", required: true, readOnlyOnEdit: true, placeholder: "20" },
      { name: "user_id", label: "User ID", required: true, placeholder: "1" },
      { name: "transaction_datetime", label: "Date Time", required: true, type: "datetime", placeholder: "2026-03-25 15:00:00" },
      { name: "total_amount", label: "Total Amount", required: true, placeholder: "12.50" },
      { name: "payment_method", label: "Payment Method", required: true, placeholder: "Card" },
    ],
    // Add filters for cafe transactions
    filters: [
      {
        field: "payment_method",
        label: "Payment Method",
        type: "select",
        options: [
          { value: "", label: "All" },
          { value: "Card", label: "💳 Card" },
          { value: "Cash", label: "💵 Cash" },
          { value: "Gift Card", label: "🎁 Gift Card" },
          { value: "Mobile", label: "📱 Mobile Payment" }
        ]
      },
      {
        field: "date",
        label: "Date Range",
        type: "dateRange"
      },
      {
        field: "total_amount",
        label: "Sale Amount",
        type: "range",
        unit: "$"
      }
    ]
  }
  // Note: cafe-transaction-items is REMOVED as a separate tab
  // It now appears as expandable rows within the Sales tab
];

export default function CafeAdminPanel() {
  return (
    <OperationsManagement
      title="Cafe Management"
      description="Manage menu items, track sales, and view order details"
      resources={resources}
      getTransactionItems={getCafeTransactionItems}
    />
  );
}