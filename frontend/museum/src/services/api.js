const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function request(path, options = {}, fallbackMessage = "Request failed") {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);

    if (!res.ok) {
      let message = fallbackMessage;
      try {
        const error = await res.json();
        message = error?.sqlMessage || error?.error || error?.message || fallbackMessage;
      } catch {
        // Ignore JSON parsing failures for non-JSON error bodies.
      }
      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    throw error;
  }
}

// ARTISTS
export async function getArtists() {
  return request("/artists", {}, "Failed to fetch artists");
}

export async function createArtist(artist) {
  return request("/artists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  }, "Failed to create artist");
}

export async function updateArtist(id, artist) {
  return request(`/artists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  }, "Failed to update artist");
}

export async function deleteArtist(id) {
  return request(`/artists/${id}`, {
    method: "DELETE",
  }, "Failed to delete artist");
}

// ARTWORKS
export async function getArtworks() {
  return request("/artwork", {}, "Failed to fetch artworks");
}

export async function createArtwork(artwork) {
  return request("/artwork", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  }, "Failed to create artwork");
}

export async function updateArtwork(id, artwork) {
  return request(`/artwork/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  }, "Failed to update artwork");
}

export async function deleteArtwork(id) {
  return request(`/artwork/${id}`, {
    method: "DELETE",
  }, "Failed to delete artwork");
}

// PROVENANCE
export async function getProvenance() {
  return request("/provenance", {}, "Failed to fetch provenance");
}

export async function createProvenance(record) {
  return request("/provenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }, "Failed to create provenance");
}

export async function updateProvenance(id, record) {
  return request(`/provenance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }, "Failed to update provenance");
}

export async function deleteProvenance(id) {
  return request(`/provenance/${id}`, {
    method: "DELETE",
  }, "Failed to delete provenance");
}

// MUSEUM BUILDINGS
export async function getBuildings() {
  return request("/buildings", {}, "Failed to fetch buildings");
}

export async function createBuilding(data) {
  return request("/buildings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to create building");
}

export async function updateBuilding(id, data) {
  return request(`/buildings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to update building");
}

export async function deleteBuilding(id) {
  return request(`/buildings/${id}`, {
    method: "DELETE",
  }, "Failed to delete building");
}

// EXHIBITIONS
export async function getExhibitions() {
  return request("/exhibitions", {}, "Failed to fetch exhibitions");
}

export async function createExhibition(data) {
  return request("/exhibitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to create exhibition");
}

export async function updateExhibition(id, data) {
  return request(`/exhibitions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to update exhibition");
}

export async function deleteExhibition(id) {
  return request(`/exhibitions/${id}`, {
    method: "DELETE",
  }, "Failed to delete exhibition");
}

// GALLERIES
export async function getGalleries() {
  return request("/galleries", {}, "Failed to fetch galleries");
}

export async function createGallery(data) {
  return request("/galleries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to create gallery");
}

export async function updateGallery(id, data) {
  return request(`/galleries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, "Failed to update gallery");
}

export async function deleteGallery(id) {
  return request(`/galleries/${id}`, {
    method: "DELETE",
  }, "Failed to delete gallery");
}

// EVENTS
export async function getEvents() {
  return request("/events", {}, "Failed to fetch events");
}

// CAFE
export async function getCafeItems() {
  return request("/cafeitems", {}, "Failed to fetch cafe items");
}

export async function createCafeItem(item) {
  return request("/cafeitems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  }, "Failed to create cafe item");
}

export async function updateCafeItem(id, item) {
  return request(`/cafeitems/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  }, "Failed to update cafe item");
}

export async function deleteCafeItem(id) {
  return request(`/cafeitems/${id}`, {
    method: "DELETE",
  }, "Failed to delete cafe item");
}

export async function getCafeTransactions() {
  return request("/cafetransactions", {}, "Failed to fetch cafe transactions");
}

export async function createCafeTransaction(transaction) {
  return request("/cafetransactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  }, "Failed to create cafe transaction");
}

export async function updateCafeTransaction(id, transaction) {
  return request(`/cafetransactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  }, "Failed to update cafe transaction");
}

export async function deleteCafeTransaction(id) {
  return request(`/cafetransactions/${id}`, {
    method: "DELETE",
  }, "Failed to delete cafe transaction");
}

export async function getCafeTransactionItems() {
  return request("/cafetransactionitems", {}, "Failed to fetch cafe transaction items");
}

export async function createCafeTransactionItem(transactionItem) {
  return request("/cafetransactionitems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionItem),
  }, "Failed to create cafe transaction item");
}

export async function updateCafeTransactionItem(id, transactionItem) {
  return request(`/cafetransactionitems/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionItem),
  }, "Failed to update cafe transaction item");
}

export async function deleteCafeTransactionItem(id) {
  return request(`/cafetransactionitems/${id}`, {
    method: "DELETE",
  }, "Failed to delete cafe transaction item");
}

// GIFT SHOP
export async function getGiftShopItems() {
  return request("/giftshopitems", {}, "Failed to fetch gift shop items");
}

export async function createGiftShopItem(item) {
  return request("/giftshopitems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  }, "Failed to create gift shop item");
}

export async function updateGiftShopItem(id, item) {
  return request(`/giftshopitems/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  }, "Failed to update gift shop item");
}

export async function deleteGiftShopItem(id) {
  return request(`/giftshopitems/${id}`, {
    method: "DELETE",
  }, "Failed to delete gift shop item");
}

export async function getGiftShopTransactions() {
  return request("/giftshoptransactions", {}, "Failed to fetch gift shop transactions");
}

export async function createGiftShopTransaction(transaction) {
  return request("/giftshoptransactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  }, "Failed to create gift shop transaction");
}

export async function updateGiftShopTransaction(id, transaction) {
  return request(`/giftshoptransactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  }, "Failed to update gift shop transaction");
}

export async function deleteGiftShopTransaction(id) {
  return request(`/giftshoptransactions/${id}`, {
    method: "DELETE",
  }, "Failed to delete gift shop transaction");
}

export async function getGiftShopTransactionItems() {
  return request("/giftshoptransactionitems", {}, "Failed to fetch gift shop transaction items");
}

export async function createGiftShopTransactionItem(transactionItem) {
  return request("/giftshoptransactionitems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionItem),
  }, "Failed to create gift shop transaction item");
}

export async function updateGiftShopTransactionItem(id, transactionItem) {
  return request(`/giftshoptransactionitems/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionItem),
  }, "Failed to update gift shop transaction item");
}

export async function deleteGiftShopTransactionItem(id) {
  return request(`/giftshoptransactionitems/${id}`, {
    method: "DELETE",
  }, "Failed to delete gift shop transaction item");
}