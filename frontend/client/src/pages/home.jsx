import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [songOfDay, setSongOfDay] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const backendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch song of the day
      const songRes = await fetch(`${backendUrl}/auth/song-of-day`);
      if (songRes.ok) {
        const songData = await songRes.json();
        setSongOfDay(songData);
      }

      // Fetch user playlists
      const playlistsRes = await fetch(`${backendUrl}/auth/my-playlists`);
      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${backendUrl}/auth/login`;
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#1DB954' }}>
          My Music
        </h1>
        <p style={{ color: '#666' }}>Your personal music collection</p>
      </header>

      {/* Song of the Day Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>🎵 Song of the Day</h2>
        {songOfDay ? (
          <div style={{
            background: 'linear-gradient(135deg, #1DB954, #191414)',
            padding: '30px',
            borderRadius: '15px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              backgroundColor: '#333',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              🎶
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 10px 0' }}>
                {songOfDay.name}
              </h3>
              <p style={{ margin: '0 0 5px 0', opacity: 0.9 }}>
                {songOfDay.artist}
              </p>
              <p style={{ margin: 0, opacity: 0.7 }}>
                {songOfDay.album}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '30px',
            border: '2px dashed #ccc',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <p>No song of the day selected</p>
            <button 
              onClick={handleLogin}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1DB954',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Connect Spotify to see your song
            </button>
          </div>
        )}
      </section>

      {/* Playlists Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem' }}>📚 Featured Playlists</h2>
          <span style={{ color: '#666' }}>{playlists.length} playlists</span>
        </div>
        
        {playlists.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {playlists.map(playlist => (
              <div 
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist.id)}
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {playlist.image ? (
                  <img 
                    src={playlist.image} 
                    alt={playlist.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#1DB954',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'white'
                  }}>
                    🎵
                  </div>
                )}
                <h3 style={{ 
                  margin: '0 0 5px 0',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {playlist.name}
                </h3>
                <p style={{ 
                  margin: '0 0 5px 0', 
                  color: '#666', 
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {playlist.owner}
                </p>
                <p style={{ 
                  margin: 0, 
                  color: '#666', 
                  fontSize: '0.8rem' 
                }}>
                  {playlist.tracks} songs
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            border: '2px dashed #ccc',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <p>No playlists found</p>
            <button 
              onClick={handleLogin}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1DB954',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Connect Spotify to see your playlists
            </button>
          </div>
        )}
      </section>
    </div>
  );
}