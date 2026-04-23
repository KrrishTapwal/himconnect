const router = require('express').Router();
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /jobs
router.post('/', auth, async (req, res) => {
  try {
    const { role, company, location, salary, skillsRequired, referralAvailable, deadline, description } = req.body;
    if (!role || !company) return res.status(400).json({ message: 'role and company are required' });

    const job = await Job.create({
      postedBy: req.userId, role, company, location, salary,
      skillsRequired, referralAvailable, deadline, description
    });

    const populated = await job.populate('postedBy', 'name fieldOfInterest hometownDistrict');

    // notify users with matching skills
    if (skillsRequired?.length) {
      const interested = await User.find({
        _id: { $ne: req.userId },
        skills: { $in: skillsRequired }
      }).select('_id');

      const notifs = interested.map(u => ({
        userId: u._id,
        type: 'new_job',
        text: `New job: ${role} at ${company}`,
        link: `/jobs`
      }));
      if (notifs.length) await Notification.insertMany(notifs);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /jobs?referral=true&page=1
router.get('/', async (req, res) => {
  try {
    const { referral, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (referral === 'true') filter.referralAvailable = true;

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name fieldOfInterest hometownDistrict isTrustedMentor')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(filter);
    res.json({ jobs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /jobs/:id/interested
router.post('/:id/interested', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const idx = job.interestedUsers.indexOf(req.userId);
    if (idx === -1) {
      job.interestedUsers.push(req.userId);
    } else {
      job.interestedUsers.splice(idx, 1);
    }
    await job.save();
    res.json({ interested: idx === -1, count: job.interestedUsers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
