const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { checkContent } = require('../utils/contentFilter');

// POST /posts
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, body, youtubeLink, examName, rank, collegeCracked, companyName, role, salary } = req.body;
    if (!type || !title || !body)
      return res.status(400).json({ message: 'type, title, body are required' });
    if (body.length > 500)
      return res.status(400).json({ message: 'Body must be 500 chars or less' });

    // check if user is banned
    const poster = await User.findById(req.userId);
    if (!poster) return res.status(404).json({ message: 'User not found' });
    if (poster.isBanned) return res.status(403).json({ message: 'Your account has been suspended for policy violations.' });

    // content moderation
    const mod = checkContent(title, body);
    if (mod.blocked) {
      const reason = mod.reason === 'meaningless'
        ? 'Your post was removed: it appears to be empty or meaningless. Please share something useful.'
        : 'Your post was removed: it contains abusive, inappropriate, or 18+ content.';

      poster.warnings = (poster.warnings || 0) + 1;

      if (poster.warnings >= 2) {
        // 2nd violation — ban account
        poster.isBanned = true;
        await poster.save();
        // send final notification
        await Notification.create({
          userId: req.userId,
          type: 'system',
          text: '⛔ Your account has been permanently suspended due to repeated policy violations.',
          link: '/'
        });
        return res.status(403).json({ message: 'Your account has been suspended due to repeated policy violations.' });
      }

      // 1st violation — warn
      await poster.save();
      await Notification.create({
        userId: req.userId,
        type: 'system',
        text: `⚠️ Warning: ${reason} Next violation will result in account suspension.`,
        link: '/'
      });
      return res.status(400).json({ message: reason });
    }

    const post = await Post.create({
      userId: req.userId, type, title, body,
      youtubeLink, examName, rank, collegeCracked, companyName, role, salary
    });
    const populated = await post.populate('userId', 'name role hometownDistrict college fieldOfInterest isTrustedMentor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/feed?type=all&page=1
router.get('/feed', async (req, res) => {
  try {
    const { type, field, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;

    if (field) {
      const usersInField = await User.find({ fieldOfInterest: field }).select('_id');
      filter.userId = { $in: usersInField.map(u => u._id) };
    }

    const typeOrder = { job_crack: 0, exam_crack: 1, tip: 2, story: 3, question: 4 };

    const posts = await Post.find(filter)
      .populate('userId', 'name role hometownDistrict college fieldOfInterest isTrustedMentor isFoundingMember')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    posts.sort((a, b) => {
      const diff = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
      if (diff !== 0) return diff;
      return b.createdAt - a.createdAt;
    });

    const total = await Post.countDocuments(filter);
    res.json({ posts, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts
router.get('/', async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    const posts = await Post.find(filter)
      .populate('userId', 'name role hometownDistrict college fieldOfInterest isTrustedMentor isFoundingMember')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Post.countDocuments(filter);
    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /posts/:id/like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likedBy.indexOf(req.userId);
    if (idx === -1) {
      post.likedBy.push(req.userId);
      post.likes += 1;
    } else {
      post.likedBy.splice(idx, 1);
      post.likes -= 1;
    }
    await post.save();
    res.json({ likes: post.likes, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.userId)
      return res.status(403).json({ message: 'Forbidden' });
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
