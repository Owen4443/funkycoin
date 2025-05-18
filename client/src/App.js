import React, { useEffect, useState } from "react";
import "./style.css";

const App = () => {
  const [telegramUser, setTelegramUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  // Fetch Telegram user data with tg.ready() and delay
useEffect(() => {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready(); // ✅ Ensure Telegram initializes
    setTimeout(() => {
      const user = tg.initDataUnsafe?.user;
      console.log("initDataUnsafe:", tg.initDataUnsafe); // Debug info
      if (user) {
        setTelegramUser(user);
        fetchUser(user);
      } else {
        setError("Telegram user not found. Please open via Telegram.");
        setLoading(false);
      }
    }, 100); // slight delay to allow init
  } else {
    setError("Telegram WebApp not available");
    setLoading(false);
  }
}, []);


  // Fetch user data from server
  const fetchUser = async (user) => {
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: user.id,
          username: user.username || "",
          firstName: user.first_name || "",
        }),
      });
      const data = await res.json();
      setUserData(data);
      setTimer(data.nextClaim - Date.now());
    } catch (err) {
      setError("Failed to fetch user.");
    } finally {
      setLoading(false);
    }
  };

  // Countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Claim coins
  const handleClaim = async () => {
    if (!telegramUser || timer > 0 || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/users/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: telegramUser.id }),
      });
      const data = await res.json();
      setUserData(data);
      setTimer(data.nextClaim - Date.now());
    } catch (err) {
      setError("Claim failed.");
    }
    setClaiming(false);
  };

  // Buy boost
  const handleBoost = async (type) => {
    try {
      const res = await fetch("/api/users/buy-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: telegramUser.id, type }),
      });
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      setError("Boost purchase failed.");
    }
  };

  if (loading) return <div className="App">Loading...</div>;
  if (error) return <div className="App">{error}</div>;
  if (!userData) return <div className="App">User not loaded.</div>;

  const referralLink = `https://t.me/funkycoin_bot?start=${telegramUser.id}`;

  return (
    <div className="App">
      <div className="header">
        <button className="close-button" onClick={() => window.Telegram?.WebApp?.close()}>
          Close
        </button>
      </div>

      <div className="menu">
        <button onClick={() => setActiveTab("profile")}>Profile</button>
        <button onClick={() => setActiveTab("friends")}>Friends</button>
        <button onClick={() => setActiveTab("earn")}>Earn</button>
        <button onClick={() => setActiveTab("boost")}>Boost</button>
      </div>

      {activeTab === "profile" && (
        <div className="content">
          <h2>Welcome, {telegramUser.first_name}</h2>
          <p><strong>Total Coins:</strong> {userData.coins.toLocaleString()}</p>
          <div className="timer">
            {timer > 0 ? `Next Claim: ${formatTime(timer)}` : "You can claim now!"}
          </div>
          <button
            className="claim-button"
            onClick={handleClaim}
            disabled={timer > 0 || claiming}
          >
            {claiming ? "Claiming..." : "CLAIM"}
          </button>
        </div>
      )}

      {activeTab === "friends" && (
        <div className="content">
          <h3>Your Referral Link:</h3>
          <p>{referralLink}</p>
          <h3>Referrals:</h3>
          {userData.referrals.length === 0 ? (
            <p>No referrals yet.</p>
          ) : (
            <ul>
              {userData.referrals.map((ref, i) => (
                <li key={i}>
                  @{ref.username || "unknown"} — {ref.coins.toLocaleString()} coins
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "earn" && (
        <div className="content">
          <h3>Earn</h3>
          <p>No task available yet. Stay tuned.</p>
        </div>
      )}

      {activeTab === "boost" && (
        <div className="content">
          <div className="boost-option">
            <h3>6-Hour Timer Boost</h3>
            <p>Cost: 500,000 coins — Manual claim every 6 hours. Earnings: 3,000/hour.</p>
            <button
              className="claim-button"
              disabled={userData.coins < 500000}
              onClick={() => handleBoost("timer")}
            >
              Buy Boost
            </button>
          </div>

          <div className="boost-option">
            <h3>AutoClaim Bot</h3>
            <p>Cost: 1,000,000 coins — Auto-claims every 6h for 24h.</p>
            <button
              className="claim-button"
              disabled={userData.coins < 1000000}
              onClick={() => handleBoost("auto")}
            >
              Buy AutoClaim
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
