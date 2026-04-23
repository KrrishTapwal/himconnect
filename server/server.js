require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});

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

// socket
require('./src/socket')(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
