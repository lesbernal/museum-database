
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

// MUSEUM BUILDINGS
export async function getBuildings() {
  const res = await fetch(`${BASE_URL}/buildings`);
  if (!res.ok) throw new Error("Failed to fetch buildings");
  return res.json();
}

export async function createBuilding(data) {
  const res = await fetch(`${BASE_URL}/buildings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create building");
  return res.json();
}

export async function updateBuilding(id, data) {
  const res = await fetch(`${BASE_URL}/buildings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update building");
  return res.json();
}

export async function deleteBuilding(id) {
  const res = await fetch(`${BASE_URL}/buildings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete building");
  return res.json();
}

// EXHIBITIONS

export async function getExhibitions() {
  const res = await fetch(`${BASE_URL}/exhibitions`);
  if (!res.ok) throw new Error("Failed to fetch exhibitions");
  return res.json();
}

export async function createExhibition(data) {
  const res = await fetch(`${BASE_URL}/exhibitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create exhibition");
  return res.json();
}

export async function updateExhibition(id, data) {
  const res = await fetch(`${BASE_URL}/exhibitions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update exhibition");
  return res.json();
}

export async function deleteExhibition(id) {
  const res = await fetch(`${BASE_URL}/exhibitions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete exhibition");
  return res.json();
}