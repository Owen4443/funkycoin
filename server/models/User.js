const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, default: '' },
  balance: { type: Number, default: 0 },

  referredBy: { type: String, default: null }, // Telegram ID of referrer

  referrals: [
    {
      telegramId: String,
      username: String,
    }
  ],

  claimBoost: { type: Boolean, default: false },   // 6-hour manual boost
  autoClaim: { type: Boolean, default: false },    // 24hr auto boost (permanent)

  lastClaimTime: { type: Date, default: null },    // When user last claimed
  autoClaimStart: { type: Date, default: null },   // 24hr autoclaim tracking

  boostType: { type: String, default: 'none' },    // Optional: 'none', 'claimBoost', 'autoClaim'
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
