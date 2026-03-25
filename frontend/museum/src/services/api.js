
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
//ARTISTS

//get artists
export async function getArtists() {
  const res = await fetch(`${BASE_URL}/artists`);
  if (!res.ok) throw new Error("Failed to fetch artists");
  return res.json();
}


//create artists
export async function createArtist(artist) {
  const res = await fetch(`${BASE_URL}/artists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  });
  if (!res.ok) throw new Error("Failed to create artist");
  return res.json();
}

// update artist
export async function updateArtist(id, artist) {
  const res = await fetch(`${BASE_URL}/artists/${id}`, {
    method: "PUT", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  });
  if (!res.ok) throw new Error("Failed to update artist");
  return res.json();
}

// delete artist
export async function deleteArtist(id) {
  const res = await fetch(`${BASE_URL}/artists/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete artist");
  return res.json();
}

//ARTWORKS

// ARTWORKS
export async function getArtworks() {
  const res = await fetch(`${BASE_URL}/artwork`);
  if (!res.ok) throw new Error("Failed to fetch artworks");
  return res.json();
}

export async function createArtwork(artwork) {
  const res = await fetch(`${BASE_URL}/artwork`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });
  if (!res.ok) throw new Error("Failed to create artwork");
  return res.json();
}

export async function updateArtwork(id, artwork) {
  const res = await fetch(`${BASE_URL}/artwork/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });
  if (!res.ok) throw new Error("Failed to update artwork");
  return res.json();
}

export async function deleteArtwork(id) {
  const res = await fetch(`${BASE_URL}/artwork/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete artwork");
  return res.json();
}

// PROVENANCE
export async function getProvenance() {
  const res = await fetch(`${BASE_URL}/provenance`);
  if (!res.ok) throw new Error("Failed to fetch provenance");
  return res.json();
}

export async function createProvenance(record) {
  const res = await fetch(`${BASE_URL}/provenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create provenance");
  return res.json();
}

export async function updateProvenance(id, record) {
  const res = await fetch(`${BASE_URL}/provenance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update provenance");
  return res.json();
}

export async function deleteProvenance(id) {
  const res = await fetch(`${BASE_URL}/provenance/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete provenance");
  return res.json();
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
export async function createUser(data) {
  const res = await fetch(`${BASE_URL}/users`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}
export async function updateUser(id, data) {
  const res = await fetch(`${BASE_URL}/users/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}
export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/users/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
export async function getEmployees() {
  const res = await fetch(`${BASE_URL}/employees`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}
export async function createEmployee(data) {
  const res = await fetch(`${BASE_URL}/employees`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create employee");
  return res.json();
}
export async function updateEmployee(id, data) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update employee");
  return res.json();
}
export async function deleteEmployee(id) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to delete employee");
  return res.json();
}

// ── VISITORS ──────────────────────────────────────────────────────────────────
export async function getVisitors() {
  const res = await fetch(`${BASE_URL}/visitors`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch visitors");
  return res.json();
}
export async function createVisitor(data) {
  const res = await fetch(`${BASE_URL}/visitors`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create visitor");
  return res.json();
}
export async function updateVisitor(id, data) {
  const res = await fetch(`${BASE_URL}/visitors/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update visitor");
  return res.json();
}
export async function deleteVisitor(id) {
  const res = await fetch(`${BASE_URL}/visitors/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to delete visitor");
  return res.json();
}

// ── MEMBERS ───────────────────────────────────────────────────────────────────
export async function getMembers() {
  const res = await fetch(`${BASE_URL}/members`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}
export async function createMember(data) {
  const res = await fetch(`${BASE_URL}/members`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create member");
  return res.json();
}
export async function updateMember(id, data) {
  const res = await fetch(`${BASE_URL}/members/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}
export async function deleteMember(id) {
  const res = await fetch(`${BASE_URL}/members/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to delete member");
  return res.json();
}

// ── SELF-SERVICE (logged-in user managing their OWN record) ───────────────────
export async function getMyProfile() {
  const user_id = localStorage.getItem("user_id");
  const res = await fetch(`${BASE_URL}/users/${user_id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}
export async function updateMyProfile(data) {
  const user_id = localStorage.getItem("user_id");
  const res = await fetch(`${BASE_URL}/users/${user_id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}
export async function changeMyPassword(newPassword) {
  const user_id = localStorage.getItem("user_id");
  const res = await fetch(`${BASE_URL}/users/${user_id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ password: newPassword }) });
  if (!res.ok) throw new Error("Failed to change password");
  return res.json();
}
export async function getMyVisitorRecord() {
  const user_id = localStorage.getItem("user_id");
  const res = await fetch(`${BASE_URL}/visitors/${user_id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch visitor record");
  return res.json();
}
export async function getMyMemberRecord() {
  const user_id = localStorage.getItem("user_id");
  const res = await fetch(`${BASE_URL}/members/${user_id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch membership record");
  return res.json();
}