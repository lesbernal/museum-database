import { useEffect, useState } from "react";

function Artists() {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/artists")
      .then(res => res.json())
      .then(data => setArtists(data));
  }, []);

  return (
    <div>
      <h2>Artists</h2>
      {artists.map(artist => (
        <p key={artist.artist_id}>
          {artist.first_name} {artist.last_name}
        </p>
      ))}
    </div>
  );
}

export default Artists;