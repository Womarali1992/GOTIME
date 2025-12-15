import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import courtsRouter from './routes/courts.js';
import timeSlotsRouter from './routes/time-slots.js';
import reservationsRouter from './routes/reservations.js';
import usersRouter from './routes/users.js';
import coachesRouter from './routes/coaches.js';
import clinicsRouter from './routes/clinics.js';
import socialsRouter from './routes/socials.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/courts', courtsRouter);
app.use('/api/time-slots', timeSlotsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/coaches', coachesRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/socials', socialsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
