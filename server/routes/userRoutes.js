const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 🔐 Verify initData
function isValidTelegramInitData(initData) {
  const parsed = Object.fromEntries(new URLSearchParams(initData));
  const hash = parsed.hash;
  delete parsed.hash;

  const sortedData = Object.keys(parsed)
    .sort()
    .map(key => `${key}=${parsed[key]}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secret).update(sortedData).digest('hex');

  return computedHash === hash;
}

// 📌 /start — Create or fetch user
router.post('/start', async (req, res) => {
  const { initData, referredBy } = req.body;

  if (!isValidTelegramInitData(initData)) {
    return res.status(403).json({ error: 'Invalid initData' });
  }

  const parsed = Object.fromEntries(new URLSearchParams(initData));
  const telegramId = parsed.user?.id || parsed.id;
  const username = parsed.user?.username || parsed.username || `id${telegramId}`;

  try {
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({ telegramId, username });

      // Handle referral
      if (referredBy && referredBy !== telegramId) {
        const referrer = await User.findOne({ telegramId: referredBy });
        if (referrer) {
          user.referredBy = referredBy;
          referrer.referrals.push({ telegramId, username });
          referrer.balance += 5000;
          await referrer.save();
        }
      }

      await user.save();
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET /:telegramId — Fetch profile
router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST /claim
router.post('/claim', async (req, res) => {
  const { telegramId } = req.body;
  const now = new Date();

  try {
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isAuto = user.autoClaim;
    const isBoosted = user.claimBoost;
    const cooldown = isAuto || isBoosted ? 6 : 3;
    const rate = isAuto || isBoosted ? 3000 : 1000;
    const lastClaim = user.lastClaimTime || new Date(0);
    const hoursSince = Math.floor((now - lastClaim) / (1000 * 60 * 60));

    if (hoursSince < cooldown) {
      return res.status(400).json({ error: `Claim not ready. Wait ${cooldown - hoursSince}h` });
    }

    if (isAuto) {
      if (!user.autoClaimStart) {
        user.autoClaimStart = now;
      } else {
        const autoElapsed = Math.floor((now - user.autoClaimStart) / (1000 * 60 * 60));
        if (autoElapsed >= 24) {
          user.autoClaimStart = null;
          return res.status(400).json({ error: 'AutoClaim expired. Claim manually to restart.' });
        }
      }
    }

    const earnedHours = Math.min(hoursSince, cooldown);
    const earnedCoins = rate * earnedHours;

    if (earnedCoins <= 0) {
      return res.status(400).json({ error: 'Nothing to claim yet' });
    }

    user.balance += earnedCoins;
    user.lastClaimTime = now;

    await user.save();
    res.json({ success: true, balance: user.balance, claimAmount: earnedCoins });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST /buy-boost
router.post('/buy-boost', async (req, res) => {
  const { telegramId, type } = req.body;

  try {
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (type === '6h') {
      if (user.claimBoost) return res.json({ success: false, message: 'Already bought' });
      if (user.balance < 500000) return res.status(400).json({ error: 'Not enough coins' });
      user.balance -= 500000;
      user.claimBoost = true;
    }

    if (type === 'auto') {
      if (user.autoClaim) return res.json({ success: false, message: 'Already bought' });
      if (user.balance < 1000000) return res.status(400).json({ error: 'Not enough coins' });
      user.balance -= 1000000;
      user.autoClaim = true;
      user.autoClaimStart = new Date();
    }

    await user.save();
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
