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
// Cache the in-flight connection PROMISE (not just a boolean) so that
// concurrent cold-start requests all await the same connection attempt
// instead of each racing to open their own — that race is what was
// corrupting the connection state and causing "buffering timed out" errors.
let dbConnPromise = null;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (!dbConnPromise) {
    dbConnPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    }).catch(err => {
      dbConnPromise = null; // let the next request retry instead of staying stuck on a failed attempt
      throw err;
    });
  }
  await dbConnPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connect error:', err.message);
    // TEMP DEBUG — remove once root cause is confirmed
    res.status(503).json({ message: 'Service temporarily unavailable', debugName: err.name, debugMessage: err.message, debugCode: err.code });
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

// One-time migration: approve all jobs that existed before the approval system
mongoose.connection.once('open', () => {
  const Job = require('./src/models/Job');
  Job.updateMany({ status: { $exists: false } }, { $set: { status: 'approved' } })
    .then(r => { if (r.modifiedCount) console.log(`[migration] Auto-approved ${r.modifiedCount} existing jobs`); })
    .catch(() => {});
});

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
