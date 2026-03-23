import { useState, useEffect } from "react";

export default function ArtistForm({ onSubmit, initialData = null, onCancel }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_year: "",
    death_year: "",
    nationality: "",
    biography: "",
  });

  // If initialData is provided, prefill the form (for edit)
  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);

    // Reset form if adding (not editing)
    if (!initialData) {
      setForm({
        first_name: "",
        last_name: "",
        birth_year: "",
        death_year: "",
        nationality: "",
        biography: "",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{initialData ? "Edit Artist" : "Add Artist"}</h3>
      <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
      <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
      <input name="birth_year" placeholder="Birth Year" value={form.birth_year} onChange={handleChange} />
      <input name="death_year" placeholder="Death Year" value={form.death_year} onChange={handleChange} />
      <input name="nationality" placeholder="Nationality" value={form.nationality} onChange={handleChange} />
      <textarea name="biography" placeholder="Biography" value={form.biography} onChange={handleChange} />
      <button type="submit">{initialData ? "Update Artist" : "Add Artist"}</button>
      {initialData && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}