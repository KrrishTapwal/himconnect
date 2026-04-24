const router = require('express').Router();
const cron = require('node-cron');
const Job = require('../models/Job');
const ExternalJob = require('../models/ExternalJob');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// In-memory cache — 6 hour TTL so it survives within a server run
let _jobCache = { jobs: [], at: 0 };
const CACHE_TTL = 6 * 60 * 60 * 1000;

// ── source fetchers ────────────────────────────────────────────────────────────

async function fetchRemotive(fetchFn) {
  const CATS = ['software-dev', 'devops-sysadmin', 'data', 'product', 'design', 'finance', 'hr', 'qa', 'management'];
  const all = [];
  await Promise.allSettled(CATS.map(async cat => {
    const r = await fetchFn(`https://remotive.com/api/remote-jobs?category=${cat}&limit=50`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    for (const j of (d.jobs || [])) {
      all.push({
        _id: `rm_${j.id}`, source: 'Remotive',
        title: j.title, company: j.company_name,
        location: j.candidate_required_location || 'Remote',
        jobType: (j.job_type || 'full_time').replace(/_/g, '-'),
        salary: j.salary || null, applyUrl: j.url,
        postedAt: j.publication_date ? new Date(j.publication_date) : new Date(),
      });
    }
  }));
  return all;
}

async function fetchArbeitnow(fetchFn) {
  const pages = [1, 2, 3];
  const all = [];
  await Promise.allSettled(pages.map(async page => {
    const r = await fetchFn(`https://www.arbeitnow.com/api/job-board-api?page=${page}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    for (const j of (d.data || [])) {
      all.push({
        _id: `an_${j.slug}`, source: 'Arbeitnow',
        title: j.title, company: j.company_name,
        location: j.remote ? 'Remote' : (j.location || 'Europe'),
        jobType: (j.job_types?.[0] || 'full-time').replace(/_/g, '-'),
        salary: null, applyUrl: j.url,
        postedAt: j.created_at ? new Date(j.created_at * 1000) : new Date(),
      });
    }
  }));
  return all;
}

async function fetchTheMuse(fetchFn) {
  const pages = [0, 1, 2];
  const all = [];
  await Promise.allSettled(pages.map(async page => {
    const r = await fetchFn(
      `https://www.themuse.com/api/public/v2/jobs?category=Engineering&category=Data+Science&category=IT&page=${page}&descending=true`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    for (const j of (d.results || [])) {
      all.push({
        _id: `mu_${j.id}`, source: 'The Muse',
        title: j.name, company: j.company?.name || '',
        location: j.locations?.map(l => l.name).join(', ') || 'Flexible',
        jobType: 'full-time',
        salary: null, applyUrl: j.refs?.landing_page || '',
        postedAt: j.publication_date ? new Date(j.publication_date) : new Date(),
      });
    }
  }));
  return all;
}

async function fetchAdzuna(fetchFn) {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return [];
  const pages = [1, 2, 3];
  const all = [];
  await Promise.allSettled(pages.map(async page => {
    const r = await fetchFn(
      `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=software+developer+engineer+data&content-type=application%2Fjson`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    for (const j of (d.results || [])) {
      all.push({
        _id: `az_${j.id}`, source: 'Adzuna India',
        title: j.title, company: j.company?.display_name || '',
        location: j.location?.display_name || 'India',
        jobType: j.contract_time === 'full_time' ? 'full-time' : (j.contract_time || 'full-time'),
        salary: j.salary_min ? `₹${Math.round(j.salary_min / 1000)}k – ₹${Math.round(j.salary_max / 1000)}k` : null,
        applyUrl: j.redirect_url,
        postedAt: j.created ? new Date(j.created) : new Date(),
      });
    }
  }));
  return all;
}

async function fetchRemoteOK(fetchFn) {
  const r = await fetchFn('https://remoteok.com/api',
    { headers: { Accept: 'application/json', 'User-Agent': 'HimConnect/1.0' }, signal: AbortSignal.timeout(10000) });
  const d = await r.json();
  return (Array.isArray(d) ? d : [])
    .filter(j => j.id && j.position)
    .map(j => ({
      _id: `ro_${j.id}`, source: 'Remote OK',
      title: j.position, company: j.company || '',
      location: 'Remote',
      jobType: 'remote',
      salary: (j.salary_min && j.salary_max) ? `$${Math.round(j.salary_min / 1000)}k – $${Math.round(j.salary_max / 1000)}k` : null,
      applyUrl: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
      postedAt: j.date ? new Date(j.date) : new Date(),
    }));
}

async function fetchJobicy(fetchFn) {
  const r = await fetchFn(
    'https://jobicy.com/api/v2/remote-jobs?count=100&geo=worldwide&industry=engineering,design,marketing,finance',
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
  const d = await r.json();
  return (d.jobs || []).map(j => ({
    _id: `jc_${j.id}`, source: 'Jobicy',
    title: j.jobTitle, company: j.companyName || '',
    location: j.jobGeo || 'Remote',
    jobType: (j.jobType?.[0] || 'full-time').toLowerCase(),
    salary: j.annualSalaryMin ? `$${Math.round(j.annualSalaryMin / 1000)}k – $${Math.round(j.annualSalaryMax / 1000)}k` : null,
    applyUrl: j.url,
    postedAt: j.pubDate ? new Date(j.pubDate) : new Date(),
  }));
}

// ── fetch all sources and persist to MongoDB ───────────────────────────────────

async function refreshAllJobs() {
  const { default: fetch } = await import('node-fetch');
  console.log('[jobs] Refreshing external jobs from all sources…');

  const results = await Promise.allSettled([
    fetchRemotive(fetch),
    fetchArbeitnow(fetch),
    fetchTheMuse(fetch),
    fetchAdzuna(fetch),
    fetchRemoteOK(fetch),
    fetchJobicy(fetch),
  ]);

  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Dedupe by _id, sort newest first
  const seen = new Set();
  const unique = all
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .filter(j => { if (seen.has(j._id)) return false; seen.add(j._id); return true; });

  // Persist to MongoDB (upsert by indeedId which holds our source _id)
  await Promise.allSettled(unique.map(j =>
    ExternalJob.findOneAndUpdate(
      { indeedId: j._id },
      { indeedId: j._id, source: j.source, title: j.title, company: j.company, location: j.location, jobType: j.jobType, salary: j.salary, applyUrl: j.applyUrl, postedAt: j.postedAt, fetchedAt: new Date() },
      { upsert: true }
    )
  ));

  _jobCache = { jobs: unique, at: Date.now() };
  console.log(`[jobs] Refreshed: ${unique.length} jobs saved (${results.filter(r => r.status === 'fulfilled').length}/6 sources ok)`);
  return unique;
}

// Daily refresh at 6:30 AM IST (1:00 AM UTC)
cron.schedule('0 1 * * *', () => {
  refreshAllJobs().catch(err => console.error('[jobs cron] error:', err.message));
}, { timezone: 'UTC' });

// GET /jobs/external — live tech jobs from multiple free sources
router.get('/external', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 300, 500);

    // 1. Serve from in-memory cache if fresh
    if (_jobCache.jobs.length && Date.now() - _jobCache.at < CACHE_TTL) {
      return res.json({ jobs: _jobCache.jobs.slice(0, limit), total: _jobCache.jobs.length });
    }

    // 2. Try to load from MongoDB (jobs fetched within last 6h survive restarts)
    const sixHoursAgo = new Date(Date.now() - CACHE_TTL);
    const dbJobs = await ExternalJob.find({ fetchedAt: { $gte: sixHoursAgo } })
      .sort({ postedAt: -1 })
      .limit(500)
      .lean();

    if (dbJobs.length > 50) {
      const normalized = dbJobs.map(j => ({ ...j, _id: j.indeedId || j._id }));
      _jobCache = { jobs: normalized, at: Date.now() };
      return res.json({ jobs: normalized.slice(0, limit), total: normalized.length });
    }

    // 3. Nothing fresh — fetch live from all APIs
    const unique = await refreshAllJobs();
    res.json({ jobs: unique.slice(0, limit), total: unique.length });

  } catch (err) {
    console.error('External jobs fetch error:', err.message);
    const jobs = await ExternalJob.find({}).sort({ postedAt: -1 }).limit(300).lean();
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

// GET /jobs — user-posted jobs (approved only)
router.get('/', async (req, res) => {
  try {
    const { referral, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved' };
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
    const job = await Job.findById(req.params.id).populate('postedBy', '_id name');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const idx = job.interestedUsers.indexOf(req.userId);
    const isAdding = idx === -1;

    if (isAdding) {
      job.interestedUsers.push(req.userId);
    } else {
      job.interestedUsers.splice(idx, 1);
    }
    await job.save();

    // Notify the job poster when someone shows interest (not on un-interest)
    if (isAdding && job.postedBy && job.postedBy._id.toString() !== req.userId) {
      const interestingUser = await User.findById(req.userId).select('name');
      await Notification.create({
        userId: job.postedBy._id,
        type: 'job_interest',
        text: `${interestingUser?.name || 'Someone'} is interested in your job: ${job.role} at ${job.company}`,
        link: '/jobs',
      });
    }

    res.json({ interested: isAdding, count: job.interestedUsers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
