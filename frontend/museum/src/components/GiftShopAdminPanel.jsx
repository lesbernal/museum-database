import OperationsManagement from "./OperationsManagement";
import {
  createGiftShopItem,
  createGiftShopTransaction,
  createGiftShopTransactionItem,
  deleteGiftShopItem,
  deleteGiftShopTransaction,
  deleteGiftShopTransactionItem,
  getGiftShopItems,
  getGiftShopTransactions,
  getGiftShopTransactionItems,
  updateGiftShopItem,
  updateGiftShopTransaction,
  updateGiftShopTransactionItem,
} from "../services/api";

const resources = [
  {
    id: "giftshop-items",
    label: "Gift Shop Item",
    labelPlural: "📦 Inventory",
    idKey: "item_id",
    load: getGiftShopItems,
    create: createGiftShopItem,
    update: updateGiftShopItem,
    remove: deleteGiftShopItem,
    searchKeys: ["item_id", "item_name", "category", "image_url"],
    columns: [
      { key: "item_id", label: "ID" },
      { key: "image_url", label: "Image", type: "image" },  
      { key: "item_name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price", type: "currency" },
      { key: "stock_quantity", label: "Stock" },
    ],
    fields: [
      { name: "item_id", label: "Item ID", required: true, readOnlyOnEdit: true, placeholder: "30" },
      { name: "item_name", label: "Item Name", required: true, placeholder: "Museum Poster" },
      { name: "category", label: "Category", required: true, placeholder: "Decor" },
      { name: "price", label: "Price", required: true, placeholder: "19.99" },
      { name: "stock_quantity", label: "Stock Quantity", required: true, placeholder: "10" },
      {
        name: "image_url",
        label: "Image URL",
        placeholder: "https://example.com/gift-shop-item.jpg",
        fullWidth: true,
      },
    ],
    // Add filters for inventory
    filters: [
      { 
        field: "category", 
        label: "Category", 
        type: "select", 
        options: [
          { value: "", label: "All Categories" },
          { value: "Decor", label: "Decor" },
          { value: "Toys", label: "Toys" },
          { value: "Apparel", label: "Apparel" },
          { value: "Books", label: "Books" },
          { value: "Accessories", label: "Accessories" }
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
    id: "giftshop-transactions",
    label: "Gift Shop Transaction",
    labelPlural: "Sales",
    idKey: "transaction_id",
    isTransactionResource: true,
    load: getGiftShopTransactions,
    create: createGiftShopTransaction,
    update: updateGiftShopTransaction,
    remove: deleteGiftShopTransaction,
    searchKeys: ["transaction_id", "user_id", "payment_method"],
    columns: [
      { key: "transaction_id", label: "Sale ID" },
      { key: "user_id", label: "Customer ID" },
      { key: "transaction_datetime", label: "Date & Time", type: "datetime" },
      { key: "total_amount", label: "Total", type: "currency" },
      { key: "payment_method", label: "Payment" },
    ],
    fields: [
      { name: "transaction_id", label: "Transaction ID", required: true, readOnlyOnEdit: true, placeholder: "30" },
      { name: "user_id", label: "User ID", required: true, placeholder: "1" },
      { name: "transaction_datetime", label: "Date Time", required: true, type: "datetime", placeholder: "2026-03-25 15:15:00" },
      { name: "total_amount", label: "Total Amount", required: true, placeholder: "19.99" },
      { name: "payment_method", label: "Payment Method", required: true, placeholder: "Card" },
    ],
    // Add filters for transactions
    filters: [
      {
        field: "payment_method",
        label: "Payment Method",
        type: "select",
        options: [
          { value: "", label: "All" },
          { value: "Card", label: "💳 Card" },
          { value: "Cash", label: "💵 Cash" },
          { value: "Gift Card", label: "🎁 Gift Card" }
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
  // Note: giftshop-transaction-items is REMOVED as a separate tab
  // It now appears as expandable rows within the Sales tab
];

export default function GiftShopAdminPanel() {
  return (
    <OperationsManagement
      title="Gift Shop Management"
      description="Manage inventory, track sales, and view transaction details"
      resources={resources}
      getTransactionItems={getGiftShopTransactionItems}
    />
  );
}