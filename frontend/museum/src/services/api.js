const BASE_URL = "http://localhost:5000";

// ---------- ARTISTS ----------

// GET all artists
export async function getArtists() {
  const res = await fetch(`${BASE_URL}/artists`);
  return res.json();
}

// CREATE artist
export async function createArtist(artist) {
  const res = await fetch(`${BASE_URL}/artists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(artist),
  });

  return res.json();
}