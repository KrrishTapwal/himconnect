const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  salary: { type: String, trim: true },
  skillsRequired: [{ type: String, trim: true }],
  referralAvailable: { type: Boolean, default: false },
  deadline: { type: Date },
  interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

jobSchema.virtual('id').get(function () { return this._id.toHexString(); });
jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
