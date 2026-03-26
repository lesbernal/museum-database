const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Shared request helper (from main branch) ──────────────────────────────────
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

// ── Auth headers helper (for protected routes) ────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Authenticated version of request helper
function authRequest(path, options = {}, fallbackMessage = "Request failed") {
  return request(path, { ...options, headers: { ...authHeaders(), ...options.headers } }, fallbackMessage);
}

// ── ARTISTS ───────────────────────────────────────────────────────────────────
export async function getArtists() {
  return request("/artists", {}, "Failed to fetch artists");
}

// Create a new artist
export async function createArtist(artist) {
  return request("/artists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artist) }, "Failed to create artist");
}
export async function updateArtist(id, artist) {
  return request(`/artists/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artist) }, "Failed to update artist");
}
export async function deleteArtist(id) {
  return request(`/artists/${id}`, { method: "DELETE" }, "Failed to delete artist");
}

// -------------------- ARTWORKS --------------------

// Get all artworks
export async function getArtworks() {
  return request("/artwork", {}, "Failed to fetch artworks");
}

// Create a new artwork
export async function createArtwork(artwork) {
  return request("/artwork", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artwork) }, "Failed to create artwork");
}

// Update artwork by ID
export async function updateArtwork(id, artwork) {
  return request(`/artwork/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artwork) }, "Failed to update artwork");
}

// Delete artwork by ID
export async function deleteArtwork(id) {
  return request(`/artwork/${id}`, { method: "DELETE" }, "Failed to delete artwork");
}

// -------------------- PROVENANCE --------------------

// Get all provenance records
export async function getProvenance() {
  return request("/provenance", {}, "Failed to fetch provenance");
}

// Create a provenance record
export async function createProvenance(record) {
  return request("/provenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) }, "Failed to create provenance");
}

// Update provenance by ID
export async function updateProvenance(id, record) {
  return request(`/provenance/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) }, "Failed to update provenance");
}
export async function deleteProvenance(id) {
  return request(`/provenance/${id}`, { method: "DELETE" }, "Failed to delete provenance");
}

// -------------------- EVENTS --------------------

// Get all events
export async function getEvents() {
  return request("/events", {}, "Failed to fetch events");
}

// Create a new event
export async function createEvent(event) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

// Update an event by ID
export async function updateEvent(id, event) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

// Delete an event by ID
export async function deleteEvent(id) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
}

// -------------------- TICKETS --------------------

// Post a ticket
export async function postTicket(ticket) {
  const res = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });
  if (!res.ok) throw new Error("Failed to post ticket");
  return res.json();
}

// Get revenue summary
export async function getRevenueReport() {
  const res = await fetch(`${BASE_URL}/reports/revenue`);
  if (!res.ok) throw new Error("Failed to fetch revenue report");
  return res.json();
}

// Fetch attendance report
export async function getAttendanceReport() {
  const res = await fetch(`${BASE_URL}/reports/attendance`);
  if (!res.ok) throw new Error("Failed to fetch attendance report");
  return res.json();
}
// ── MUSEUM BUILDINGS ──────────────────────────────────────────────────────────
export async function getBuildings() {
  return request("/buildings", {}, "Failed to fetch buildings");
}
export async function createBuilding(data) {
  return request("/buildings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to create building");
}
export async function updateBuilding(id, data) {
  return request(`/buildings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to update building");
}
export async function deleteBuilding(id) {
  return request(`/buildings/${id}`, { method: "DELETE" }, "Failed to delete building");
}

// ── EXHIBITIONS ───────────────────────────────────────────────────────────────
export async function getExhibitions() {
  return request("/exhibitions", {}, "Failed to fetch exhibitions");
}
export async function createExhibition(data) {
  return request("/exhibitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to create exhibition");
}
export async function updateExhibition(id, data) {
  return request(`/exhibitions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to update exhibition");
}
export async function deleteExhibition(id) {
  return request(`/exhibitions/${id}`, { method: "DELETE" }, "Failed to delete exhibition");
}

// ── GALLERIES ─────────────────────────────────────────────────────────────────
export async function getGalleries() {
  return request("/galleries", {}, "Failed to fetch galleries");
}
export async function createGallery(data) {
  return request("/galleries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to create gallery");
}
export async function updateGallery(id, data) {
  return request(`/galleries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, "Failed to update gallery");
}
export async function deleteGallery(id) {
  return request(`/galleries/${id}`, { method: "DELETE" }, "Failed to delete gallery");
}

// ── CAFE ──────────────────────────────────────────────────────────────────────
export async function getCafeItems() {
  return request("/cafeitems", {}, "Failed to fetch cafe items");
}
export async function createCafeItem(item) {
  return request("/cafeitems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to create cafe item");
}
export async function updateCafeItem(id, item) {
  return request(`/cafeitems/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to update cafe item");
}
export async function deleteCafeItem(id) {
  return request(`/cafeitems/${id}`, { method: "DELETE" }, "Failed to delete cafe item");
}
export async function getCafeTransactions() {
  return request("/cafetransactions", {}, "Failed to fetch cafe transactions");
}
export async function createCafeTransaction(transaction) {
  return request("/cafetransactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transaction) }, "Failed to create cafe transaction");
}
export async function updateCafeTransaction(id, transaction) {
  return request(`/cafetransactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transaction) }, "Failed to update cafe transaction");
}
export async function deleteCafeTransaction(id) {
  return request(`/cafetransactions/${id}`, { method: "DELETE" }, "Failed to delete cafe transaction");
}
export async function getCafeTransactionItems() {
  return request("/cafetransactionitems", {}, "Failed to fetch cafe transaction items");
}
export async function createCafeTransactionItem(item) {
  return request("/cafetransactionitems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to create cafe transaction item");
}
export async function updateCafeTransactionItem(id, item) {
  return request(`/cafetransactionitems/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to update cafe transaction item");
}
export async function deleteCafeTransactionItem(id) {
  return request(`/cafetransactionitems/${id}`, { method: "DELETE" }, "Failed to delete cafe transaction item");
}

// ── GIFT SHOP ─────────────────────────────────────────────────────────────────
export async function getGiftShopItems() {
  return request("/giftshopitems", {}, "Failed to fetch gift shop items");
}
export async function createGiftShopItem(item) {
  return request("/giftshopitems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to create gift shop item");
}
export async function updateGiftShopItem(id, item) {
  return request(`/giftshopitems/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to update gift shop item");
}
export async function deleteGiftShopItem(id) {
  return request(`/giftshopitems/${id}`, { method: "DELETE" }, "Failed to delete gift shop item");
}
export async function getGiftShopTransactions() {
  return request("/giftshoptransactions", {}, "Failed to fetch gift shop transactions");
}
export async function createGiftShopTransaction(transaction) {
  return request("/giftshoptransactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transaction) }, "Failed to create gift shop transaction");
}
export async function updateGiftShopTransaction(id, transaction) {
  return request(`/giftshoptransactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(transaction) }, "Failed to update gift shop transaction");
}
export async function deleteGiftShopTransaction(id) {
  return request(`/giftshoptransactions/${id}`, { method: "DELETE" }, "Failed to delete gift shop transaction");
}
export async function getGiftShopTransactionItems() {
  return request("/giftshoptransactionitems", {}, "Failed to fetch gift shop transaction items");
}
export async function createGiftShopTransactionItem(item) {
  return request("/giftshoptransactionitems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to create gift shop transaction item");
}
export async function updateGiftShopTransactionItem(id, item) {
  return request(`/giftshoptransactionitems/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }, "Failed to update gift shop transaction item");
}
export async function deleteGiftShopTransactionItem(id) {
  return request(`/giftshoptransactionitems/${id}`, { method: "DELETE" }, "Failed to delete gift shop transaction item");
}

// ── USERS (auth-protected) ────────────────────────────────────────────────────
export async function getUserById(id) {
  return authRequest(`/users/${id}`, {}, "Failed to fetch user");
}
export async function getUsers() {
  return authRequest("/users", {}, "Failed to fetch users");
}
export async function createUser(data) {
  return authRequest("/users", { method: "POST", body: JSON.stringify(data) }, "Failed to create user");
}
export async function updateUser(id, data) {
  return authRequest(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }, "Failed to update user");
}
export async function deleteUser(id) {
  return authRequest(`/users/${id}`, { method: "DELETE" }, "Failed to delete user");
}

// ── EMPLOYEES (auth-protected) ────────────────────────────────────────────────
export async function getEmployees() {
  return authRequest("/employees", {}, "Failed to fetch employees");
}
export async function createEmployee(data) {
  return authRequest("/employees", { method: "POST", body: JSON.stringify(data) }, "Failed to create employee");
}
export async function updateEmployee(id, data) {
  return authRequest(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }, "Failed to update employee");
}
export async function deleteEmployee(id) {
  return authRequest(`/employees/${id}`, { method: "DELETE" }, "Failed to delete employee");
}

// ── VISITORS (auth-protected) ─────────────────────────────────────────────────
export async function getVisitors() {
  return authRequest("/visitors", {}, "Failed to fetch visitors");
}
export async function createVisitor(data) {
  return authRequest("/visitors", { method: "POST", body: JSON.stringify(data) }, "Failed to create visitor");
}
export async function updateVisitor(id, data) {
  return authRequest(`/visitors/${id}`, { method: "PUT", body: JSON.stringify(data) }, "Failed to update visitor");
}
export async function deleteVisitor(id) {
  return authRequest(`/visitors/${id}`, { method: "DELETE" }, "Failed to delete visitor");
}

// ── MEMBERS (auth-protected) ──────────────────────────────────────────────────
export async function getMembers() {
  return authRequest("/members", {}, "Failed to fetch members");
}
export async function createMember(data) {
  return authRequest("/members", { method: "POST", body: JSON.stringify(data) }, "Failed to create member");
}
export async function updateMember(id, data) {
  return authRequest(`/members/${id}`, { method: "PUT", body: JSON.stringify(data) }, "Failed to update member");
}
export async function deleteMember(id) {
  return authRequest(`/members/${id}`, { method: "DELETE" }, "Failed to delete member");
}

// ── SELF-SERVICE (logged-in user managing their OWN record) ───────────────────
export async function getMyProfile() {
  const user_id = localStorage.getItem("user_id");
  return authRequest(`/users/${user_id}`, {}, "Failed to fetch profile");
}
export async function updateMyProfile(data) {
  const user_id = localStorage.getItem("user_id");
  return authRequest(`/users/${user_id}`, { method: "PUT", body: JSON.stringify(data) }, "Failed to update profile");
}
export async function changeMyPassword(newPassword) {
  const user_id = localStorage.getItem("user_id");
  return authRequest(`/users/${user_id}`, { method: "PUT", body: JSON.stringify({ password: newPassword }) }, "Failed to change password");
}
export async function getMyVisitorRecord() {
  const user_id = localStorage.getItem("user_id");
  return authRequest(`/visitors/${user_id}`, {}, "Failed to fetch visitor record");
}
export async function getMyMemberRecord() {
  const user_id = localStorage.getItem("user_id");
  return authRequest(`/members/${user_id}`, {}, "Failed to fetch membership record");
}