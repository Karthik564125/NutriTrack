import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import bmiRoutes from './routes/bmiRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import "./cron/streakNotifier.js";

import db from './db/db.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bmi', bmiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/streaks', streakRoutes);


app.get('/', (req, res) => res.send("NutriTrack API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
