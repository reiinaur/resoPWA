import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import querystring from 'querystring';
import { setupDB } from './db.js';

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
  const spotifyUrl = `https://accounts.spotify.com/authorize?${params}`;
  console.log('Redirecting to Spotify:', spotifyUrl);
  res.redirect(spotifyUrl);
});

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
    console.log('Token response:', tokenData); // <-- log token response

    const accessToken = tokenData.access_token;
    if (!accessToken) return res.send('Token error');

    const tracksRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!tracksRes.ok) {
      const errorText = await tracksRes.text();
      console.error('Error fetching tracks:', errorText);
      return res.status(500).send('Failed to fetch tracks from Spotify');
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

      await db.run(
        `INSERT OR REPLACE INTO tracks (id, name, artist, album) VALUES (?, ?, ?, ?)`,
        [trackObj.id, trackObj.name, trackObj.artist, trackObj.album]
      );
    }

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
    console.error('Spotify callback error:', err); // <-- detailed log
    res.status(500).send('Error during callback: ' + err.message);
  }
});

export default router;
