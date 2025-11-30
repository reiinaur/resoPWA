import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const storedTracks = localStorage.getItem('spotifyTracks');
    if (storedTracks) {
      try {
        setTracks(JSON.parse(storedTracks));
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
