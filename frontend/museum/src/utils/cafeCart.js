const CART_KEY = "mfah_cafe_cart";

export function readCafeCart() {
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

export function writeCafeCart(cart) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCafeCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_KEY);
}
