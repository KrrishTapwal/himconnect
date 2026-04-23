const router = require('express').Router();
const Connection = require('../models/Connection');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// POST /connections
router.post('/', auth, async (req, res) => {
  try {
    const { toUser, meetType, message } = req.body;
    if (!toUser || !meetType) return res.status(400).json({ message: 'toUser and meetType required' });
    if (toUser === req.userId) return res.status(400).json({ message: 'Cannot connect with yourself' });

    const conn = await Connection.create({
      fromUser: req.userId, toUser, meetType, message
    });

    const from = await User.findById(req.userId).select('name');
    await Notification.create({
      userId: toUser,
      type: 'connection_request',
      text: `${from.name} sent you a ${meetType.replace('_', ' ')} request`,
      link: `/connections`
    });

    res.status(201).json(conn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /connections — list all for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ fromUser: req.userId }, { toUser: req.userId }]
    })
      .populate('fromUser', 'name role fieldOfInterest hometownDistrict college isTrustedMentor')
      .populate('toUser', 'name role fieldOfInterest hometownDistrict college isTrustedMentor')
      .sort({ createdAt: -1 });
    res.json(connections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /connections/:id  — accept / decline / complete + rate
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, rating } = req.body;
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const isTo = conn.toUser.toString() === req.userId;
    const isFrom = conn.fromUser.toString() === req.userId;
    if (!isTo && !isFrom) return res.status(403).json({ message: 'Forbidden' });

    if ((status === 'accepted' || status === 'declined') && !isTo)
      return res.status(403).json({ message: 'Only the recipient can accept/decline' });

    conn.status = status;
    if (rating) conn.rating = rating;
    await conn.save();

    if (status === 'accepted') {
      await Notification.create({
        userId: conn.fromUser,
        type: 'connection_accepted',
        text: 'Your meet request was accepted!',
        link: `/messages`
      });
    }

    if (status === 'completed' && rating) {
      await updateMentorRating(conn.toUser);
      await Notification.create({
        userId: conn.toUser,
        type: 'rating_received',
        text: `You received a ${rating}-star rating`,
        link: `/profile`
      });
    }

    res.json(conn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function updateMentorRating(mentorId) {
  const sessions = await Connection.find({ toUser: mentorId, status: 'completed', rating: { $exists: true } });
  if (!sessions.length) return;
  const avg = sessions.reduce((s, c) => s + c.rating, 0) / sessions.length;
  await User.findByIdAndUpdate(mentorId, {
    avgRating: Math.round(avg * 10) / 10,
    totalSessions: sessions.length,
    isTrustedMentor: avg >= 4.5 && sessions.length >= 5
  });
}

module.exports = router;
