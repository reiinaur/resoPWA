import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';

dotenv.config();

const router = express.Router();
const redirectUri = process.env.REDIRECT_URI;

const scopes = 'user-library-read playlist-read-private';

// Attach shared DB to req
router.use((req, res, next) => {
  req.db = req.app.get('db');
  next();
});

// Step 1 — redirect user to Spotify login
router.get('/login', (req, res) => {
  const params = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2 — Spotify callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send('No code received');

  try {
    const body = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    });

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) return res.send('Token error');

    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const tracksData = await tracksRes.json();

    // Save tracks into shared SQLite DB
    for (let item of tracksData.items) {
      const t = item.track;
      await req.db.run(
        `INSERT OR REPLACE INTO tracks (id, name, artist, album) VALUES (?, ?, ?, ?)`,
        [t.id, t.name, t.artists.map(a => a.name).join(', '), t.album.name]
      );
    }

    res.redirect('https://resopwa-production.up.railway.app/results');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during callback');
  }
});

export default router;
