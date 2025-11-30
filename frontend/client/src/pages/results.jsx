import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);
  const [query, setQuery] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL;
  const spotifyId = localStorage.getItem('spotifyId'); 

  useEffect(() => {
    const stored = localStorage.getItem('spotifyTracks');
    if (stored) setTracks(JSON.parse(stored));
  }, []);

  const handleSearch = async () => {
    if (!query) return;
    const res = await fetch(`${backendUrl}/auth/search?q=${encodeURIComponent(query)}&user=${spotifyId}`);
    const data = await res.json();
    setTracks(data);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto' }}>
      <h1>My Spotify Tracks</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tracks..."
          style={{ padding: '5px', width: '70%' }}
        />
        <button onClick={handleSearch} style={{ padding: '5px 10px', marginLeft: '10px' }}>
          Search
        </button>
      </div>

      {tracks.length === 0 ? (
        <p>No tracks yet. Login and fetch from Spotify first.</p>
      ) : (
        <ul>
          {tracks.map(track => (
            <li key={track.id} style={{ marginBottom: '10px' }}>
              <strong>{track.name}</strong> by {track.artist} ({track.album})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
