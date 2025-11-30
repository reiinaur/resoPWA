// server/auth.js
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
    redirect_uri: redirectUri
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

const db = pool;
await db.query('INSERT INTO tracks ...');

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code received');

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
    const accessToken = tokenData.access_token;
    if (!accessToken) return res.send('Token error');

    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const tracksData = await tracksRes.json();
    console.log('Fetched tracks count:', tracksData.items.length);

    for (let item of tracksData.items) {
      const t = item.track;
      await pool.query(
        `INSERT INTO tracks(id, name, artist, album)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT(id) DO UPDATE SET name = $2, artist = $3, album = $4`,
        [t.id, t.name, t.artists.map(a => a.name).join(', '), t.album.name]
      );
    }

    console.log('Tracks saved to PostgreSQL.');
    res.redirect(process.env.FRONTEND_RESULTS_URL);

  } catch (err) {
    console.error('Spotify callback error:', err);
    res.status(500).send('Error during callback');
  }
});

router.get('/tracks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tracks');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tracks:', err);
    res.status(500).send('Error fetching tracks');
  }
});

export default router;
