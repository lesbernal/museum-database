import { useEffect, useState } from "react";
import { getArtists, createArtist, updateArtist, deleteArtist } from "../services/api";
import ArtistForm from "../components/ArtistForm";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [editingArtist, setEditingArtist] = useState(null); // new state for editing

  async function loadArtists() {
    try {
      const data = await getArtists();
      setArtists(data);
    } catch (err) {
      console.error("Failed to load artists:", err);
    }
  }

  useEffect(() => { loadArtists(); }, []);

  // Add new artist
  async function handleAddArtist(artist) {
    try {
      await createArtist(artist);
      loadArtists();
    } catch (err) { console.error(err); }
  }

  // Update existing artist
  async function handleUpdateArtist(artist) {
    try {
      await updateArtist(editingArtist.artist_id, artist);
      setEditingArtist(null); // exit edit mode
      loadArtists();
    } catch (err) { console.error(err); }
  }

  // Delete artist
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this artist? It will be gone forever...")) return;
    try {
      await deleteArtist(id);
      loadArtists();
    } catch (err) { console.error(err); }
  }

  return (
    <div>
      <h1>Artists</h1>

      {/* Add or Edit Form */}
      <ArtistForm
        onSubmit={editingArtist ? handleUpdateArtist : handleAddArtist}
        initialData={editingArtist}
        onCancel={() => setEditingArtist(null)}
      />

      <h3>Artist List</h3>
      <ul>
        {artists.map((a) => (
          <li key={a.artist_id}>
            {a.first_name} {a.last_name} ({a.nationality})
            <button onClick={() => setEditingArtist(a)}>Edit</button>
            <button onClick={() => handleDelete(a.artist_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}