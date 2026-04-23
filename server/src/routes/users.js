const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /users/me
router.put('/me', auth, async (req, res) => {
  try {
    const allowed = [
      'name', 'role', 'hometownDistrict', 'currentCity', 'college',
      'graduationYear', 'profession', 'company', 'fieldOfInterest',
      'skills', 'openTo', 'bio', 'linkedinUrl', 'meetLink', 'onboardingComplete'
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.bio && updates.bio.length > 100)
      return res.status(400).json({ message: 'Bio must be 100 chars or less' });

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -lastHelpDate -lastLearnDate');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users?role=mentor&field=CSE&district=Shimla&page=1
router.get('/', async (req, res) => {
  try {
    const { role, field, district, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (field) filter.fieldOfInterest = field;
    if (district) filter.hometownDistrict = district;

    const users = await User.find(filter)
      .select('-passwordHash -passwordHash -lastHelpDate -lastLearnDate')
      .sort({ isTrustedMentor: -1, avgRating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
