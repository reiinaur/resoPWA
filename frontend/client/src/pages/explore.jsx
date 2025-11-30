import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const searchCategories = [
    { label: 'Track Title', value: 'track' },
    { label: 'Artist', value: 'artist' },
    { label: 'Year Released', value: 'year' },
    { label: 'Genres', value: 'genre' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#1DB954' }}>
          Explore
        </h1>
        <p style={{ color: '#666' }}>Discover your music collection</p>
      </header>

      {/* Search Section */}
      <section style={{ marginBottom: '40px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '1.1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '25px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1DB954',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Categories */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {searchCategories.map(category => (
            <button
              key={category.value}
              onClick={() => navigate(`/results?q=&category=${category.value}`)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {/* Top Content Sections */}
      <div style={{ display: 'grid', gap: '30px' }}>
        {/* Top Songs */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem' }}>🔥 Top Songs</h2>
            <button 
              onClick={() => navigate('/results?view=top-songs')}
              style={{
                padding: '8px 16px',
                border: '1px solid #1DB954',
                borderRadius: '15px',
                backgroundColor: 'transparent',
                color: '#1DB954',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '30px', 
            borderRadius: '15px',
            textAlign: 'center',
            color: '#666'
          }}>
            Top songs will appear here after connecting Spotify
          </div>
        </section>

        {/* Top Albums */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem' }}>💿 Top Albums</h2>
            <button 
              onClick={() => navigate('/results?view=top-albums')}
              style={{
                padding: '8px 16px',
                border: '1px solid #1DB954',
                borderRadius: '15px',
                backgroundColor: 'transparent',
                color: '#1DB954',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '30px', 
            borderRadius: '15px',
            textAlign: 'center',
            color: '#666'
          }}>
            Top albums will appear here after connecting Spotify
          </div>
        </section>
      </div>
    </div>
  );
}