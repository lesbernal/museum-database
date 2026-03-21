import { useState } from "react";

export default function ArtistForm({ onAdd }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_year: "",
    death_year: "",
    nationality: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onAdd(form);

    setForm({
      first_name: "",
      last_name: "",
      birth_year: "",
      death_year: "",
      nationality: "",
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Artist</h3>

      <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
      <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
      <input name="birth_year" placeholder="Birth Year" value={form.birth_year} onChange={handleChange} />
      <input name="death_year" placeholder="Death Year" value={form.death_year} onChange={handleChange} />
      <input name="nationality" placeholder="Nationality" value={form.nationality} onChange={handleChange} />

      <button type="submit">Add Artist</button>
    </form>
  );
}