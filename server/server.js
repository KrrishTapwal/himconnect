require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — fail closed; must configure CLIENT_URL ────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / mobile (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing with strict size limit ──────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL injection: strip $ and . from all req.body / query / params ────────
app.use(mongoSanitize());

// ── HTTP Parameter Pollution prevention ──────────────────────────────────────
app.use(hpp());

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(apiLimiter);

// ── DB connection (before all routes — critical for Vercel serverless) ───────
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connect error:', err.message);
    res.status(503).json({ message: 'Service temporarily unavailable' });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',          require('./src/routes/auth'));
app.use('/users',         require('./src/routes/users'));
app.use('/posts',         require('./src/routes/posts'));
app.use('/jobs',          require('./src/routes/jobs'));
app.use('/connections',   require('./src/routes/connections'));
app.use('/messages',      require('./src/routes/messages'));
app.use('/notifications', require('./src/routes/notifications'));
app.use('/streaks',       require('./src/routes/streaks'));
app.use('/admin',         require('./src/routes/admin'));

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// ── Global error handler — never leak internals ───────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message?.startsWith('CORS')) return res.status(403).json({ message: err.message });
  res.status(500).json({ message: 'Something went wrong' });
});

// ── Local dev only ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: allowedOrigins.length ? allowedOrigins : '*', methods: ['GET', 'POST'] }
  });
  require('./src/socket')(io);
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
