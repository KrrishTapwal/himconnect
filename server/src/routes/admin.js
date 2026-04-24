const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Connection = require('../models/Connection');

// GET /admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, students, mentors, posts, jobs, connections] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      Post.countDocuments(),
      Job.countDocuments(),
      Connection.countDocuments({ status: 'accepted' }),
    ]);
    res.json({ totalUsers, students, mentors, posts, jobs, connections });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// GET /admin/users?search=&role=&page=1
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { search, role, page = 1 } = req.query;
    const limit = 20;
    const query = { role: { $ne: 'admin' } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'all') query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role onboardingComplete isBanned isFoundingMember points hometownDistrict createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// PUT /admin/users/:id/ban  — toggles ban
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ message: 'User not found' });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// GET /admin/posts?page=1
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 20;
    const [posts, total] = await Promise.all([
      Post.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(),
    ]);
    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// DELETE /admin/posts/:id
router.delete('/posts/:id', adminAuth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// GET /admin/jobs?page=1
router.get('/jobs', adminAuth, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 20;
    const [jobs, total] = await Promise.all([
      Job.find()
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Job.countDocuments(),
    ]);
    res.json({ jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// DELETE /admin/jobs/:id
router.delete('/jobs/:id', adminAuth, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
