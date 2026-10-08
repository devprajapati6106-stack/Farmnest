import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import farmhouseRoutes from './routes/farmhouseRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'FarmHouseRent API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/farmhouses', farmhouseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
