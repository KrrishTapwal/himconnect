const router = require('express').Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

const HP_DISTRICTS = [
  'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur',
  'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti',
  'Sirmaur', 'Una', 'Kinnaur', 'All HP'
];

// GET /messages/rooms
router.get('/rooms', (req, res) => {
  res.json(HP_DISTRICTS);
});

// GET /messages/conversations — all DM threads for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const convos = await Message.aggregate([
      {
        $match: {
          $or: [{ fromUserId: userId }, { toUserId: userId }],
          toUserId: { $exists: true, $ne: null },
          roomId: { $exists: false }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherId: { $cond: [{ $eq: ['$fromUserId', userId] }, '$toUserId', '$fromUserId'] }
        }
      },
      {
        $group: {
          _id: '$otherId',
          lastText: { $first: '$text' },
          lastAt: { $first: '$createdAt' },
          lastFrom: { $first: '$fromUserId' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user._id': 1, 'user.name': 1, 'user.role': 1,
          'user.profession': 1, 'user.company': 1, 'user.college': 1,
          'user.hometownDistrict': 1,
          lastText: 1, lastAt: 1, lastFrom: 1
        }
      },
      { $sort: { lastAt: -1 } }
    ]);

    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /messages/dm/:userId — DM thread (supports ?since=isodate for polling)
router.get('/dm/:userId', auth, async (req, res) => {
  try {
    const filter = {
      $or: [
        { fromUserId: req.userId, toUserId: req.params.userId },
        { fromUserId: req.params.userId, toUserId: req.userId }
      ]
    };
    if (req.query.since) filter.createdAt = { $gt: new Date(req.query.since) };
    const msgs = await Message.find(filter)
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

module.exports = router;
