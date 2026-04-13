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
    labelPlural: "Cafe Items",
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
      { key: "price", label: "Price" },
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
  },
  {
    id: "cafe-transactions",
    label: "Cafe Transaction",
    labelPlural: "Cafe Transactions",
    idKey: "cafe_transaction_id",
    load: getCafeTransactions,
    create: createCafeTransaction,
    update: updateCafeTransaction,
    remove: deleteCafeTransaction,
    searchKeys: ["cafe_transaction_id", "user_id", "payment_method"],
    columns: [
      { key: "cafe_transaction_id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "transaction_datetime", label: "Date Time", type: "datetime" },
      { key: "total_amount", label: "Total" },
      { key: "payment_method", label: "Payment" },
    ],
    fields: [
      { name: "cafe_transaction_id", label: "Transaction ID", required: true, readOnlyOnEdit: true, placeholder: "20" },
      { name: "user_id", label: "User ID", required: true, placeholder: "1" },
      { name: "transaction_datetime", label: "Date Time", required: true, type: "datetime", placeholder: "2026-03-25 15:00:00" },
      { name: "total_amount", label: "Total Amount", required: true, placeholder: "12.50" },
      { name: "payment_method", label: "Payment Method", required: true, placeholder: "Card" },
    ],
  },
  {
    id: "cafe-transaction-items",
    label: "Cafe Transaction Item",
    labelPlural: "Cafe Transaction Items",
    idKey: "transaction_item_id",
    load: getCafeTransactionItems,
    create: createCafeTransactionItem,
    update: updateCafeTransactionItem,
    remove: deleteCafeTransactionItem,
    searchKeys: ["transaction_item_id", "transaction_id", "item_id"],
    columns: [
      { key: "transaction_item_id", label: "ID" },
      { key: "transaction_id", label: "Transaction ID" },
      { key: "item_id", label: "Item ID" },
      { key: "quantity", label: "Quantity" },
      { key: "subtotal", label: "Subtotal" },
    ],
    fields: [
      { name: "transaction_item_id", label: "Transaction Item ID", required: true, readOnlyOnEdit: true, placeholder: "20" },
      { name: "transaction_id", label: "Transaction ID", required: true, placeholder: "20" },
      { name: "item_id", label: "Item ID", required: true, placeholder: "20" },
      { name: "quantity", label: "Quantity", required: true, placeholder: "2" },
      { name: "subtotal", label: "Subtotal", required: true, placeholder: "12.50" },
    ],
  },
];

export default function CafeAdminPanel() {
  return (
    <OperationsManagement
      title="Cafe Management"
      description="Manage cafe inventory, sales, and line items."
      resources={resources}
    />
  );
}
