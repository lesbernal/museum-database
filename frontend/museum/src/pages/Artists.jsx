import { useEffect, useState } from "react";
import { getArtists, createArtist } from "../services/api";
import ArtistForm from "../components/ArtistForm";

export default function Artists() {
  const [artists, setArtists] = useState([]);

  async function loadArtists() {
    const data = await getArtists();
    setArtists(data);
  }

  useEffect(() => {
    loadArtists();
  }, []);

  async function handleAddArtist(artist) {
    await createArtist(artist);
    loadArtists(); // refresh list
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