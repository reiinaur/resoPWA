import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const router = express.Router();
const redirectUri = process.env.REDIRECT_URI; // use the tunnel URL

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open SQLite
let db;
(async () => {
  db = await open({
    filename: path.resolve(__dirname, '.database/spotify.db'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist TEXT,
      album TEXT
    )
  `);
})();

const scopes = 'user-library-read playlist-read-private';

// Step 1: redirect user to Spotify login
router.get('/login', (req, res) => {
  const params = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2: Spotify callback
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

    for (let item of tracksData.items) {
      const t = item.track;
      await db.run(
        `INSERT OR REPLACE INTO tracks (id, name, artist, album) VALUES (?, ?, ?, ?)`,
        [t.id, t.name, t.artists.map(a => a.name).join(', '), t.album.name]
      );
    }

    // Redirect frontend results page (update if you deploy frontend)
    res.redirect('https://figure-florence-forever-hon.trycloudflare.com/results');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during callback');
  }
});

export default router;
