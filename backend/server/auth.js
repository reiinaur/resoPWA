import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import pool from './db.js';

dotenv.config();

const router = express.Router();
const redirectUri = process.env.REDIRECT_URI;
const scopes = 'user-library-read playlist-read-private user-read-private user-read-email user-top-read user-read-recently-played';

async function getMyAccessToken() {
  try {
    const authHeader = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: querystring.stringify({
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok) {
      throw new Error(`Token error: ${tokenData.error}`);
    }
    
    return tokenData.access_token;
  } catch (err) {
    console.error('Error getting app access token:', err);
    throw err;
  }
}

async function getUserAccessToken() {
  try {
    const result = await pool.query(`
      SELECT access_token FROM users 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('Found user access token in database');
      return result.rows[0].access_token;
    } else {
      console.log('No user token found, using app authentication');
      return await getMyAccessToken();
    }
  } catch (err) {
    console.error('Error getting user access token:', err);
    return await getMyAccessToken();
  }
}

router.get('/login', (req, res) => {
  const params = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri,
    state: 'some_random_state_string'
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  
  if (error) {
    console.error('Spotify auth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }

  try {
    const authHeader = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok) {
      console.error('Token error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    
    if (!accessToken) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_token`);
    }

    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!userRes.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const userData = await userRes.json();
    console.log('User authenticated:', userData.display_name, 'ID:', userData.id);

    await pool.query(
      `INSERT INTO users (spotify_id, access_token, refresh_token, display_name, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (spotify_id) 
       DO UPDATE SET access_token = $2, refresh_token = $3, display_name = $4, email = $5, updated_at = CURRENT_TIMESTAMP`,
      [userData.id, accessToken, refreshToken, userData.display_name, userData.email]
    );

    let savedCount = 0;
    
    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (tracksRes.ok) {
      const tracksData = await tracksRes.json();
      
      if (tracksData.items && tracksData.items.length > 0) {
        for (let item of tracksData.items) {
          const t = item.track;
          await pool.query(
            `INSERT INTO tracks(id, name, artist, album, user_id)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT(id) DO UPDATE SET name = $2, artist = $3, album = $4, user_id = $5`,
            [t.id, t.name, t.artists.map(a => a.name).join(', '), t.album.name, userData.id]
          );
          savedCount++;
        }
        console.log(`Successfully saved ${savedCount} tracks for user ${userData.display_name}`);
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}?auth_success=true&user_name=${encodeURIComponent(userData.display_name)}&saved_tracks=${savedCount}`);

  } catch (err) {
    console.error('Spotify callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
});

router.get('/song-of-day', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT * FROM tracks 
      ORDER BY MD5(id || $1) 
      LIMIT 1
    `, [today]);
    
    if (result.rows.length > 0) {
      console.log(`Song of the day for ${today}:`, result.rows[0].name);
      res.json(result.rows[0]);
    } else {
      try {
        const accessToken = await getUserAccessToken();
        const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          if (tracksData.items && tracksData.items.length > 0) {
            const randomIndex = Math.abs(
              today.split('-').reduce((a, b) => a + parseInt(b), 0)
            ) % tracksData.items.length;
            
            const track = tracksData.items[randomIndex].track;
            const songOfDay = {
              id: track.id,
              name: track.name,
              artist: track.artists.map(a => a.name).join(', '),
              album: track.album.name
            };
            console.log(`Spotify fallback song of the day for ${today}:`, songOfDay.name);
            res.json(songOfDay);
          } else {
            res.json(null);
          }
        } else {
          res.json(null);
        }
      } catch (spotifyErr) {
        console.error('Error fetching song from Spotify:', spotifyErr);
        res.json(null);
      }
    }
  } catch (err) {
    console.error('Error fetching song of day:', err);
    res.status(500).json({ error: 'Error fetching song of day' });
  }
});

router.get('/my-playlists', async (req, res) => {
  try {
    const accessToken = await getUserAccessToken();
    
    const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!playlistsRes.ok) {
      console.log('User playlists failed, trying featured playlists');
      const featuredRes = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=20', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!featuredRes.ok) {
        throw new Error('Both user and featured playlists failed');
      }

      const featuredData = await featuredRes.json();
      const formattedPlaylists = featuredData.playlists.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks: playlist.tracks.total,
        image: playlist.images[0]?.url,
        owner: playlist.owner.display_name
      }));

      console.log(`Fetched ${formattedPlaylists.length} featured playlists`);
      return res.json(formattedPlaylists);
    }

    const playlistsData = await playlistsRes.json();
    
    const formattedPlaylists = playlistsData.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      tracks: playlist.tracks.total,
      image: playlist.images[0]?.url,
      owner: playlist.owner.display_name,
      public: playlist.public
    }));

    console.log(`Fetched ${formattedPlaylists.length} user playlists`);
    res.json(formattedPlaylists);

  } catch (err) {
    console.error('Error fetching playlists:', err);
    res.status(500).json({ 
      error: 'Unable to load playlists. Please reconnect your Spotify account.',
      details: err.message 
    });
  }
});

router.get('/top-tracks', async (req, res) => {
  try {
    const accessToken = await getUserAccessToken();
    
    const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!tracksRes.ok) {
      console.log('Top tracks failed, trying recently played');
      const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!recentRes.ok) {
        const savedRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=10', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!savedRes.ok) {
          throw new Error('All track endpoints failed');
        }

        const savedData = await savedRes.json();
        const formattedTracks = savedData.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map(artist => artist.name).join(', '),
          album: item.track.album.name,
          image: item.track.album.images[0]?.url,
          duration: item.track.duration_ms,
          preview_url: item.track.preview_url
        }));

        console.log(`Fetched ${formattedTracks.length} saved tracks as fallback`);
        return res.json(formattedTracks);
      }

      const recentData = await recentRes.json();
      const formattedTracks = recentData.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        image: item.track.album.images[0]?.url,
        duration: item.track.duration_ms,
        preview_url: item.track.preview_url
      }));

      console.log(`Fetched ${formattedTracks.length} recently played tracks`);
      return res.json(formattedTracks);
    }

    const tracksData = await tracksRes.json();
    
    const formattedTracks = tracksData.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      duration: track.duration_ms,
      preview_url: track.preview_url
    }));

    console.log(`Fetched ${formattedTracks.length} top tracks`);
    res.json(formattedTracks);
  } catch (err) {
    console.error('Error fetching top tracks:', err);
    res.status(500).json({ 
      error: 'Unable to load top tracks',
      details: err.message 
    });
  }
});

router.get('/top-artists', async (req, res) => {
  try {
    const accessToken = await getUserAccessToken();
    
    const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!artistsRes.ok) {
      console.log('Top artists failed, trying artists from saved tracks');
      const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!tracksRes.ok) {
        throw new Error('All artist endpoints failed');
      }

      const tracksData = await tracksRes.json();
      
      const artistMap = new Map();
      tracksData.items.forEach(item => {
        item.track.artists.forEach(artist => {
          if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              image: null,
              genres: [],
              followers: 0
            });
          }
        });
      });

      const formattedArtists = Array.from(artistMap.values()).slice(0, 10);
      console.log(`Fetched ${formattedArtists.length} artists from saved tracks`);
      return res.json(formattedArtists);
    }

    const artistsData = await artistsRes.json();
    
    const formattedArtists = artistsData.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url,
      genres: artist.genres.slice(0, 3),
      followers: artist.followers.total
    }));

    console.log(`Fetched ${formattedArtists.length} top artists`);
    res.json(formattedArtists);
  } catch (err) {
    console.error('Error fetching top artists:', err);
    res.status(500).json({ 
      error: 'Unable to load top artists',
      details: err.message 
    });
  }
});

router.get('/top-albums', async (req, res) => {
  try {
    const accessToken = await getUserAccessToken();
    
    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!tracksRes.ok) {
      throw new Error('Failed to fetch tracks for albums');
    }

    const tracksData = await tracksRes.json();
    
    const albumMap = new Map();
    tracksData.items.forEach(item => {
      const album = item.track.album;
      if (!albumMap.has(album.id)) {
        albumMap.set(album.id, {
          id: album.id,
          name: album.name,
          artist: album.artists.map(artist => artist.name).join(', '),
          image: album.images[0]?.url,
          track_count: 1,
          release_date: album.release_date
        });
      } else {
        albumMap.get(album.id).track_count++;
      }
    });

    const formattedAlbums = Array.from(albumMap.values())
      .sort((a, b) => b.track_count - a.track_count)
      .slice(0, 10);

    console.log(`Fetched ${formattedAlbums.length} top albums`);
    res.json(formattedAlbums);
  } catch (err) {
    console.error('Error fetching top albums:', err);
    res.status(500).json({ 
      error: 'Unable to load top albums',
      details: err.message 
    });
  }
});

router.get('/playlist/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const accessToken = await getUserAccessToken();

    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!playlistRes.ok) {
      throw new Error('Failed to fetch playlist');
    }

    const playlistData = await playlistRes.json();
    
    const formattedPlaylist = {
      id: playlistData.id,
      name: playlistData.name,
      description: playlistData.description,
      followers: playlistData.followers?.total || 0,
      image: playlistData.images[0]?.url,
      owner: playlistData.owner.display_name,
      public: playlistData.public,
      tracks: playlistData.tracks.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        duration: item.track.duration_ms,
        preview_url: item.track.preview_url
      }))
    };

    res.json(formattedPlaylist);

  } catch (err) {
    console.error('Error fetching playlist details:', err);
    res.status(500).json({ error: 'Error fetching playlist details' });
  }
});

router.get('/tracks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tracks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tracks:', err);
    res.status(500).json({ error: 'Error fetching tracks' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      const result = await pool.query('SELECT * FROM tracks ORDER BY created_at DESC');
      return res.json(result.rows);
    }

    const result = await pool.query(
      `SELECT * FROM tracks 
       WHERE name ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1 
       ORDER BY created_at DESC`,
      [`%${q}%`]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Error searching tracks' });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

router.get('/debug-user', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users ORDER BY updated_at DESC LIMIT 1');
    const hasUser = usersResult.rows.length > 0;
    
    const tracksResult = await pool.query('SELECT COUNT(*) as count FROM tracks');
    const trackCount = tracksResult.rows[0].count;
    
    res.json({
      has_user: hasUser,
      user_data: hasUser ? {
        display_name: usersResult.rows[0].display_name,
        last_updated: usersResult.rows[0].updated_at
      } : null,
      track_count: trackCount,
      environment: {
        client_id_set: !!process.env.SPOTIFY_CLIENT_ID,
        client_secret_set: !!process.env.SPOTIFY_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;