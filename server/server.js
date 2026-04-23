require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

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

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

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

// for Vercel serverless
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

module.exports = app;
