import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './auth.js';
import { initDB } from './db.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));

app.use('/auth', authRouter);

app.get('/test-db', async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all('SELECT name FROM tracks LIMIT 1');
    res.json(rows);
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).send('DB error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

initDB().catch(err => {
  console.error('DB init error:', err);
  process.exit(1); 
});
