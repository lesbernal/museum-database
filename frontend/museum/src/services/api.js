
const BASE_URL = "http://localhost:5000";

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