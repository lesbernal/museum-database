import { useEffect, useState } from "react";
import { getArtists, createArtist } from "../services/api";
import ArtistForm from "../components/ArtistForm";

export default function Artists() {
  const [artists, setArtists] = useState([]);

  async function loadArtists() {
    try {
      const data = await getArtists();
      setArtists(data);
    } catch (err) {
      console.error("Failed to load artists:", err);
    }
  }

  useEffect(() => {
    loadArtists();
  }, []);

  async function handleAddArtist(artist) {
    console.log("Submitting artist:", artist);
    try {
      const result = await createArtist(artist);
      console.log("Backend response:", result);
      loadArtists(); // refresh list after adding
    } catch (err) {
      console.error("Error adding artist:", err);
    }
  }

  return (
    <div>
      <h1>Artists</h1>
      <ArtistForm onAdd={handleAddArtist} />
      <h3>Artist List</h3>
      <ul>
        {artists.map((a) => (
          <li key={a.artist_id}>
            {a.first_name} {a.last_name} ({a.nationality})
          </li>
        ))}
      </ul>
    </div>
  );
}