export function getGiftShopDiscountPercent(membershipLevel) {
  if (["Leadership Circle", "Benefactor", "Platinum"].includes(membershipLevel)) return 25;
  if (membershipLevel === "Gold") return 20;
  if (membershipLevel === "Silver") return 15;
  if (membershipLevel === "Bronze") return 10;
  return 0;
}

export function getCafeDiscountPercent(membershipLevel) {
  if (["Leadership Circle", "Benefactor", "Platinum"].includes(membershipLevel)) return 25;
  if (membershipLevel === "Gold") return 20;
  if (membershipLevel === "Silver") return 15;
  return 0;
}

export function calculateDiscountedAmount(amount, discountPercent) {
  return Number((Number(amount || 0) * (1 - discountPercent / 100)).toFixed(2));
}

export function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}
