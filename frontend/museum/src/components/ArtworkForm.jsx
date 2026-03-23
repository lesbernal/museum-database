import { useState } from "react";

export default function ArtworkForm({ onSubmit, initialData = null, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    artist_id: "",
    year_created: "",
    medium: "",
    dimensions: "",
  });

  useState(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);

    if (!initialData) {
      setForm({
        title: "",
        artist_id: "",
        year_created: "",
        medium: "",
        dimensions: "",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{initialData ? "Edit Artwork" : "Add Artwork"}</h3>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input name="artist_id" placeholder="Artist ID" value={form.artist_id} onChange={handleChange} required />
      <input name="year_created" placeholder="Year Created" value={form.year_created} onChange={handleChange} />
      <input name="medium" placeholder="Medium" value={form.medium} onChange={handleChange} />
      <input name="dimensions" placeholder="Dimensions" value={form.dimensions} onChange={handleChange} />
      <button type="submit">{initialData ? "Update Artwork" : "Add Artwork"}</button>
      {initialData && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}