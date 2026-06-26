const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImageUrl: {
    type: String, default: null
  },
  stripeCustomerId: { type: String, default: null },
  subscriptionPlan: {
    type: String,
    enum: ['Free', 'Basic', 'Pro', 'Premium'],
    default: 'Free'
  },
  subscriptionStatus: { type: String, default: 'inactive' },
  currentPeriodEnd: { type: Date, default: null },
  // AI Usage Tracking
  aiUsage: {
    insightsCount: { type: Number, default: 0 },
    insightsLastReset: { type: Date, default: Date.now },
    billScansCount: { type: Number, default: 0 },
    billScansLastReset: { type: Date, default: Date.now }
  },
  // Cache last AI analysis
  lastAIAnalysis: {
    data: { type: Object, default: null },
    generatedAt: { type: Date, default: null }
  }
},
  { timestamps: true }
)

// Hash password before saving 
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model('User', UserSchema);