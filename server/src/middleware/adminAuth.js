const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.userId).select('role isSubAdmin');
    if (!user || (user.role !== 'admin' && !user.isSubAdmin)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.isRealAdmin = user.role === 'admin';
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
