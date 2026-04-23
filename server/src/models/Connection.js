const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meetType: { type: String, enum: ['chai', 'career', 'mock_interview'], required: true },
  message: { type: String, trim: true, maxlength: 300 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending'
  },
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

connectionSchema.virtual('id').get(function () { return this._id.toHexString(); });
connectionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Connection', connectionSchema);
