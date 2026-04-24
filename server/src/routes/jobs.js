const router = require('express').Router();
const Job = require('../models/Job');
const ExternalJob = require('../models/ExternalJob');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// In-memory cache so we don't hammer Remotive on every request
let _remotiveCache = { jobs: [], at: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// GET /jobs/external — live tech jobs from Remotive (free, no key needed)
router.get('/external', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    // Serve from cache if fresh
    if (_remotiveCache.jobs.length && Date.now() - _remotiveCache.at < CACHE_TTL) {
      return res.json({ jobs: _remotiveCache.jobs.slice(0, limit), total: _remotiveCache.jobs.length });
    }

    const { default: fetch } = await import('node-fetch');

    // Tech-only categories from Remotive
    const CATS = ['software-dev', 'devops-sysadmin', 'data', 'product', 'design'];
    const all = [];

    await Promise.allSettled(CATS.map(async cat => {
      const r = await fetch(
        `https://remotive.com/api/remote-jobs?category=${cat}&limit=20`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
      );
      const d = await r.json();
      if (!Array.isArray(d.jobs)) return;
      for (const j of d.jobs) {
        all.push({
          _id: `rm_${j.id}`,
          title: j.title,
          company: j.company_name,
          location: j.candidate_required_location || 'Remote / Worldwide',
          jobType: (j.job_type || 'full_time').replace(/_/g, '-'),
          salary: j.salary || null,
          applyUrl: j.url,
          postedAt: j.publication_date ? new Date(j.publication_date) : new Date(),
          category: cat,
          tags: j.tags || [],
        });
      }
    }));

    // Newest first, dedupe by _id
    const seen = new Set();
    const unique = all
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .filter(j => { if (seen.has(j._id)) return false; seen.add(j._id); return true; });

    _remotiveCache = { jobs: unique, at: Date.now() };
    res.json({ jobs: unique.slice(0, limit), total: unique.length });
  } catch (err) {
    console.error('Remotive fetch error:', err.message);
    // Fall back to DB cache if Remotive is down
    const jobs = await ExternalJob.find({}).sort({ fetchedAt: -1 }).limit(50);
    res.json({ jobs, total: jobs.length });
  }
});

// POST /jobs/sync — bulk upsert Indeed jobs (protected by CRON_SECRET)
router.post('/sync', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { jobs } = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0)
      return res.status(400).json({ message: 'jobs array required' });

    let upserted = 0;
    for (const job of jobs) {
      await ExternalJob.findOneAndUpdate(
        { indeedId: job.indeedId },
        { ...job, fetchedAt: new Date() },
        { upsert: true, new: true }
      );
      upserted++;
    }
    res.json({ upserted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /jobs/cron-sync — Vercel Cron endpoint (fetches from JSearch API daily)
router.get('/cron-sync', async (req, res) => {
  const auth_header = req.headers.authorization;
  if (auth_header !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const JSEARCH_KEY = process.env.JSEARCH_KEY;
  if (!JSEARCH_KEY) return res.status(500).json({ message: 'JSEARCH_KEY not configured' });

  const SEARCHES = [
    { q: 'software engineer jobs Chandigarh Mohali', category: 'tech' },
    { q: 'IT developer jobs Kharar Mohali Punjab', category: 'tech' },
    { q: 'jobs Chandigarh Mohali Kharar Panchkula', category: 'local' },
    { q: 'work from home remote jobs Chandigarh Punjab', category: 'remote' },
    { q: 'government jobs Chandigarh Punjab Haryana', category: 'govt' },
    { q: 'banking finance jobs Chandigarh Mohali', category: 'finance' },
  ];

  try {
    const fetch = (await import('node-fetch')).default;
    let total = 0;

    for (const search of SEARCHES) {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(search.q)}&num_pages=1&country=in`;
      const resp = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': JSEARCH_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });
      const data = await resp.json();
      if (!data.data) continue;

      for (const j of data.data) {
        await ExternalJob.findOneAndUpdate(
          { indeedId: j.job_id },
          {
            indeedId: j.job_id,
            title: j.job_title,
            company: j.employer_name,
            location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
            jobType: j.job_employment_type,
            salary: j.job_min_salary ? `₹${j.job_min_salary}–${j.job_max_salary}` : null,
            applyUrl: j.job_apply_link,
            category: search.category,
            postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
            fetchedAt: new Date()
          },
          { upsert: true }
        );
        total++;
      }
    }

    res.json({ synced: total, at: new Date() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// GET /jobs — user-posted jobs
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
