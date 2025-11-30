import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function Details() {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/auth/playlist/${id}`);
      if (res.ok) {
        const playlistData = await res.json();
        setPlaylist(playlistData);
      }
    } catch (error) {
      console.error('Error fetching playlist details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Playlist not found</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 16px',
          border: '1px solid #ccc',
          borderRadius: '20px',
          backgroundColor: 'white',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Back
      </button>

      {/* Playlist Header */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'flex-end' }}>
        {playlist.image ? (
          <img 
            src={playlist.image} 
            alt={playlist.name}
            style={{
              width: '250px',
              height: '250px',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          />
        ) : (
          <div style={{
            width: '250px',
            height: '250px',
            backgroundColor: '#1DB954',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            color: 'white'
          }}>
            🎵
          </div>
        )}
        
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#1DB954', fontWeight: 'bold' }}>
            PLAYLIST
          </p>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>
            {playlist.name}
          </h1>
          <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '1.1rem' }}>
            {playlist.description}
          </p>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: '#666' }}>
            <span style={{ fontWeight: 'bold' }}>{playlist.owner}</span>
            <span>•</span>
            <span>{playlist.followers.toLocaleString()} followers</span>
            <span>•</span>
            <span>{playlist.tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <section>
        <h2 style={{ marginBottom: '20px' }}>Tracks</h2>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
          {playlist.tracks.map((track, index) => (
            <div 
              key={track.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px 20px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
              }}
            >
              <span style={{ width: '30px', color: '#666' }}>{index + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{track.name}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{track.artist}</div>
              </div>
              <div style={{ color: '#666', marginRight: '20px' }}>{track.album}</div>
              <div style={{ color: '#666', width: '60px', textAlign: 'right' }}>
                {formatDuration(track.duration)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}