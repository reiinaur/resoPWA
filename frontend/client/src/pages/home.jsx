import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

export function Home() {
  const [songOfDay, setSongOfDay] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const backendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [songRes, playlistsRes, topTracksRes, topAlbumsRes] = await Promise.all([
        fetch(`${backendUrl}/auth/song-of-day`),
        fetch(`${backendUrl}/auth/my-playlists`),
        fetch(`${backendUrl}/auth/top-tracks`),
        fetch(`${backendUrl}/auth/top-albums`)
      ]);

      if (songRes.ok) {
        const songData = await songRes.json();
        setSongOfDay(songData);
      }

      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData);
      }

      if (topTracksRes.ok) {
        const topTracksData = await topTracksRes.json();
        setTopTracks(topTracksData);
      }

      if (topAlbumsRes.ok) {
        const topAlbumsData = await topAlbumsRes.json();
        setTopAlbums(topAlbumsData);
      }

    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Failed to load music data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filterPlaylists = (playlists) => {
    const hiddenPlaylists = [
      'drive',
      'fam',
      'My Summer Soundtrack',
      'femme fatale',
      'mp4',
      'chill',
      '૮ . . ྀིა',
      'coming of age',
      'My 2024 Playlist in a Bottle',
      'cutesy',
      'study study study',
      'a',
      'redemption arc',
      'b',
    ];
    
    return playlists.filter(playlist => 
      !hiddenPlaylists.some(hidden => 
        playlist.name.includes(hidden)
      )
    );
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  const handleReconnect = () => {
    window.location.href = `${backendUrl}/auth/login`;
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading your music...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1 className="home-title">My Music Dashboard</h1>
        <p className="home-subtitle">Your personal Spotify collection</p>
        
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button className="reconnect-btn" onClick={handleReconnect}>
              Reconnect Spotify
            </button>
          </div>
        )}
      </header>

      {/* Song of the Day Section */}
      <section className="section">
        <h2 className="section-title">Song of the Day</h2>
        {songOfDay ? (
          <div className="song-of-day-card">
            <div className="song-artwork">
              🎶
            </div>
            <div className="song-info">
              <h3 className="song-name">{songOfDay.name}</h3>
              <p className="song-artist">{songOfDay.artist}</p>
              <p className="song-album">{songOfDay.album}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No song of the day available</p>
          </div>
        )}
      </section>

      {/* Top Songs Preview */}
      {topTracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">🔥 Your Top Songs</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/explore')}
            >
              View All
            </button>
          </div>
          <div className="tracks-grid">
            {topTracks.slice(0, 6).map(track => (
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
                <h3 className="track-name">{track.name}</h3>
                <p className="track-artist">{track.artist}</p>
                {track.duration && (
                  <p className="track-duration">{formatDuration(track.duration)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Albums Preview */}
      {topAlbums.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">💿 Your Top Albums</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/explore')}
            >
              View All
            </button>
          </div>
          <div className="albums-grid">
            {topAlbums.slice(0, 6).map(album => (
              <div key={album.id} className="album-card">
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
                <h3 className="album-name">{album.name}</h3>
                <p className="album-artist">{album.artist}</p>
                <p className="album-tracks">{album.track_count} tracks</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">📚 Your Playlists</h2>
          <div className="section-controls">
            <span className="playlist-count">
              {filterPlaylists(playlists).length} playlists
            </span>
            <button 
              className="refresh-btn"
              onClick={fetchHomeData}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {filterPlaylists(playlists).length > 0 ? (
          <div className="playlists-grid">
            {filterPlaylists(playlists).map(playlist => (
              <div 
                key={playlist.id}
                className="playlist-card"
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                {playlist.image ? (
                  <img 
                    src={playlist.image} 
                    alt={playlist.name}
                    className="playlist-image"
                  />
                ) : (
                  <div className="playlist-image-placeholder">
                    🎵
                  </div>
                )}
                <h3 className="playlist-name">{playlist.name}</h3>
                <p className="playlist-owner">{playlist.owner}</p>
                <p className="playlist-tracks">{playlist.tracks} songs</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No playlists found in your account</p>
            <p className="empty-state-help">
              Make sure you have playlists in your Spotify account
            </p>
            <button 
              className="reconnect-btn"
              onClick={handleReconnect}
            >
              Reconnect Spotify Account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}