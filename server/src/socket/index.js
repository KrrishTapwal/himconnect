const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const HP_DISTRICTS = [
  'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur',
  'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti',
  'Sirmaur', 'Una', 'Kinnaur', 'All HP'
];

module.exports = function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // join a district room
    socket.on('joinRoom', (roomId) => {
      if (HP_DISTRICTS.includes(roomId)) {
        socket.join(`room:${roomId}`);
      }
    });

    // leave a room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    // join personal DM room
    socket.on('joinDM', (otherUserId) => {
      const dmRoom = [socket.userId, otherUserId].sort().join(':');
      socket.join(`dm:${dmRoom}`);
    });

    // send message to district room
    socket.on('roomMessage', async ({ roomId, text }) => {
      if (!HP_DISTRICTS.includes(roomId) || !text?.trim()) return;
      try {
        const msg = await Message.create({ roomId, fromUserId: socket.userId, text });
        const populated = await msg.populate('fromUserId', 'name role hometownDistrict');
        io.to(`room:${roomId}`).emit('newMessage', populated);
      } catch {}
    });

    // send DM
    socket.on('directMessage', async ({ toUserId, text }) => {
      if (!toUserId || !text?.trim()) return;
      try {
        const msg = await Message.create({ fromUserId: socket.userId, toUserId, text });
        const populated = await msg.populate('fromUserId', 'name role');
        const dmRoom = [socket.userId, toUserId].sort().join(':');
        io.to(`dm:${dmRoom}`).emit('newDM', populated);
      } catch {}
    });

    socket.on('disconnect', () => {});
  });
};
