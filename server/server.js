require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['*'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

// connect DB before all routes (critical for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// routes
app.use('/auth', require('./src/routes/auth'));
app.use('/users', require('./src/routes/users'));
app.use('/posts', require('./src/routes/posts'));
app.use('/jobs', require('./src/routes/jobs'));
app.use('/connections', require('./src/routes/connections'));
app.use('/messages', require('./src/routes/messages'));
app.use('/notifications', require('./src/routes/notifications'));
app.use('/streaks', require('./src/routes/streaks'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// for local dev
if (process.env.NODE_ENV !== 'production') {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
  });
  require('./src/socket')(io);
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
