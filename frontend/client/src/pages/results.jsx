import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import './results.css';

export function Results() {
  const { theme } = useOutletContext();
  const [tracks, setTracks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('track'); // 'track', 'artist', 'album'

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
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const res = await fetch(
        `${backendUrl}/auth/search?q=${encodeURIComponent(query)}&type=${searchType}`
      );
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

  const clearSearch = () => {
    setQuery('');
    fetchTracks();
  };

  if (loading) {
    return (
      <div className={`loading-container ${theme}`}>
        <div className="loading-spinner"></div>
        <p>Loading music...</p>
      </div>
    );
  }

  return (
    <div className={`results-container ${theme}`}>
      <header className="results-header">
        <h1 className={`results-title ${theme}`}>search results</h1>
        <p className={`results-subtitle ${theme}`}>find your favorite music</p>
      </header>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-controls">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search tracks, artists, or albums..."
                className="search-input"
              />
              <button 
                onClick={handleSearch} 
                className="search-btn"
              >
                Search
              </button>
              <button 
              onClick={fetchTracks} 
              className="refresh-btn"
            >
              Refresh Library
            </button>
            </div>
            
            {/* Search Type Selector */}
            <div className="search-type-selector">
              <button 
                className={`type-btn ${searchType === 'track' ? 'active' : ''}`}
                onClick={() => setSearchType('track')}
              >
                Tracks
              </button>
              <button 
                className={`type-btn ${searchType === 'artist' ? 'active' : ''}`}
                onClick={() => setSearchType('artist')}
              >
                Artists
              </button>
              <button 
                className={`type-btn ${searchType === 'album' ? 'active' : ''}`}
                onClick={() => setSearchType('album')}
              >
                Albums
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-content">
        {tracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h3 className={`empty-title ${theme}`}>No tracks found</h3>
            <p className="empty-message">
              Make sure you have saved tracks in your Spotify library and try logging in again.
            </p>
            <button 
              onClick={() => window.location.href = `${backendUrl}/auth/login`}
              className="login-btn"
            >
              Login with Spotify Again
            </button>
          </div>
          ) : (
          <>
            <div className="results-header-bar">
              <h2 className={`results-count ${theme}`}>
                {query ? 'Search Results' : 'Your Library'} ({tracks.length})
              </h2>
              <div className="sort-controls">
                <select className="sort-select">
                  <option>Sort by Name</option>
                  <option>Sort by Artist</option>
                  <option>Sort by Album</option>
                </select>
              </div>
            </div>
            
            <div className="tracks-grid">
              {tracks.map(track => (
                <div key={track.id} className="track-card">
                  <div className="track-image-container">
                    {{track.album?.images?.[0]?.url || track.images?.[0]?.url || track.image_url || track.image ? (
                      <img 
                        src={track.album?.images?.[0]?.url || track.images?.[0]?.url || track.image_url || track.image}
                        alt={track.name}
                        className="track-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="track-image-placeholder">🎵</div>';
                        }}                    
                      />
                    ) : (
                      <div className="track-image-placeholder">
                        🎵
                      </div>
                    )}}
                  </div>
                  <div className="track-info">
                    <h3 className="track-name">{track.name}</h3>
                    <p className="track-artist">{track.artist}</p>
                    <p className="track-album">{track.album}</p>
                    {track.duration_ms && (
                      <p className="track-duration">
                        {Math.floor(track.duration_ms / 60000)}:
                        {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <div className="track-actions">
                    <button className="play-btn">▶</button>
                    <button className="save-btn">❤</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}