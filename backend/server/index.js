import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRouter from './auth.js';
import { initDB } from './db.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Initialize SQLite once
let db;

(async () => {
  try {
    db = await initDB();
    app.set('db', db);
    console.log('SQLite initialized');
  } catch (err) {
    console.error('SQLite initialization error:', err);
    process.exit(1);
  }
})();

// Test route to confirm DB works
app.get('/test-db', async (req, res) => {
  try {
    const rows = await db.all('SELECT name FROM tracks LIMIT 1');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB error');
  }
});

// Routers
app.use('/auth', authRouter);

// Serve frontend
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
