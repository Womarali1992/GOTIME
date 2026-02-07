import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import { resolveTenant } from './middleware/tenant.js';
import courtsRouter from './routes/courts.js';
import timeSlotsRouter from './routes/time-slots.js';
import reservationsRouter from './routes/reservations.js';
import usersRouter from './routes/users.js';
import coachesRouter from './routes/coaches.js';
import clinicsRouter from './routes/clinics.js';
import settingsRouter from './routes/settings.js';
import tenantsRouter from './routes/tenants.js';
import signupRouter from './routes/signup.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (no tenant required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tenant management (protected by API key, no tenant resolution)
app.use('/api/tenants', tenantsRouter);

// Public signup (no tenant resolution needed)
app.use('/api/signup', signupRouter);

// Apply tenant resolution to all other /api routes
app.use('/api', resolveTenant);

// Routes (all tenant-scoped)
app.use('/api/courts', courtsRouter);
app.use('/api/time-slots', timeSlotsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/coaches', coachesRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/settings', settingsRouter);

// Async startup
async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
