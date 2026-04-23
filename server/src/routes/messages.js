const router = require('express').Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

const HP_DISTRICTS = [
  'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur',
  'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti',
  'Sirmaur', 'Una', 'Kinnaur', 'All HP'
];

// GET /messages/rooms — list available rooms
router.get('/rooms', (req, res) => {
  res.json(HP_DISTRICTS);
});

// GET /messages/:roomId — district room history (supports ?since=isodate for polling)
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!HP_DISTRICTS.includes(roomId))
      return res.status(400).json({ message: 'Invalid room' });

    const filter = { roomId };
    if (req.query.since) filter.createdAt = { $gt: new Date(req.query.since) };

    const msgs = await Message.find(filter)
      .populate('fromUserId', 'name role hometownDistrict')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /messages/:roomId — send to room
router.post('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!HP_DISTRICTS.includes(roomId))
      return res.status(400).json({ message: 'Invalid room' });

    const msg = await Message.create({ roomId, fromUserId: req.userId, text: req.body.text });
    const populated = await msg.populate('fromUserId', 'name role hometownDistrict');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /messages/dm/:userId — DM thread
router.get('/dm/:userId', auth, async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { fromUserId: req.userId, toUserId: req.params.userId },
        { fromUserId: req.params.userId, toUserId: req.userId }
      ]
    })
      .populate('fromUserId', 'name role')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /messages/dm/:userId — send DM
router.post('/dm/:userId', auth, async (req, res) => {
  try {
    const msg = await Message.create({
      fromUserId: req.userId,
      toUserId: req.params.userId,
      text: req.body.text
    });
    const populated = await msg.populate('fromUserId', 'name role');

    const from = await User.findById(req.userId).select('name');
    await Notification.create({
      userId: req.params.userId,
      type: 'new_message',
      text: `${from.name} sent you a message`,
      link: `/messages/dm/${req.userId}`
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
