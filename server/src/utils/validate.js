const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;
// Accept http/https only — blocks javascript: data: etc.
const URL_RE = /^https?:\/\/.+/;

exports.isEmail = (v) => EMAIL_RE.test(v);
exports.isObjectId = (v) => OBJECTID_RE.test(v);
exports.isSafeUrl = (v) => !v || URL_RE.test(v);

// Clamp pagination — max 100 items, min 1
exports.clampLimit = (raw, def = 20) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, 100);
};

exports.clampPage = (raw) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// Validate ISO date string used in ?since= polling params
exports.isISODate = (v) => {
  if (!v) return true; // optional
  const d = new Date(v);
  return !isNaN(d.getTime());
};

// Password: min 8 chars, at least one letter and one digit
exports.isStrongPassword = (v) =>
  typeof v === 'string' && v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
