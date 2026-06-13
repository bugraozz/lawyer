import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { initDb } from './db';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Initialize SQLite Database
initDb();

import dashboardRoutes from './routes/dashboard';
import casesRoutes from './routes/cases';
import clientsRoutes from './routes/clients';
import eventsRoutes from './routes/events';
import expensesRoutes from './routes/expenses';
import notificationsRoutes from './routes/notifications';
import profileRoutes from './routes/profile';
import tasksRoutes from './routes/tasks';
import { authenticateToken } from './middleware/auth';

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/cases', authenticateToken, casesRoutes);
app.use('/api/clients', authenticateToken, clientsRoutes);
app.use('/api/events', authenticateToken, eventsRoutes);
app.use('/api/expenses', authenticateToken, expensesRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/tasks', authenticateToken, tasksRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lex Architect API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
