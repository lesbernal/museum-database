const CART_KEY = "mfah_giftshop_cart";

export function readGiftShopCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGiftShopCart(cart) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearGiftShopCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_KEY);
}
