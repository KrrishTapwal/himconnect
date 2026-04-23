const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const count = await User.countDocuments();
    const isFoundingMember = count < 1000;
    const memberNumber = count + 1;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student',
      isFoundingMember,
      points: isFoundingMember ? 100 : 0
    });

    if (isFoundingMember) {
      await Notification.create({
        userId: user._id,
        type: 'founding_member',
        text: `Welcome, Founding Member #${memberNumber}! You've been awarded 100 points for being one of the first 1000 people on HimConnect.`,
        link: '/profile'
      });
    }

    res.status(201).json({
      token: signToken(user._id),
      user: sanitize(user),
      isFoundingMember,
      memberNumber: isFoundingMember ? memberNumber : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function sanitize(user) {
  const u = user.toJSON();
  delete u.passwordHash;
  return u;
}

module.exports = router;
