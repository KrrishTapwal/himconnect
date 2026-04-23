const mongoose = require('mongoose');

const externalJobSchema = new mongoose.Schema({
  indeedId:  { type: String, unique: true, sparse: true },
  title:     { type: String, required: true },
  company:   { type: String },
  location:  { type: String },
  jobType:   { type: String },
  salary:    { type: String },
  applyUrl:  { type: String },
  category:  { type: String, enum: ['tech', 'hp', 'remote', 'finance', 'govt', 'other'], default: 'other' },
  postedAt:  { type: Date },
  // auto-delete after 30 days
  fetchedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
}, { timestamps: true });

module.exports = mongoose.model('ExternalJob', externalJobSchema);
