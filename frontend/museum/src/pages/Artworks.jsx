import { useEffect, useState } from "react";
import { getArtworks, createArtwork, updateArtwork, deleteArtwork } from "../services/api";
import ArtworkForm from "../components/ArtworkForm";

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [editingArtwork, setEditingArtwork] = useState(null);

  useEffect(() => { loadArtworks(); }, []);

  async function loadArtworks() {
    try {
      const data = await getArtworks();
      setArtworks(data);
    } catch (err) { console.error(err); }
  }

  async function handleAddArtwork(artwork) {
    try { await createArtwork(artwork); loadArtworks(); } catch (err) { console.error(err); }
  }

  async function handleUpdateArtwork(artwork) {
    try { await updateArtwork(editingArtwork.artwork_id, artwork); setEditingArtwork(null); loadArtworks(); } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this artwork?")) return;
    try { await deleteArtwork(id); loadArtworks(); } catch (err) { console.error(err); }
  }

  return (
    <div>
      <h1>Artworks</h1>
      <ArtworkForm
        onSubmit={editingArtwork ? handleUpdateArtwork : handleAddArtwork}
        initialData={editingArtwork}
        onCancel={() => setEditingArtwork(null)}
      />

      <h3>Artwork List</h3>
      <ul>
        {artworks.map(a => (
          <li key={a.artwork_id}>
            {a.title} by Artist {a.artist_id} ({a.year_created})
            <button onClick={() => setEditingArtwork(a)}>Edit</button>
            <button onClick={() => handleDelete(a.artwork_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}