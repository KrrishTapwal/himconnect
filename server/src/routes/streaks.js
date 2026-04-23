const router = require('express').Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isYesterday(a) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
}

// POST /streaks/learn — call when student reads a post
router.post('/learn', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (user.lastLearnDate && isSameDay(user.lastLearnDate, now)) {
      return res.json({ learnStreak: user.learnStreak, message: 'already counted today' });
    }

    const continued = user.lastLearnDate && isYesterday(user.lastLearnDate);
    user.learnStreak = continued ? user.learnStreak + 1 : 1;
    user.lastLearnDate = now;
    await user.save();

    if (user.learnStreak % 7 === 0) {
      await Notification.create({
        userId: user._id,
        type: 'streak_alert',
        text: `🔥 ${user.learnStreak}-day learn streak! Keep it up.`,
        link: `/profile`
      });
    }

    res.json({ learnStreak: user.learnStreak });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /streaks/help — call when mentor answers a question
router.post('/help', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (user.lastHelpDate && isSameDay(user.lastHelpDate, now)) {
      return res.json({ helpStreak: user.helpStreak, message: 'already counted today' });
    }

    const continued = user.lastHelpDate && isYesterday(user.lastHelpDate);
    user.helpStreak = continued ? user.helpStreak + 1 : 1;
    user.lastHelpDate = now;
    await user.save();

    if (user.helpStreak % 7 === 0) {
      await Notification.create({
        userId: user._id,
        type: 'streak_alert',
        text: `🙌 ${user.helpStreak}-day help streak! You're making a difference.`,
        link: `/profile`
      });
    }

    res.json({ helpStreak: user.helpStreak });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
