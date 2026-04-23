const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_mentor', 'new_job', 'streak_alert', 'connection_request', 'connection_accepted', 'new_message', 'rating_received'],
    required: true
  },
  text: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.virtual('id').get(function () { return this._id.toHexString(); });
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
