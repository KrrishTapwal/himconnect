const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['job_crack', 'exam_crack', 'tip', 'question', 'story'],
    required: true
  },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  body: { type: String, required: true, trim: true, maxlength: 500 },
  youtubeLink: { type: String, trim: true },
  examName: { type: String, trim: true },
  rank: { type: String, trim: true },
  collegeCracked: { type: String, trim: true },
  companyName: { type: String, trim: true },
  role: { type: String, trim: true },
  salary: { type: String, trim: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

postSchema.virtual('id').get(function () { return this._id.toHexString(); });
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
