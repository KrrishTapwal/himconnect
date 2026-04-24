const router = require('express').Router();
const mongoose = require('mongoose');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Connection = require('../models/Connection');

// GET /admin/stats  — full analytics payload
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers, students, mentors, posts, jobs, connections,
      bannedUsers, foundingMembers,
      usersByMonthRaw, postsByMonthRaw, postsByTypeRaw,
      districtRaw, fieldRaw, topUsers,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      Post.countDocuments(),
      Job.countDocuments(),
      Connection.countDocuments({ status: 'accepted' }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isFoundingMember: true }),

      User.aggregate([
        { $match: { role: { $ne: 'admin' }, createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      Post.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      Post.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      User.aggregate([
        { $match: { hometownDistrict: { $exists: true, $ne: null }, role: { $ne: 'admin' } } },
        { $group: { _id: '$hometownDistrict', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      User.aggregate([
        { $match: { fieldOfInterest: { $exists: true, $ne: null } } },
        { $group: { _id: '$fieldOfInterest', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      User.find({ role: { $ne: 'admin' } })
        .select('name role points hometownDistrict isFoundingMember')
        .sort({ points: -1 })
        .limit(10),
    ]);

    // Build full 12-month axis so missing months show as 0
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(d.getMonth() + i);
      months.push(d.toISOString().slice(0, 7)); // "2025-01"
    }

    const uMap = Object.fromEntries(usersByMonthRaw.map(r => [r._id, r.count]));
    const pMap = Object.fromEntries(postsByMonthRaw.map(r => [r._id, r.count]));

    const growthByMonth = months.map(m => ({
      month: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      users: uMap[m] || 0,
      posts: pMap[m] || 0,
    }));

    const TYPE_LABELS = {
      job_crack: 'Job Crack', exam_crack: 'Exam Crack',
      tip: 'Tip', question: 'Question', story: 'Story',
    };
    const postsByType = postsByTypeRaw.map(r => ({ type: TYPE_LABELS[r._id] || r._id, count: r.count }));
    const districtBreakdown = districtRaw.map(r => ({ district: r._id, count: r.count }));
    const fieldBreakdown = fieldRaw.map(r => ({ field: r._id, count: r.count }));

    res.json({
      totalUsers, students, mentors, posts, jobs, connections,
      bannedUsers, foundingMembers,
      growthByMonth, postsByType, districtBreakdown, fieldBreakdown,
      topUsers,
    });
  } catch (err) {
    console.error(err);
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
        .select('name email role onboardingComplete isBanned isFoundingMember isSubAdmin points hometownDistrict createdAt')
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

// PUT /admin/users/:id/dashboard-access  (real admin only)
router.put('/users/:id/dashboard-access', adminAuth, async (req, res) => {
  try {
    if (!req.isRealAdmin) return res.status(403).json({ message: 'Only the main admin can manage dashboard access' });
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ message: 'User not found' });
    user.isSubAdmin = !user.isSubAdmin;
    await user.save();
    res.json({ isSubAdmin: user.isSubAdmin });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// PUT /admin/users/:id/ban
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

// GET /admin/server-stats — MongoDB storage + Node.js process metrics
router.get('/server-stats', adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const ATLAS_FREE_LIMIT_MB = 512;

    // ── MongoDB DB-level stats ─────────────────────────────────────────────────
    const dbStats = await db.stats();
    const MB = 1024 * 1024;

    const dataSize    = dbStats.dataSize    || 0;   // raw document bytes
    const indexSize   = dbStats.indexSize   || 0;   // index bytes
    const storageSize = dbStats.storageSize || 0;   // on-disk (compressed)
    const totalUsedBytes = dataSize + indexSize;

    // ── Per-collection stats ───────────────────────────────────────────────────
    const colList = await db.listCollections().toArray();
    const colStats = await Promise.allSettled(
      colList.map(async c => {
        const s = await db.collection(c.name).stats();
        return {
          name: c.name,
          documents: s.count || 0,
          dataKB:  Math.round((s.size || 0) / 1024 * 10) / 10,
          indexKB: Math.round((s.totalIndexSize || 0) / 1024 * 10) / 10,
          avgDocBytes: Math.round(s.avgObjSize || 0),
        };
      })
    );
    const collections = colStats
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => b.dataKB - a.dataKB);

    // ── MongoDB server status (may be restricted on Atlas M0) ─────────────────
    let mongoUptime = null, mongoConnections = null, mongoVersion = null;
    try {
      const ss = await db.admin().serverStatus();
      mongoUptime      = ss.uptime;
      mongoConnections = ss.connections;
      mongoVersion     = ss.version;
    } catch {}

    // ── Node.js / Render process info ─────────────────────────────────────────
    const mem = process.memoryUsage();
    const processInfo = {
      nodeVersion:   process.version,
      platform:      process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMB:    Math.round(mem.heapUsed  / MB * 10) / 10,
      heapTotalMB:   Math.round(mem.heapTotal / MB * 10) / 10,
      rssMB:         Math.round(mem.rss        / MB * 10) / 10,
      externalMB:    Math.round(mem.external   / MB * 10) / 10,
    };

    res.json({
      mongo: {
        dbName:        dbStats.db,
        collections:   dbStats.collections  || colList.length,
        objects:       dbStats.objects       || 0,
        avgObjBytes:   Math.round(dbStats.avgObjSize || 0),
        dataMB:        Math.round(totalUsedBytes / MB * 100) / 100,
        storageMB:     Math.round(storageSize    / MB * 100) / 100,
        indexMB:       Math.round(indexSize      / MB * 100) / 100,
        limitMB:       ATLAS_FREE_LIMIT_MB,
        usedPct:       Math.round(totalUsedBytes / (ATLAS_FREE_LIMIT_MB * MB) * 1000) / 10,
        freeMB:        Math.round((ATLAS_FREE_LIMIT_MB - totalUsedBytes / MB) * 100) / 100,
        uptime:        mongoUptime,
        connections:   mongoConnections,
        version:       mongoVersion,
      },
      collections,
      process: processInfo,
    });
  } catch (err) {
    console.error('server-stats error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
