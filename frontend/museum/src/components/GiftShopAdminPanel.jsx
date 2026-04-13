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
    labelPlural: "Gift Shop Items",
    idKey: "item_id",
    load: getGiftShopItems,
    create: createGiftShopItem,
    update: updateGiftShopItem,
    remove: deleteGiftShopItem,
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
  },
  {
    id: "giftshop-transactions",
    label: "Gift Shop Transaction",
    labelPlural: "Gift Shop Transactions",
    idKey: "transaction_id",
    load: getGiftShopTransactions,
    create: createGiftShopTransaction,
    update: updateGiftShopTransaction,
    remove: deleteGiftShopTransaction,
    searchKeys: ["transaction_id", "user_id", "payment_method"],
    columns: [
      { key: "transaction_id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "transaction_datetime", label: "Date Time", type: "datetime" },
      { key: "total_amount", label: "Total" },
      { key: "payment_method", label: "Payment" },
    ],
    fields: [
      { name: "transaction_id", label: "Transaction ID", required: true, readOnlyOnEdit: true, placeholder: "30" },
      { name: "user_id", label: "User ID", required: true, placeholder: "1" },
      { name: "transaction_datetime", label: "Date Time", required: true, type: "datetime", placeholder: "2026-03-25 15:15:00" },
      { name: "total_amount", label: "Total Amount", required: true, placeholder: "19.99" },
      { name: "payment_method", label: "Payment Method", required: true, placeholder: "Card" },
    ],
  },
  {
    id: "giftshop-transaction-items",
    label: "Gift Shop Transaction Item",
    labelPlural: "Gift Shop Transaction Items",
    idKey: "shop_item_id",
    load: getGiftShopTransactionItems,
    create: createGiftShopTransactionItem,
    update: updateGiftShopTransactionItem,
    remove: deleteGiftShopTransactionItem,
    searchKeys: ["shop_item_id", "transaction_id", "item_id"],
    columns: [
      { key: "shop_item_id", label: "ID" },
      { key: "transaction_id", label: "Transaction ID" },
      { key: "item_id", label: "Item ID" },
      { key: "quantity", label: "Quantity" },
      { key: "subtotal", label: "Subtotal" },
    ],
    fields: [
      { name: "shop_item_id", label: "Shop Item ID", required: true, readOnlyOnEdit: true, placeholder: "30" },
      { name: "transaction_id", label: "Transaction ID", required: true, placeholder: "30" },
      { name: "item_id", label: "Item ID", required: true, placeholder: "30" },
      { name: "quantity", label: "Quantity", required: true, placeholder: "1" },
      { name: "subtotal", label: "Subtotal", required: true, placeholder: "19.99" },
    ],
  },
];

export default function GiftShopAdminPanel() {
  return (
    <OperationsManagement
      title="Gift Shop Management"
      description="Manage gift shop inventory, sales, and line items."
      resources={resources}
    />
  );
}
