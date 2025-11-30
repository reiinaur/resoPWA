import { useEffect, useState } from 'react';

export function Results() {
  const [tracks, setTracks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const count = urlParams.get('count');
    
    if (success) {
      console.log('OAuth successful, fetched', count, 'tracks');
      // Clear the URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      console.log('Fetching tracks from:', `${backendUrl}/auth/tracks`);
      const res = await fetch(`${backendUrl}/auth/tracks`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched tracks:', data.length);
        setTracks(data);
        localStorage.setItem('spotifyTracks', JSON.stringify(data));
      } else {
        console.error('Failed to fetch tracks. Status:', res.status);
        const stored = localStorage.getItem('spotifyTracks');
        if (stored) {
          console.log('Using stored tracks from localStorage');
          setTracks(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      const stored = localStorage.getItem('spotifyTracks');
      if (stored) {
        console.log('Using stored tracks from localStorage after error');
        setTracks(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query) {
      fetchTracks(); 
      return;
    }
    
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

  const testBackend = async () => {
    try {
      const response = await fetch(`${backendUrl}/auth/tracks`);
      const data = await response.json();
      console.log('Backend test - tracks:', data);
      alert(`Backend returned ${data.length} tracks`);
    } catch (error) {
      console.error('Backend test failed:', error);
      alert('Backend connection failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading tracks...</p>
        <button onClick={fetchTracks} style={{ padding: '5px 10px', margin: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '0 20px' }}>
      <h1>My Spotify Tracks</h1>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testBackend}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Test Backend Connection
        </button>
      </div>
      
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
          <p>This could mean:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block', margin: '20px 0' }}>
            <li>You haven't logged in with Spotify yet</li>
            <li>You don't have any saved tracks in your Spotify library</li>
            <li>There's a connection issue with the backend</li>
          </ul>
          <button 
            onClick={() => window.location.href = `${backendUrl}/auth/login`}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Login with Spotify
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