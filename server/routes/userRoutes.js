const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or fetch user
router.post('/start', async (req, res) => {
  const { telegramId, username, referredBy } = req.body;

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
          referrer.balance += 5000; // reward for referral
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

// Get user profile
router.get('/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Claim coins
router.post('/claim', async (req, res) => {
  const { telegramId } = req.body;
  const now = new Date();

  try {
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isAutoClaim = user.autoClaim;
    const isBoosted = user.claimBoost;

    const hoursSinceLastClaim = user.lastClaimTime
      ? Math.floor((now - new Date(user.lastClaimTime)) / (1000 * 60 * 60))
      : Infinity;

    const cooldownHours = isBoosted ? 6 : 3;
    const earningRate = isBoosted || isAutoClaim ? 3000 : 1000;

    if (hoursSinceLastClaim < cooldownHours && !isAutoClaim) {
      return res.status(400).json({ error: 'Claim not available yet' });
    }

    // Calculate claim
    const claimAmount = earningRate * Math.min(hoursSinceLastClaim, cooldownHours);
    user.balance += claimAmount;
    user.lastClaimTime = now;

    // AutoClaim 24h limit
    if (isAutoClaim) {
      const sinceAutoStart = Math.floor((now - new Date(user.autoClaimStart)) / (1000 * 60 * 60));
      if (sinceAutoStart >= 24) {
        user.autoClaimStart = null;
      } else {
        user.autoClaimStart = user.autoClaimStart || now;
      }
    }

    await user.save();
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Buy boost - one time only
router.post('/buy-boost', async (req, res) => {
  const { telegramId, type } = req.body;

  try {
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (type === '6h') {
      if (user.claimBoost) {
        return res.json({ success: false, message: '6h boost already purchased', balance: user.balance });
      }
      if (user.balance < 500000) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      user.balance -= 500000;
      user.claimBoost = true;
    }

    if (type === 'auto' || type === 'autoclaim') {
      if (user.autoClaim) {
        return res.json({ success: false, message: 'AutoClaim already purchased', balance: user.balance });
      }
      if (user.balance < 1000000) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
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
