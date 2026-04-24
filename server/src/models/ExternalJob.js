const mongoose = require('mongoose');

const externalJobSchema = new mongoose.Schema({
  indeedId:  { type: String, unique: true, sparse: true },
  source:    { type: String, default: 'Unknown' },
  title:     { type: String, required: true },
  company:   { type: String },
  location:  { type: String },
  jobType:   { type: String },
  salary:    { type: String },
  applyUrl:  { type: String },
  category:  { type: String, enum: ['tech', 'local', 'remote', 'finance', 'govt', 'other'], default: 'other' },
  postedAt:  { type: Date },
  // auto-delete after 14 days
  fetchedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 14 }
}, { timestamps: true });

module.exports = mongoose.model('ExternalJob', externalJobSchema);
