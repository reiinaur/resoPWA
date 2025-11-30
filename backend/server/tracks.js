import express from 'express';
import { setupDB } from './db.js';

const router = express.Router();

router.get('/tracks', async (req, res) => {
  const db = await setupDB();
  const rows = await db.all('SELECT * FROM tracks');
  console.log('Returning tracks:', rows.length);
  res.json(rows);
});

export default router;
