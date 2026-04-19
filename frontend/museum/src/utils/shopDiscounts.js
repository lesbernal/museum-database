// utils/shopDiscounts.js

/**
 * Ticket discount percentages by membership tier.
 * Benefactor and Leadership Circle get 100% (free admission).
 * These match the apply_ticket_discount trigger in the DB.
 */
export const TICKET_TIER_DISCOUNT = {
  Bronze:              10,
  Silver:              15,
  Gold:                20,
  Platinum:            25,
  Benefactor:          100,
  "Leadership Circle": 100,
};

/**
 * Gift shop discount percentages by membership tier.
 * Bronze gets 10% at the shop.
 */
export function getGiftShopDiscountPercent(membershipLevel) {
  if (["Leadership Circle", "Benefactor", "Platinum"].includes(membershipLevel)) return 25;
  if (membershipLevel === "Gold")   return 20;
  if (membershipLevel === "Silver") return 15;
  if (membershipLevel === "Bronze") return 10;
  return 0;
}

/**
 * Cafe discount percentages by membership tier.
 * Bronze now gets 10% to be consistent with tickets and gift shop.
 */
export function getCafeDiscountPercent(membershipLevel) {
  if (["Leadership Circle", "Benefactor", "Platinum"].includes(membershipLevel)) return 25;
  if (membershipLevel === "Gold")   return 20;
  if (membershipLevel === "Silver") return 15;
  if (membershipLevel === "Bronze") return 10;
  return 0;
}

/**
 * Returns the discounted amount. If discountPercent is 0 returns amount unchanged.
 */
export function calculateDiscountedAmount(amount, discountPercent) {
  return Number((Number(amount || 0) * (1 - discountPercent / 100)).toFixed(2));
}

export function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}