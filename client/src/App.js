import React, { useEffect, useState } from 'react';
import './style.css';

const SECONDS_IN_HOUR = 3600;

const App = () => {
  const tg = window.Telegram?.WebApp;
  const isTelegram = !!tg?.initDataUnsafe?.user;

  const telegramId = isTelegram
    ? tg.initDataUnsafe.user.id.toString()
    : '5620731331'; // test user ID in MongoDB
  const username = isTelegram
    ? tg.initDataUnsafe.user.username || 'anon'
    : 'funkydev';

  const [page, setPage] = useState('home');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [balance, setBalance] = useState(0);
  const [referrals, setReferrals] = useState([]);
  const [boosts, setBoosts] = useState({ timerBoost: false, autoClaim: false });
  const [claimCooldown, setClaimCooldown] = useState(3);

  // 🔄 Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, username }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const user = await res.json();

        setBalance(user.balance);
        setBoosts({
          timerBoost: user.claimBoost,
          autoClaim: user.autoClaim,
        });

        const boostHours = user.claimBoost || user.autoClaim ? 6 : 3;
        setClaimCooldown(boostHours);

        if (user.lastClaimTime) {
          const last = new Date(user.lastClaimTime);
          const now = new Date();
          const elapsed = Math.floor((now - last) / 1000);
          const cooldown = boostHours * SECONDS_IN_HOUR;
          setSecondsLeft(Math.max(cooldown - elapsed, 0));
        }

        const refList = user.referrals.map(r => ({
          username: r.username,
          coins: 0,
          telegramId: r.telegramId,
        }));
        setReferrals(refList);

        for (let i = 0; i < refList.length; i++) {
          const r = refList[i];
          try {
            const res = await fetch(`/api/users/${r.telegramId}`);
            if (!res.ok) continue;
            const data = await res.json();
            setReferrals(prev => {
              const updated = [...prev];
              updated[i].coins = data.balance;
              return updated;
            });
          } catch {
            // ignore individual referral fetch errors
          }
        }
      } catch (err) {
        console.error('Fetch failed:', err);
      }
    };

    fetchUser();
  }, [telegramId, username]);

  // ⏳ Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = secs => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleClaim = async () => {
    try {
      const res = await fetch(`/api/users/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setSecondsLeft(claimCooldown * SECONDS_IN_HOUR);
        alert('✅ Claimed!');
      } else {
        alert(data.error || '❌ Cannot claim yet.');
      }
    } catch (err) {
      alert('❌ Claim failed');
    }
  };

  const handleBuyBoost = async type => {
    try {
      const res = await fetch(`/api/users/buy-boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, type }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        if (type === '6h') setBoosts(prev => ({ ...prev, timerBoost: true }));
        if (type === 'auto') setBoosts(prev => ({ ...prev, autoClaim: true }));
        alert(`✅ Boost Activated: ${type}`);
      } else {
        alert(data.message || '❌ Purchase failed');
      }
    } catch (err) {
      alert('❌ Purchase error');
    }
  };

  const renderHeader = () => (
    <div className="header">
      {page !== 'home' && (
        <button className="back-button" onClick={() => setPage('home')}>
          ⬅ Back
        </button>
      )}
    </div>
  );

  const renderHome = () => (
    <div className="content">
      <h1>FunkyCoin</h1>
      <p className="balance">Balance: {balance.toLocaleString()} coins</p>
      <p className="timer">Next Claim In: {formatTime(secondsLeft)}</p>
      <button onClick={handleClaim} disabled={secondsLeft > 0 && !boosts.autoClaim}>
        {secondsLeft > 0 && !boosts.autoClaim ? '⏳ Wait...' : '💰 Claim'}
      </button>
      <div className="menu">
        <button onClick={() => setPage('profile')}>Profile</button>
        <button onClick={() => setPage('friends')}>Friends</button>
        <button onClick={() => setPage('earn')}>Earn</button>
        <button onClick={() => setPage('boost')}>Boost</button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="content">
      <h2>👤 Profile</h2>
      <p>Username: @{username}</p>
      <p>Total Coin Balance: {balance.toLocaleString()} coins</p>
    </div>
  );

  const renderFriends = () => (
    <div className="content">
      <h2>👥 Referrals</h2>
      <p>Your Referral Link:</p>
      <p>
        <code>https://t.me/funkycoin_bot?start={telegramId}</code>
      </p>
      <ul>
        {referrals.map((r, i) => (
          <li key={i}>
            @{r.username} - {r.coins.toLocaleString()} coins
          </li>
        ))}
      </ul>
    </div>
  );

  const renderEarn = () => (
    <div className="content">
      <h2>🎯 Earn</h2>
      <p>No task available yet. Stay tuned.</p>
    </div>
  );

  const renderBoost = () => (
    <div className="content">
      <h2>🚀 Boosts</h2>
      <div className="boost-option">
        <h3>6-Hour Timer Boost</h3>
        <p>Cost: 500,000 coins</p>
        <p>+3,000/hour, Manual Claim</p>
        <button disabled={boosts.timerBoost} onClick={() => handleBuyBoost('6h')}>
          {boosts.timerBoost ? '✅ Purchased' : 'Buy'}
        </button>
      </div>
      <div className="boost-option">
        <h3>AutoClaim Bot</h3>
        <p>Cost: 1,000,000 coins</p>
        <p>Auto-claims for 24h</p>
        <button disabled={boosts.autoClaim} onClick={() => handleBuyBoost('auto')}>
          {boosts.autoClaim ? '✅ Purchased' : 'Buy'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="App">
      {renderHeader()}
      {page === 'home' && renderHome()}
      {page === 'profile' && renderProfile()}
      {page === 'friends' && renderFriends()}
      {page === 'earn' && renderEarn()}
      {page === 'boost' && renderBoost()}
    </div>
  );
};

export default App;
