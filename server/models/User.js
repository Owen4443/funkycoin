const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: String,
  balance: { type: Number, default: 0 },
  referredBy: { type: String, default: null }, // Telegram ID of referrer
  referrals: [
    {
      telegramId: String,
      username: String,
    }
  ],
  claimBoost: { type: Boolean, default: false },     // 6-hour boost (manual claim)
  autoClaim: { type: Boolean, default: false },       // 24-hour autoclaim (permanent, restarts on login)
  lastClaimTime: { type: Date, default: null },       // Tracks when user last claimed
  autoClaimStart: { type: Date, default: null },      // Tracks when 24hr autoclaim started
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
