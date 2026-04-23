const mongoose = require('mongoose');

const HP_DISTRICTS = [
  'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur',
  'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti',
  'Sirmaur', 'Una', 'Kinnaur'
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'mentor'], required: true },
  hometownDistrict: { type: String, enum: HP_DISTRICTS },
  currentCity: { type: String, trim: true },
  college: { type: String, trim: true },
  graduationYear: { type: Number },
  profession: { type: String, trim: true },
  company: { type: String, trim: true },
  fieldOfInterest: {
    type: String,
    enum: ['CSE', 'Mechanical', 'Civil', 'Electrical', 'Medical', 'UPSC', 'JEE prep', 'NEET prep', 'MBA', 'Law', 'Arts', 'Other']
  },
  skills: [{ type: String, trim: true }],
  openTo: [{ type: String, enum: ['Mentorship', 'Referrals', 'Chai', 'MockInterview'] }],
  bio: { type: String, maxlength: 100, trim: true },
  linkedinUrl: { type: String, trim: true },
  meetLink: { type: String, trim: true },
  helpStreak: { type: Number, default: 0 },
  learnStreak: { type: Number, default: 0 },
  lastHelpDate: { type: Date },
  lastLearnDate: { type: Date },
  isFoundingMember: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  isTrustedMentor: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.virtual('id').get(function () { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
