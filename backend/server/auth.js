import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import pool from './db.js';

dotenv.config();

const router = express.Router();
const redirectUri = process.env.REDIRECT_URI;
const scopes = 'user-library-read playlist-read-private';

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
    return res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=auth_failed&message=${error}`);
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=no_code`);
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
      return res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=token_failed&message=${tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=no_token`);
    }

    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tracksRes.ok) {
      console.error('Tracks fetch error:', await tracksRes.text());
      return res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=fetch_tracks_failed`);
    }

    const tracksData = await tracksRes.json();
    console.log('Fetched tracks count:', tracksData.items?.length || 0);

    if (tracksData.items && tracksData.items.length > 0) {
      for (let item of tracksData.items) {
        const t = item.track;
        await pool.query(
          `INSERT INTO tracks(id, name, artist, album)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT(id) DO UPDATE SET 
             name = EXCLUDED.name, 
             artist = EXCLUDED.artist, 
             album = EXCLUDED.album`,
          [t.id, t.name, t.artists.map(a => a.name).join(', '), t.album.name]
        );
      }
      console.log(`Successfully saved ${tracksData.items.length} tracks to PostgreSQL.`);
    } else {
      console.log('No tracks found in Spotify library');
    }

    res.redirect(`${process.env.FRONTEND_RESULTS_URL}?success=true&count=${tracksData.items?.length || 0}`);

  } catch (err) {
    console.error('Spotify callback error:', err);
    res.redirect(`${process.env.FRONTEND_RESULTS_URL}?error=server_error&message=${err.message}`);
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

    // Search in tracks
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

console.log('Tracks saved to PostgreSQL.');
console.log('Redirecting to:', `${process.env.FRONTEND_RESULTS_URL}?success=true&count=${tracksData.items?.length || 0}`);
res.redirect(`${process.env.FRONTEND_RESULTS_URL}?success=true&count=${tracksData.items?.length || 0}`);

export default router;