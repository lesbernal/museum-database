// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// -------------------- ARTISTS --------------------

// Get all artists
export async function getArtists() {
  const res = await fetch(`${BASE_URL}/artists`);
  if (!res.ok) throw new Error("Failed to fetch artists");
  return res.json();
}

// Create a new artist
export async function createArtist(artist) {
  const res = await fetch(`${BASE_URL}/artists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  });
  if (!res.ok) throw new Error("Failed to create artist");
  return res.json();
}

// Update artist by ID
export async function updateArtist(id, artist) {
  const res = await fetch(`${BASE_URL}/artists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  });
  if (!res.ok) throw new Error("Failed to update artist");
  return res.json();
}

// Delete artist by ID
export async function deleteArtist(id) {
  const res = await fetch(`${BASE_URL}/artists/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete artist");
  return res.json();
}

// -------------------- ARTWORKS --------------------

// Get all artworks
export async function getArtworks() {
  const res = await fetch(`${BASE_URL}/artwork`);
  if (!res.ok) throw new Error("Failed to fetch artworks");
  return res.json();
}

// Create a new artwork
export async function createArtwork(artwork) {
  const res = await fetch(`${BASE_URL}/artwork`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });
  if (!res.ok) throw new Error("Failed to create artwork");
  return res.json();
}

// Update artwork by ID
export async function updateArtwork(id, artwork) {
  const res = await fetch(`${BASE_URL}/artwork/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artwork),
  });
  if (!res.ok) throw new Error("Failed to update artwork");
  return res.json();
}

// Delete artwork by ID
export async function deleteArtwork(id) {
  const res = await fetch(`${BASE_URL}/artwork/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete artwork");
  return res.json();
}

// -------------------- PROVENANCE --------------------

// Get all provenance records
export async function getProvenance() {
  const res = await fetch(`${BASE_URL}/provenance`);
  if (!res.ok) throw new Error("Failed to fetch provenance");
  return res.json();
}

// Create a provenance record
export async function createProvenance(record) {
  const res = await fetch(`${BASE_URL}/provenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create provenance");
  return res.json();
}

// Update provenance by ID
export async function updateProvenance(id, record) {
  const res = await fetch(`${BASE_URL}/provenance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update provenance");
  return res.json();
}

// Delete provenance by ID
export async function deleteProvenance(id) {
  const res = await fetch(`${BASE_URL}/provenance/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete provenance");
  return res.json();
}

// -------------------- EVENTS --------------------

// Get all events
export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
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