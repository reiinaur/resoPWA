import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import pool from './db.js';

dotenv.config();

const router = express.Router();
const redirectUri = process.env.REDIRECT_URI;
const scopes = 'user-library-read playlist-read-private user-read-private user-read-email';

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
    console.error('Error getting access token:', err);
    throw err;
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
    let nextUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';
    
    const tracksRes = await fetch(nextUrl, {
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

router.get('/my-playlists', async (req, res) => {
  try {
    const accessToken = await getMyAccessToken();
    
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!userRes.ok) {
      throw new Error('Failed to fetch user profile - app may need reauthentication');
    }
    
    const userData = await userRes.json();
    const userId = userData.id;
    
    const playlistsRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!playlistsRes.ok) {
      throw new Error('Failed to fetch user playlists');
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

    console.log(`Fetched ${formattedPlaylists.length} playlists for user ${userData.display_name}`);
    res.json(formattedPlaylists);

  } catch (err) {
    console.error('Error fetching user playlists:', err);
    
    try {
      console.log('Falling back to featured playlists');
      const accessToken = await getMyAccessToken();
      const playlistsRes = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=20', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!playlistsRes.ok) {
        throw new Error('Featured playlists also failed');
      }

      const playlistsData = await playlistsRes.json();
      const formattedPlaylists = playlistsData.playlists.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks: playlist.tracks.total,
        image: playlist.images[0]?.url,
        owner: playlist.owner.display_name
      }));

      console.log(`Fetched ${formattedPlaylists.length} featured playlists as fallback`);
      res.json(formattedPlaylists);
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      res.status(500).json({ 
        error: 'Unable to load playlists. Please reconnect your Spotify account.',
        details: fallbackErr.message 
      });
    }
  }
});

router.get('/song-of-day', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM tracks 
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      try {
        const accessToken = await getMyAccessToken();
        const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          if (tracksData.items && tracksData.items.length > 0) {
            const track = tracksData.items[0].track;
            const songOfDay = {
              id: track.id,
              name: track.name,
              artist: track.artists.map(a => a.name).join(', '),
              album: track.album.name
            };
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

router.get('/playlist/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const accessToken = await getMyAccessToken();

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

router.get('/top-tracks', async (req, res) => {
  try {
    const accessToken = await getMyAccessToken();
    
    const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!tracksRes.ok) {
      throw new Error('Failed to fetch top tracks');
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

    res.json(formattedTracks);
  } catch (err) {
    console.error('Error fetching top tracks:', err);
    res.status(500).json({ error: 'Error fetching top tracks' });
  }
});

router.get('/top-artists', async (req, res) => {
  try {
    const accessToken = await getMyAccessToken();
    
    const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!artistsRes.ok) {
      throw new Error('Failed to fetch top artists');
    }

    const artistsData = await artistsRes.json();
    
    const formattedArtists = artistsData.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url,
      genres: artist.genres.slice(0, 3),
      followers: artist.followers.total
    }));

    res.json(formattedArtists);
  } catch (err) {
    console.error('Error fetching top artists:', err);
    res.status(500).json({ error: 'Error fetching top artists' });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

export default router;