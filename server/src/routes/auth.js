const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authLimiter } = require('../middleware/rateLimiter');
const { isEmail, isStrongPassword } = require('../utils/validate');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '30d' });

// POST /auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 60)
      return res.status(400).json({ message: 'Name must be 2–60 characters' });

    if (!isEmail(trimmedEmail))
      return res.status(400).json({ message: 'Invalid email address' });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters and contain a letter and a number' });

    const exists = await User.findOne({ email: trimmedEmail });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const count = await User.countDocuments();
    const isFoundingMember = count < 1000;
    const memberNumber = count + 1;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
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
    console.error('signup error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// POST /auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email });
    // Perform dummy compare to prevent timing-based account enumeration
    const dummyHash = '$2a$12$invalidhashfortimingprotection00000000000000000000000';
    const ok = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !ok)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isBanned)
      return res.status(403).json({ message: 'Your account has been suspended for policy violations.' });

    res.json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

function sanitize(user) {
  const u = user.toJSON();
  delete u.passwordHash;
  return u;
}

module.exports = router;
