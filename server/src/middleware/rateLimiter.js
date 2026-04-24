const rateLimit = require('express-rate-limit');

const msg = { message: 'Too many requests. Please try again later.' };

// Strict: 10 attempts per 15 min — auth endpoints only
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: msg,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// General: 200 requests per 15 min per IP
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: msg,
  standardHeaders: true,
  legacyHeaders: false,
});
