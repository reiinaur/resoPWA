import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import tracksRoutes from './tracks.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_RESULTS_URL }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/', tracksRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
