import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const router = express.Router();
const redirectUri = process.env.REDIRECT_URI;
const scopes = 'user-library-read playlist-read-private';

// Setup SQLite DB
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.sqlite');

async function setupDB() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist TEXT,
      album TEXT
    )
  `);
  return db;
}

// Login route
router.get('/login', (req, res) => {
  const params = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri
  });
  const spotifyUrl = `https://accounts.spotify.com/authorize?${params}`;
  console.log('Redirecting to Spotify:', spotifyUrl);
  res.redirect(spotifyUrl);
});

// Callback route
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code received');

  try {
    const authHeader = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    // Get access token
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
    console.log('Token response:', tokenData);

    if (!tokenData.access_token) return res.send('Token error');

    // Fetch tracks
    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!tracksRes.ok) {
      const errText = await tracksRes.text();
      console.error('Failed to fetch tracks:', errText);
      return res.status(500).send('Failed to fetch tracks');
    }

    const tracksData = await tracksRes.json();
    console.log('Fetched tracks count:', tracksData.items.length);

    const db = await setupDB();
    const trackList = [];

    for (let item of tracksData.items) {
      const t = item.track;
      const trackObj = {
        id: t.id,
        name: t.name,
        artist: t.artists.map(a => a.name).join(', '),
        album: t.album.name
      };
      trackList.push(trackObj);

      // Optional: store in SQLite
      await db.run(
        `INSERT OR REPLACE INTO tracks (id, name, artist, album) VALUES (?, ?, ?, ?)`,
        [trackObj.id, trackObj.name, trackObj.artist, trackObj.album]
      );
    }

    // Safe localStorage injection and redirect
    res.send(`
      <html>
        <head>
          <script>
            const tracks = ${JSON.stringify(trackList)};
            localStorage.setItem('spotifyTracks', JSON.stringify(tracks));
            window.location.href = '${process.env.FRONTEND_RESULTS_URL}';
          </script>
        </head>
        <body>
          Redirecting to results...
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Spotify callback error:', err);
    res.status(500).send('Error during callback: ' + err.message);
  }
});

export default router;
