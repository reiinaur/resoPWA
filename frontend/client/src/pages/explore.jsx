import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import './explore.css';

export function Explore() {
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const backendUrl = import.meta.env.VITE_API_URL;
  const { theme } = useOutletContext();

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      
      const [tracksRes, albumsRes, artistsRes] = await Promise.all([
        fetch(`${backendUrl}/auth/top-tracks`),
        fetch(`${backendUrl}/auth/top-albums`),
        fetch(`${backendUrl}/auth/top-artists`)
      ]);

      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        setTopTracks(tracksData);
      }

      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        setTopAlbums(albumsData);
      }

      if (artistsRes.ok) {
        const artistsData = await artistsRes.json();
        setTopArtists(artistsData);
      }

    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const handleItemClick = (item, type) => {
    if (item.external_urls?.spotify) {
      window.open(item.external_urls.spotify, '_blank', 'noopener,noreferrer');
    } else {
      console.log(`${type} clicked:`, item.name);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading your top content...</p>
      </div>
    );
  }

  return (
    <div className={`explore-container ${theme}`}>
      <div className="explore-container">
        {/* Header */}
        <header className="explore-header">
          <h1 className="explore-title">explore your music</h1>
          <p className="explore-subtitle">what have you been listening to recently?</p>
        </header>

        {/* Search Section */}
        <section className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs, artists, albums..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>
        </section>

        {/* Top Tracks Section */}
        <section className="content-section">
          <h2 className="content-title">your top songs</h2>
          <div className="tracks-grid">
            {topTracks.map(track => (
              <div key={track.id} className="track-card">
                {track.image ? (
                  <img 
                    src={track.image} 
                    alt={track.name}
                    className="track-image"
                  />
                ) : (
                  <div className="track-image-placeholder">
                    🎵
                  </div>
                )}
                <div className="track-info">
                  <h3 className="track-name">{track.name}</h3>
                  <p className="track-artist">{track.artist}</p>
                  {track.duration && (
                    <p className="track-duration">{formatDuration(track.duration)}</p>
                  )}
                  {track.external_urls?.spotify && (
                    <div className="spotify-indicator">
                      <span className="spotify-icon-small">▶️</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Albums Section */}
        <section className="content-section">
          <h2 className="content-title">your top albums</h2>
          <div className="albums-grid">
            {topAlbums.map(album => (
              <div key={album.id} className="album-card" onClick={() => handleItemClick(album, 'album')} title={album.external_urls?.spotify ? "Click to open in Spotify" : "Click for details"}>
                {album.image ? (
                  <img 
                    src={album.image} 
                    alt={album.name}
                    className="album-image"
                  />
                ) : (
                  <div className="album-image-placeholder">
                    💿
                  </div>
                )}
                <div className="album-info">
                  <h3 className="album-name">{album.name}</h3>
                  <p className="album-artist">{album.artist}</p>
                  <p className="album-tracks">{album.track_count} tracks</p>
                  {album.external_urls?.spotify && (
                    <div className="spotify-indicator">
                      <span className="spotify-icon-small">▶️</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Artists Section */}
        {topArtists.length > 0 && (
          <section className="content-section">
            <h2 className="content-title">your top artists</h2>
            <div className="artists-grid">
              {topArtists.map(artist => (
                <div key={artist.id} className="artist-card" onClick={() => handleItemClick(artist, 'artist')} title={artist.external_urls?.spotify ? "Click to open in Spotify" : "Click for details"}>
                  {artist.image ? (
                    <img 
                      src={artist.image} 
                      alt={artist.name}
                      className="artist-image"
                    />
                  ) : (
                    <div className="artist-image-placeholder">
                      👤
                    </div>
                  )}
                  <div className="artist-info">
                    <h3 className="artist-name">{artist.name}</h3>
                    {artist.followers > 0 && (
                      <p className="artist-followers">
                        {artist.followers.toLocaleString()} followers
                      </p>
                    )}
                    {artist.external_urls?.spotify && (
                      <div className="spotify-indicator">
                        <span className="spotify-icon-small">▶️</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}