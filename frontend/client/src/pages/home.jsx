import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import './home.css';

export function Home() {
  const { theme } = useOutletContext();
  const [songOfDay, setSongOfDay] = useState(null);
  const [playlists, setPlaylists] = useState([]);
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
      
      const [songRes, playlistsRes] = await Promise.all([
        fetch(`${backendUrl}/auth/song-of-day`),
        fetch(`${backendUrl}/auth/my-playlists`)
      ]);

      if (songRes.ok) {
        const songData = await songRes.json();
        setSongOfDay(songData);
      }

      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData);
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
      'girly pop',
      'redemption arc',
      'my old study playlist',
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

  const navigateToExplore = () => {
    navigate('/explore');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading your music...</p>
      </div>
    );
  }

  return (
    <div className={`home-container ${theme}`}>
      <div className="home-container">
        {/* Header */}
        <header className="home-header">
          <h1 className="home-title">resonance</h1>
          <p className="home-subtitle">welcome to your personal music collection  ٩(^ᗜ^ )و ´-</p>
        </header>

        {/* Song of the Day Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title"> song of the day</h2>
          </div>
          {songOfDay ? (
            <div className="song-of-day-card">
              <div className="song-artwork">
                {songOfDay.image ? (
                  <img 
                    src={songOfDay.image} 
                    alt={`${songOfDay.album} cover`}
                    className="song-artwork-image"
                  />
                ) : (
                  <div className="song-artwork-placeholder">
                    🎵
                  </div>
                )}
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

        {/* Playlists Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">your playlists</h2>
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
    </div>
  );
}