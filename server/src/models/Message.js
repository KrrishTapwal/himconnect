const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

messageSchema.virtual('id').get(function () { return this._id.toHexString(); });
messageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);
