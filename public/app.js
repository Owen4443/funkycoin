let balance = 0;
let referrals = [{ username: "@john_doe", balance: 5000 }];
let claimInterval = 3 * 60 * 60 * 1000; // 3 hours default
let lastClaim = Date.now();
let autoClaim = false;
let autoClaimExpires = 0;

function updateBalanceDisplay() {
  document.getElementById("balance").innerText = `Balance: ${balance.toLocaleString()} 🪙`;
}

function switchTab(tab) {
  const content = document.getElementById("content");
  if (tab === "profile") {
    content.innerHTML = `
      <h2>👤 Profile</h2>
      <p>Name: You</p>
      <p>Timer: <span id="timer"></span></p>
      <button onclick="claimCoins()">Claim</button>
    `;
    updateTimer();
  } else if (tab === "friends") {
    content.innerHTML = `
      <h2>👥 Friends</h2>
      <p>Total Referrals: ${referrals.length}</p>
      <ul>
        ${referrals.map(ref => `<li>${ref.username} – ${ref.balance} 🪙</li>`).join("")}
      </ul>
      <p>Your Referral Link: <code>https://t.me/Thefunkycoinbot?start=YOUR_ID</code></p>
    `;
  } else if (tab === "earn") {
    content.innerHTML = `
      <h2>📝 Earn</h2>
      <p>Tasks coming soon...</p>
    `;
  } else if (tab === "boost") {
    content.innerHTML = `
      <h2>⚡ Boost</h2>
      <button onclick="upgradeTimer()">Buy 12-Hour Timer (500,000 🪙)</button>
      <button onclick="activateAutoClaim()">Buy AutoClaim (1,000,000 🪙)</button>
    `;
  }
}

function claimCoins() {
  const now = Date.now();
  let timePassed = now - lastClaim;

  let interval = claimInterval;
  if (autoClaim && now < autoClaimExpires) {
    // AutoClaiming
    let earned = Math.floor((timePassed / 3600000)) * 1000;
    balance += earned;
    lastClaim = now;
    updateBalanceDisplay();
  } else if (timePassed >= interval) {
    let hours = Math.floor(timePassed / 3600000);
    let earned = hours * 1000;
    balance += earned;
    lastClaim = now;
    updateBalanceDisplay();
  } else {
    alert("Claim not ready yet!");
  }
}

function updateTimer() {
  const timer = document.getElementById("timer");
  if (!timer) return;
  const now = Date.now();
  const diff = claimInterval - (now - lastClaim);
  if (diff <= 0) {
    timer.innerText = "Ready to claim!";
  } else {
    let h = Math.floor(diff / (1000 * 60 * 60));
    let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let s = Math.floor((diff % (1000 * 60)) / 1000);
    timer.innerText = `${h}h ${m}m ${s}s`;
  }
  requestAnimationFrame(updateTimer);
}

function upgradeTimer() {
  if (claimInterval === 12 * 60 * 60 * 1000) {
    alert("Already upgraded to 12-hour timer.");
    return;
  }
  if (balance >= 500000) {
    claimInterval = 12 * 60 * 60 * 1000;
    alert("Timer upgraded to 12 hours!");
  } else {
    alert("Not enough FunkyCoins!");
  }
}

function activateAutoClaim() {
  if (autoClaim && Date.now() < autoClaimExpires) {
    alert("AutoClaim is already active!");
    return;
  }
  if (balance >= 1000000) {
    autoClaim = true;
    autoClaimExpires = Date.now() + 24 * 60 * 60 * 1000;
    alert("AutoClaim activated for 24 hours!");
  } else {
    alert("Not enough FunkyCoins!");
  }
}

// Start on profile view
switchTab('profile');
updateBalanceDisplay();
