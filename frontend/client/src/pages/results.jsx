import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/auth/tracks`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
        localStorage.setItem('spotifyTracks', JSON.stringify(data));
      } else {
        console.error('Failed to fetch tracks:', res.status);
        const stored = localStorage.getItem('spotifyTracks');
        if (stored) setTracks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      const stored = localStorage.getItem('spotifyTracks');
      if (stored) setTracks(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/auth/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '0 20px' }}>
      <h1>My Spotify Tracks</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search tracks, artists, or albums..."
          style={{ 
            padding: '10px', 
            flex: 1, 
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={handleSearch} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
        <button 
          onClick={fetchTracks} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh All
        </button>
      </div>

      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>No tracks found in your library.</p>
          <p>Make sure you have saved tracks in your Spotify library and try logging in again.</p>
          <button 
            onClick={() => window.location.href = `${backendUrl}/auth/login`}
            style={{
              padding: '10px 20px',
              backgroundColor: '#797979ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Login with Spotify Again
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '20px' }}>Found {tracks.length} tracks</p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {tracks.map(track => (
              <div 
                key={track.id} 
                style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{track.name}</div>
                <div style={{ color: '#666' }}>Artist: {track.artist}</div>
                <div style={{ color: '#666' }}>Album: {track.album}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}