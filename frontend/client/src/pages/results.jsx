import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('spotifyTracks');
    if (stored) {
      try {
        setTracks(JSON.parse(stored));
      } catch (err) {
        console.error('Error parsing tracks from localStorage:', err);
      }
    }
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
