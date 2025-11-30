import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);
  const backendUrl = import.meta.env.VITE_API_URL; 

  useEffect(() => {
    fetch(`${backendUrl}/tracks`)
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error('Error fetching tracks:', err));
  }, []);

  return (
    <div>
      <h1>My Spotify Tracks</h1>
      {tracks.length === 0 ? (
        <p>No tracks yet. Login and fetch from Spotify first.</p>
      ) : (
        <ul>
          {tracks.map(track => (
            <li key={track.id}>
              {track.name} by {track.artist} ({track.album})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
