import { useState, useEffect, useRef, useCallback } from "react";

// ── Floating hearts background ──────────────────────────────────────────────
const HEARTS = ["❤️", "🤍", "✨", "💛", "🌙"];

function FloatingParticle({ id }) {
  const style = {
    left: `${Math.random() * 100}%`,
    animationDuration: `${8 + Math.random() * 12}s`,
    animationDelay: `${Math.random() * 10}s`,
    fontSize: `${10 + Math.random() * 14}px`,
    opacity: 0.18 + Math.random() * 0.22,
  };
  return (
    <span className="particle" style={style}>
      {HEARTS[id % HEARTS.length]}
    </span>
  );
}

// ── Animated streak ring ─────────────────────────────────────────────────────
function StreakRing({ value, max = 365 }) {
  const pct = Math.min(value / max, 1);
  const r = 88;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <svg className="streak-ring" viewBox="0 0 200 200" width="220" height="220">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#c97d4e" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
      {/* Progress */}
      <circle
        cx="100" cy="100" r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        filter="url(#glow)"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ── Milestone badge ──────────────────────────────────────────────────────────
function MilestoneBadge({ days, label, emoji, unlocked }) {
  return (
    <div className={`badge ${unlocked ? "badge--unlocked" : "badge--locked"}`}>
      <span className="badge-emoji">{emoji}</span>
      <span className="badge-days">{days}d</span>
      <span className="badge-label">{label}</span>
    </div>
  );
}

// ── Mood button ──────────────────────────────────────────────────────────────
function MoodBtn({ emoji, label, active, onClick }) {
  return (
    <button
      className={`mood-btn ${active ? "mood-btn--active" : ""}`}
      onClick={onClick}
    >
      <span>{emoji}</span>
      <small>{label}</small>
    </button>
  );
}

// ── Quote rotator ────────────────────────────────────────────────────────────
const QUOTES = [
  "Love is not about how many days you're together, but how many days you choose each other.",
  "Peace between two people isn't silence — it's trust speaking louder than any argument.",
  "The bravest thing two lovers can do is choose calm over chaos, again and again.",
  "Your streak isn't a number — it's proof that you both decided love was worth protecting.",
  "Every day without a fight is a day you built something most people only dream about.",
  "Patience is the quietest form of love, and consistency is its loudest proof.",
];

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [streak, setStreak] = useState(47);
  const [longestStreak, setLongestStreak] = useState(89);
  const [totalPeaceful, setTotalPeaceful] = useState(134);
  const [xp, setXp] = useState(1340);
  const [level, setLevel] = useState(5);
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([
    { id: 1, author: "Jamila", text: "I love how patient you've been with me lately 🌙", time: "2h ago" },
    { id: 2, author: "Jamal", text: "Every day with you feels like winning 🏆", time: "5h ago" },
  ]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [music, setMusic] = useState(false);
  const [todayConfirmed, setTodayConfirmed] = useState(false);
  const [page, setPage] = useState("landing"); // landing | app
  const [userName, setUserName] = useState("");
  const [loginName, setLoginName] = useState("");

  const milestones = [
    { days: 7, label: "First Week", emoji: "🌱" },
    { days: 30, label: "A Month", emoji: "🌸" },
    { days: 100, label: "100 Days", emoji: "💎" },
    { days: 365, label: "A Year", emoji: "👑" },
  ];

  // Quote rotation
  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  function handlePeaceConfirm() {
    if (todayConfirmed) return;
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 2500);
    setStreak(s => {
      const ns = s + 1;
      if (ns > longestStreak) setLongestStreak(ns);
      return ns;
    });
    setTotalPeaceful(t => t + 1);
    setXp(x => x + 30);
    setTodayConfirmed(true);
  }

  function handleReset() {
    setStreak(0);
    setShowResetConfirm(false);
    setTodayConfirmed(false);
  }

  function addNote() {
    if (!note.trim()) return;
    setNotes(n => [{ id: Date.now(), author: userName || "You", text: note, time: "just now" }, ...n]);
    setNote("");
  }

  function handleLogin() {
    if (!loginName.trim()) return;
    setUserName(loginName.trim());
    setPage("app");
  }

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  if (page === "landing") {
    return (
      <>
        <style>{CSS}</style>
        <div className="landing">
          {/* particles */}
          <div className="particles">
            {Array.from({ length: 18 }, (_, i) => <FloatingParticle key={i} id={i} />)}
          </div>

          {/* nav */}
          <nav className="landing-nav">
            <span className="brand">Jamila / Jamal</span>
            <button className="btn-ghost" onClick={() => setPage("app")}>Sign In</button>
          </nav>

          {/* hero */}
          <section className="hero">
            <div className="couple-illustration">
              {/* SVG couple */}
              <svg viewBox="0 0 340 340" className="couple-svg">
                <defs>
                  <radialGradient id="glowBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <linearGradient id="skinM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5E3C" />
                    <stop offset="100%" stopColor="#6B4226" />
                  </linearGradient>
                  <linearGradient id="skinF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8C9A0" />
                    <stop offset="100%" stopColor="#D4A976" />
                  </linearGradient>
                  <linearGradient id="shirtM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#0d0d0d" />
                  </linearGradient>
                  <linearGradient id="shirtF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c97d4e" />
                    <stop offset="100%" stopColor="#a05f38" />
                  </linearGradient>
                </defs>

                {/* glow bg */}
                <ellipse cx="170" cy="200" rx="140" ry="120" fill="url(#glowBg)" />

                {/* ── MALE character (left) ── */}
                {/* body */}
                <rect x="60" y="200" width="80" height="110" rx="16" fill="url(#shirtM)" />
                {/* neck */}
                <rect x="90" y="178" width="22" height="28" rx="6" fill="url(#skinM)" />
                {/* head */}
                <ellipse cx="101" cy="162" rx="34" ry="36" fill="url(#skinM)" />
                {/* dreadlocks */}
                {[
                  [78, 130], [86, 122], [96, 118], [106, 118], [116, 122],
                  [124, 130], [130, 142], [74, 145], [70, 158],
                ].map(([x, y], i) => (
                  <ellipse key={i} cx={x} cy={y} rx="5" ry="14"
                    fill="#2C1A0E" transform={`rotate(${(x - 101) * 1.2} ${x} ${y})`} />
                ))}
                {/* eyes */}
                <ellipse cx="90" cy="160" rx="5" ry="5.5" fill="#1a0f00" />
                <ellipse cx="112" cy="160" rx="5" ry="5.5" fill="#1a0f00" />
                <circle cx="92" cy="158" r="1.5" fill="white" />
                <circle cx="114" cy="158" r="1.5" fill="white" />
                {/* smile */}
                <path d="M 88 174 Q 101 183 114 174" stroke="#5C2A00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* arm reaching */}
                <rect x="132" y="205" width="18" height="60" rx="9" fill="url(#skinM)" />
                {/* left arm */}
                <rect x="44" y="205" width="18" height="55" rx="9" fill="url(#skinM)" />
                {/* gold chain */}
                <path d="M 80 215 Q 101 228 122 215" stroke="#d4af37" strokeWidth="2" fill="none" opacity="0.8" />

                {/* ── FEMALE character (right) ── */}
                {/* body */}
                <rect x="200" y="200" width="80" height="110" rx="16" fill="url(#shirtF)" />
                {/* neck */}
                <rect x="228" y="178" width="22" height="28" rx="6" fill="url(#skinF)" />
                {/* head */}
                <ellipse cx="239" cy="162" rx="33" ry="35" fill="url(#skinF)" />
                {/* hair */}
                <ellipse cx="239" cy="138" rx="35" ry="22" fill="#2C1A0E" />
                <ellipse cx="210" cy="162" rx="10" ry="24" fill="#2C1A0E" />
                <ellipse cx="268" cy="162" rx="10" ry="24" fill="#2C1A0E" />
                {/* eyes */}
                <ellipse cx="228" cy="160" rx="5" ry="5.5" fill="#1a0f00" />
                <ellipse cx="250" cy="160" rx="5" ry="5.5" fill="#1a0f00" />
                <circle cx="230" cy="158" r="1.5" fill="white" />
                <circle cx="252" cy="158" r="1.5" fill="white" />
                {/* eyelashes */}
                <path d="M 223 155 L 221 151 M 226 154 L 225 150 M 229 154 L 229 150" stroke="#1a0f00" strokeWidth="1.5" />
                <path d="M 245 155 L 247 151 M 248 154 L 249 150 M 251 155 L 253 151" stroke="#1a0f00" strokeWidth="1.5" />
                {/* smile */}
                <path d="M 226 174 Q 239 184 252 174" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* tattoo hint on arm */}
                <rect x="268" y="210" width="16" height="55" rx="8" fill="url(#skinF)" />
                <path d="M 270 225 Q 275 218 280 225 Q 275 232 270 225" stroke="#6B4226" strokeWidth="1" fill="none" opacity="0.6" />
                {/* left arm reaching */}
                <rect x="207" y="210" width="16" height="55" rx="8" fill="url(#skinF)" />

                {/* Joined hands in center */}
                <ellipse cx="170" cy="268" rx="20" ry="12" fill="url(#skinM)" opacity="0.9" />
                <ellipse cx="170" cy="268" rx="14" ry="9" fill="url(#skinF)" opacity="0.9" />

                {/* floating hearts */}
                <text x="145" y="120" fontSize="18" opacity="0.7">💛</text>
                <text x="195" y="105" fontSize="14" opacity="0.5">✨</text>
                <text x="108" y="108" fontSize="12" opacity="0.4">❤️</text>
              </svg>
            </div>

            <div className="hero-text">
              <p className="hero-eyebrow">A sanctuary for two</p>
              <h1 className="hero-title">
                <span className="gold">Jamila</span>
                <span className="divider"> / </span>
                <span>Jamal</span>
              </h1>
              <p className="hero-sub">
                Track your peace. Protect your streak. <br />Build love worth keeping.
              </p>

              <div className="hero-streak-preview">
                <StreakRing value={47} />
                <div className="streak-center-text">
                  <span className="streak-num">47</span>
                  <span className="streak-label">Peaceful Days</span>
                </div>
              </div>

              <div className="hero-cta">
                <button className="btn-primary" onClick={() => setPage("app")}>
                  Start Our Journey ✨
                </button>
                <button className="btn-secondary" onClick={() => setPage("app")}>
                  Protect Our Streak 🔥
                </button>
              </div>
            </div>
          </section>

          {/* features */}
          <section className="features">
            {[
              { icon: "🔥", title: "Peace Streak", desc: "Every peaceful day counts. Watch your streak grow and protect it together." },
              { icon: "💌", title: "Love Notes", desc: "Leave daily messages, apologies, and affirmations for each other." },
              { icon: "🏆", title: "Milestones", desc: "Unlock badges and rewards at 7, 30, 100, and 365 days." },
              { icon: "🌙", title: "Mood Tracker", desc: "Check in daily and understand each other's emotional state." },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </section>

          {/* login */}
          <section className="login-section">
            <div className="login-card glass">
              <h2>Begin Your Story</h2>
              <p>Connect with your partner and start your shared journey.</p>
              <input
                className="login-input"
                placeholder="Your name (e.g. Jamila or Jamal)"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button className="btn-primary full-width" onClick={handleLogin}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </section>

          <footer className="landing-footer">
            <p>Made with love · Jamila / Jamal © 2025</p>
          </footer>
        </div>
      </>
    );
  }

  // ── APP ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="particles">
          {Array.from({ length: 12 }, (_, i) => <FloatingParticle key={i} id={i} />)}
        </div>

        {/* top bar */}
        <header className="app-header">
          <span className="brand" onClick={() => setPage("landing")}>J / J</span>
          <div className="header-center">
            <span className="xp-badge">⚡ {xp} XP · Lv {level}</span>
          </div>
          <button className="music-btn" onClick={() => setMusic(m => !m)} title="Ambient music">
            {music ? "🔊" : "🔇"}
          </button>
        </header>

        {/* bottom nav */}
        <nav className="bottom-nav">
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "notes", icon: "💌", label: "Notes" },
            { id: "mood", icon: "🌙", label: "Mood" },
            { id: "badges", icon: "🏆", label: "Badges" },
          ].map(t => (
            <button
              key={t.id}
              className={`nav-btn ${activeTab === t.id ? "nav-btn--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <small>{t.label}</small>
            </button>
          ))}
        </nav>

        {/* ── HOME TAB ── */}
        {activeTab === "home" && (
          <main className="tab-content">
            {/* quote */}
            <div className="quote-bar glass">
              <p key={quoteIdx} className="quote-text fade-in">"{QUOTES[quoteIdx]}"</p>
            </div>

            {/* streak hero */}
            <div className={`streak-hero glass ${celebrating ? "celebrating" : ""}`}>
              <p className="streak-eyebrow">✨ Your Current Streak</p>
              <div className="streak-ring-wrap">
                <StreakRing value={streak} />
                <div className="streak-center">
                  <span className="streak-big">{streak}</span>
                  <span className="streak-unit">days</span>
                  {celebrating && <div className="celebrate-burst">🎉</div>}
                </div>
              </div>
              <p className="streak-sub">of peaceful, beautiful love</p>

              <div className="streak-stats">
                <div className="stat-item">
                  <span className="stat-val">{longestStreak}</span>
                  <span className="stat-key">Longest</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-val">{totalPeaceful}</span>
                  <span className="stat-key">Total Days</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-val">Lv {level}</span>
                  <span className="stat-key">Couple Level</span>
                </div>
              </div>
            </div>

            {/* daily check */}
            <div className="daily-check glass">
              <h3>Daily Peace Check</h3>
              <p>Did you both maintain peace today?</p>
              <div className="check-actions">
                <button
                  className={`btn-confirm ${todayConfirmed ? "btn-confirmed" : ""}`}
                  onClick={handlePeaceConfirm}
                  disabled={todayConfirmed}
                >
                  {todayConfirmed ? "✅ Confirmed for today!" : "✨ Yes, we had peace"}
                </button>
                <button
                  className="btn-reset-trigger"
                  onClick={() => setShowResetConfirm(true)}
                >
                  😔 We had a fight
                </button>
              </div>
            </div>

            {/* next milestone */}
            {(() => {
              const next = milestones.find(m => m.days > streak);
              if (!next) return null;
              const daysLeft = next.days - streak;
              return (
                <div className="next-milestone glass">
                  <span className="milestone-emoji">{next.emoji}</span>
                  <div>
                    <p className="milestone-title">{next.label} in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(streak / next.days) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* reset confirm */}
            {showResetConfirm && (
              <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                <div className="modal glass" onClick={e => e.stopPropagation()}>
                  <h3>Reset Streak?</h3>
                  <p>This will reset your {streak}-day streak to 0. Use this honestly — honesty builds stronger love. 💛</p>
                  <div className="modal-actions">
                    <button className="btn-danger" onClick={handleReset}>Yes, reset</button>
                    <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === "notes" && (
          <main className="tab-content">
            <div className="section-header">
              <h2>Love Notes 💌</h2>
              <p>Messages just for the two of you</p>
            </div>
            <div className="note-input-wrap glass">
              <textarea
                className="note-input"
                placeholder="Write something beautiful… 🌙"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
              <button className="btn-primary" onClick={addNote}>Send Note 💛</button>
            </div>
            <div className="notes-list">
              {notes.map(n => (
                <div key={n.id} className="note-card glass fade-in">
                  <div className="note-header">
                    <span className="note-author">{n.author}</span>
                    <span className="note-time">{n.time}</span>
                  </div>
                  <p className="note-text">{n.text}</p>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ── MOOD TAB ── */}
        {activeTab === "mood" && (
          <main className="tab-content">
            <div className="section-header">
              <h2>How are you feeling? 🌙</h2>
              <p>Check in — let your partner know your heart</p>
            </div>
            <div className="mood-grid glass">
              {[
                { emoji: "😌", label: "Peaceful" },
                { emoji: "💛", label: "Loving" },
                { emoji: "😔", label: "Sad" },
                { emoji: "😤", label: "Frustrated" },
                { emoji: "🥰", label: "Adoring" },
                { emoji: "😴", label: "Tired" },
                { emoji: "🌟", label: "Grateful" },
                { emoji: "🤗", label: "Needing Hug" },
              ].map(m => (
                <MoodBtn
                  key={m.label}
                  emoji={m.emoji}
                  label={m.label}
                  active={mood === m.label}
                  onClick={() => setMood(m.label)}
                />
              ))}
            </div>
            {mood && (
              <div className="mood-response glass fade-in">
                <p>You're feeling <strong>{mood}</strong> today 🌙</p>
                <p className="mood-tip">
                  {mood === "Frustrated"
                    ? "Take a breath. Communicate calmly. Your partner loves you. 💛"
                    : mood === "Sad"
                    ? "Reach out — let your partner be there for you. 🤗"
                    : "Beautiful. Share this feeling with your partner. ✨"}
                </p>
              </div>
            )}

            <div className="anniversary glass">
              <span className="anniversary-icon">💍</span>
              <div>
                <p className="anniversary-label">Together Since</p>
                <p className="anniversary-date">March 14, 2024</p>
                <p className="anniversary-count">427 days of choosing each other</p>
              </div>
            </div>
          </main>
        )}

        {/* ── BADGES TAB ── */}
        {activeTab === "badges" && (
          <main className="tab-content">
            <div className="section-header">
              <h2>Milestones 🏆</h2>
              <p>Every badge is proof of your love</p>
            </div>
            <div className="badges-grid">
              {milestones.map(m => (
                <MilestoneBadge
                  key={m.days}
                  days={m.days}
                  label={m.label}
                  emoji={m.emoji}
                  unlocked={streak >= m.days || longestStreak >= m.days}
                />
              ))}
            </div>

            <div className="xp-section glass">
              <h3>Couple Progress</h3>
              <div className="xp-bar-wrap">
                <div className="xp-info">
                  <span>Level {level}</span>
                  <span>{xp % 500}/500 XP</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(xp % 500) / 5}%` }} />
                </div>
                <p className="xp-next">Level {level + 1} in {500 - (xp % 500)} XP</p>
              </div>

              <div className="achievements">
                {[
                  { icon: "🌱", title: "First Week", desc: "7 days of peace", done: streak >= 7 || longestStreak >= 7 },
                  { icon: "💬", title: "Communicators", desc: "Send 5 love notes", done: notes.length >= 5 },
                  { icon: "🌙", title: "Night Owl", desc: "Check in after midnight", done: false },
                  { icon: "🔥", title: "On Fire", desc: "30-day streak", done: longestStreak >= 30 },
                ].map(a => (
                  <div key={a.title} className={`achievement-item ${a.done ? "done" : "locked"}`}>
                    <span>{a.icon}</span>
                    <div>
                      <p className="ach-title">{a.title}</p>
                      <p className="ach-desc">{a.desc}</p>
                    </div>
                    {a.done && <span className="ach-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold: #d4af37;
  --gold-light: #f5c842;
  --brown: #6B4226;
  --brown-dark: #3d2314;
  --bg: #0a0705;
  --bg2: #110c08;
  --surface: rgba(255,255,255,0.04);
  --border: rgba(212,175,55,0.15);
  --text: #f2e8d5;
  --text-muted: rgba(242,232,213,0.5);
  --pink: rgba(201,125,78,0.3);
  --radius: 20px;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  min-height: 100vh;
  overflow-x: hidden;
}

/* particles */
.particles {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
}
.particle {
  position: absolute;
  bottom: -20px;
  animation: float-up linear infinite;
  user-select: none;
}
@keyframes float-up {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
}

/* glassmorphism */
.glass {
  background: var(--surface);
  border: 1px solid var(--border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius);
}

/* ── LANDING ── */
.landing {
  min-height: 100vh;
  background: radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 100%, rgba(201,125,78,0.06) 0%, transparent 60%),
              var(--bg);
  position: relative;
}

.landing-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.2rem 2rem;
  position: relative; z-index: 10;
}

.brand {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 500;
  color: var(--gold); letter-spacing: 0.05em;
  cursor: pointer;
}

.hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 2rem 1.5rem 4rem;
  position: relative; z-index: 5; text-align: center;
}

.couple-illustration {
  width: min(340px, 90vw); margin-bottom: 1.5rem;
}

.couple-svg {
  width: 100%; height: auto;
  filter: drop-shadow(0 0 40px rgba(212,175,55,0.2));
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.hero-eyebrow {
  font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--gold); opacity: 0.7; margin-bottom: 0.5rem;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 8vw, 5rem);
  font-weight: 300; line-height: 1.1;
  margin-bottom: 1rem;
}

.gold { color: var(--gold); }
.divider { color: var(--text-muted); }

.hero-sub {
  color: var(--text-muted); font-size: 1.05rem; line-height: 1.7;
  margin-bottom: 2.5rem; max-width: 380px;
}

.hero-streak-preview {
  position: relative; display: inline-flex;
  align-items: center; justify-content: center;
  margin-bottom: 2.5rem;
}

.streak-ring { position: relative; z-index: 2; }
.streak-center-text {
  position: absolute; display: flex; flex-direction: column; align-items: center;
}
.streak-num {
  font-family: var(--font-display);
  font-size: 3.5rem; font-weight: 300; color: var(--gold); line-height: 1;
}
.streak-label {
  font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--text-muted); margin-top: 0.2rem;
}

.hero-cta {
  display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
}

/* buttons */
.btn-primary {
  background: linear-gradient(135deg, var(--gold) 0%, #c97d4e 100%);
  color: #0a0705; font-weight: 600; font-family: var(--font-body);
  border: none; border-radius: 50px; padding: 0.9rem 2rem;
  font-size: 0.95rem; cursor: pointer; display: inline-flex;
  align-items: center; gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 24px rgba(212,175,55,0.3);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(212,175,55,0.45); }
.btn-primary.full-width { width: 100%; justify-content: center; margin-top: 0.5rem; }

.btn-secondary {
  background: transparent; border: 1px solid var(--border);
  color: var(--text); font-family: var(--font-body);
  border-radius: 50px; padding: 0.9rem 2rem; font-size: 0.95rem;
  cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.btn-secondary:hover { background: var(--surface); border-color: var(--gold); }

.btn-ghost {
  background: transparent; border: 1px solid var(--border);
  color: var(--text-muted); font-family: var(--font-body);
  border-radius: 50px; padding: 0.5rem 1.2rem; font-size: 0.85rem;
  cursor: pointer; transition: color 0.2s, border-color 0.2s;
}
.btn-ghost:hover { color: var(--gold); border-color: var(--gold); }

/* features section */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; padding: 2rem 1.5rem;
  position: relative; z-index: 5;
}
.feature-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1.5rem;
  transition: transform 0.2s, border-color 0.2s;
}
.feature-card:hover { transform: translateY(-4px); border-color: rgba(212,175,55,0.4); }
.feature-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
.feature-card h3 {
  font-family: var(--font-display); font-weight: 500; font-size: 1.2rem;
  color: var(--gold); margin-bottom: 0.4rem;
}
.feature-card p { color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; }

/* login section */
.login-section {
  display: flex; justify-content: center;
  padding: 2rem 1.5rem 4rem; position: relative; z-index: 5;
}
.login-card {
  width: 100%; max-width: 440px; padding: 2.5rem;
  text-align: center;
}
.login-card h2 {
  font-family: var(--font-display); font-size: 2rem; font-weight: 400;
  margin-bottom: 0.5rem; color: var(--gold);
}
.login-card p { color: var(--text-muted); margin-bottom: 1.5rem; }
.login-input {
  width: 100%; background: rgba(255,255,255,0.06);
  border: 1px solid var(--border); border-radius: 12px;
  color: var(--text); font-family: var(--font-body); font-size: 1rem;
  padding: 0.85rem 1rem; margin-bottom: 1rem; outline: none;
  transition: border-color 0.2s;
}
.login-input:focus { border-color: var(--gold); }
.login-input::placeholder { color: var(--text-muted); }

.landing-footer {
  text-align: center; padding: 1.5rem;
  color: var(--text-muted); font-size: 0.8rem;
  position: relative; z-index: 5;
}

/* ── APP ── */
.app {
  min-height: 100vh; padding-bottom: 80px;
  background: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.07) 0%, transparent 55%), var(--bg);
  position: relative;
}

.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(10,7,5,0.8); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}
.header-center { flex: 1; text-align: center; }
.xp-badge {
  font-size: 0.8rem; color: var(--gold);
  background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2);
  border-radius: 50px; padding: 0.3rem 0.9rem;
}
.music-btn {
  background: none; border: none; font-size: 1.2rem; cursor: pointer;
  opacity: 0.7; transition: opacity 0.2s;
}
.music-btn:hover { opacity: 1; }

.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; background: rgba(10,7,5,0.95);
  backdrop-filter: blur(20px); border-top: 1px solid var(--border);
  z-index: 100; padding: 0.5rem 0;
}
.nav-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: none; border: none; color: var(--text-muted);
  font-family: var(--font-body); cursor: pointer; padding: 0.4rem 0;
  transition: color 0.2s; font-size: 1.3rem;
}
.nav-btn small { font-size: 0.65rem; letter-spacing: 0.05em; }
.nav-btn--active { color: var(--gold); }

.tab-content {
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1.2rem;
  max-width: 600px; margin: 0 auto; position: relative; z-index: 5;
}

/* quote */
.quote-bar { padding: 1rem 1.4rem; }
.quote-text {
  font-family: var(--font-display); font-style: italic;
  font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;
  text-align: center;
}

/* streak hero */
.streak-hero {
  padding: 2rem 1.5rem; text-align: center;
  transition: box-shadow 0.5s;
}
.streak-hero.celebrating {
  box-shadow: 0 0 60px rgba(212,175,55,0.4), 0 0 0 2px rgba(212,175,55,0.3);
  animation: pulse-glow 2.5s ease;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  50% { box-shadow: 0 0 80px rgba(212,175,55,0.5), 0 0 0 3px rgba(212,175,55,0.4); }
  100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
}
.streak-eyebrow {
  font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--gold); opacity: 0.7; margin-bottom: 1.5rem;
}
.streak-ring-wrap {
  position: relative; display: inline-flex;
  align-items: center; justify-content: center; margin-bottom: 1rem;
}
.streak-center {
  position: absolute; display: flex; flex-direction: column; align-items: center;
}
.streak-big {
  font-family: var(--font-display); font-size: 4rem; font-weight: 300;
  color: var(--gold); line-height: 1;
  transition: transform 0.3s;
}
.streak-unit {
  font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--text-muted);
}
.celebrate-burst {
  font-size: 1.5rem; position: absolute; top: -20px;
  animation: burst 2.5s ease forwards;
}
@keyframes burst {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  30% { transform: scale(2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg) translateY(-30px); opacity: 0; }
}
.streak-sub { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
.streak-stats { display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
.stat-item { text-align: center; }
.stat-val {
  display: block; font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 400; color: var(--gold);
}
.stat-key { font-size: 0.72rem; color: var(--text-muted); letter-spacing: 0.1em; }
.stat-divider { width: 1px; height: 30px; background: var(--border); }

/* daily check */
.daily-check { padding: 1.5rem; }
.daily-check h3 {
  font-family: var(--font-display); font-size: 1.3rem; color: var(--gold);
  margin-bottom: 0.3rem;
}
.daily-check p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
.check-actions { display: flex; flex-direction: column; gap: 0.75rem; }
.btn-confirm {
  background: linear-gradient(135deg, var(--gold) 0%, #c97d4e 100%);
  color: #0a0705; font-weight: 600; font-family: var(--font-body);
  border: none; border-radius: 14px; padding: 1rem;
  font-size: 1rem; cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}
.btn-confirm:hover:not(:disabled) { transform: scale(1.02); }
.btn-confirm:disabled { opacity: 0.6; cursor: default; }
.btn-confirmed { background: linear-gradient(135deg, #3d5e3a 0%, #2d4a2a 100%); color: #a0d0a0; }
.btn-reset-trigger {
  background: transparent; border: 1px solid rgba(180,60,60,0.3);
  color: rgba(220,120,120,0.8); font-family: var(--font-body);
  border-radius: 14px; padding: 0.8rem; font-size: 0.9rem; cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-reset-trigger:hover { background: rgba(180,60,60,0.1); border-color: rgba(180,60,60,0.5); }

/* next milestone */
.next-milestone {
  padding: 1.2rem; display: flex; align-items: center; gap: 1rem;
}
.milestone-emoji { font-size: 2rem; }
.next-milestone > div { flex: 1; }
.milestone-title { font-size: 0.9rem; color: var(--text); margin-bottom: 0.5rem; }
.progress-bar {
  height: 6px; background: rgba(255,255,255,0.08);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--gold), #c97d4e);
  transition: width 0.8s cubic-bezier(.4,0,.2,1);
}

/* modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.modal {
  width: 100%; max-width: 380px; padding: 2rem; text-align: center;
}
.modal h3 {
  font-family: var(--font-display); font-size: 1.6rem; color: var(--gold);
  margin-bottom: 0.75rem;
}
.modal p { color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem; }
.modal-actions { display: flex; gap: 1rem; }
.btn-danger {
  flex: 1; background: rgba(180,60,60,0.2); border: 1px solid rgba(180,60,60,0.4);
  color: #e08080; font-family: var(--font-body); border-radius: 12px;
  padding: 0.8rem; cursor: pointer; font-size: 0.9rem;
  transition: background 0.2s;
}
.btn-danger:hover { background: rgba(180,60,60,0.35); }

/* section header */
.section-header { text-align: center; padding: 0.5rem 0; }
.section-header h2 {
  font-family: var(--font-display); font-size: 1.8rem; font-weight: 400;
  color: var(--gold); margin-bottom: 0.25rem;
}
.section-header p { color: var(--text-muted); font-size: 0.88rem; }

/* notes */
.note-input-wrap { padding: 1.2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.note-input {
  background: rgba(255,255,255,0.05); border: 1px solid var(--border);
  border-radius: 12px; color: var(--text); font-family: var(--font-body);
  font-size: 0.95rem; padding: 0.85rem; outline: none; resize: none;
  transition: border-color 0.2s;
}
.note-input:focus { border-color: var(--gold); }
.note-input::placeholder { color: var(--text-muted); }
.notes-list { display: flex; flex-direction: column; gap: 0.8rem; }
.note-card { padding: 1.2rem; }
.note-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.note-author { font-size: 0.85rem; color: var(--gold); font-weight: 500; }
.note-time { font-size: 0.78rem; color: var(--text-muted); }
.note-text { color: var(--text); font-size: 0.95rem; line-height: 1.6; }

/* mood */
.mood-grid {
  padding: 1.5rem;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
}
.mood-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  background: rgba(255,255,255,0.04); border: 1px solid var(--border);
  border-radius: 14px; padding: 0.85rem 0.5rem; cursor: pointer; color: var(--text);
  font-family: var(--font-body); transition: border-color 0.2s, background 0.2s;
  font-size: 1.4rem;
}
.mood-btn small { font-size: 0.65rem; color: var(--text-muted); text-align: center; line-height: 1.2; }
.mood-btn:hover { border-color: rgba(212,175,55,0.3); background: rgba(212,175,55,0.06); }
.mood-btn--active { border-color: var(--gold); background: rgba(212,175,55,0.12); }
.mood-response {
  padding: 1.2rem; text-align: center;
}
.mood-response p:first-child { color: var(--text); margin-bottom: 0.4rem; }
.mood-tip { color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; }

.anniversary {
  padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem;
}
.anniversary-icon { font-size: 2.5rem; }
.anniversary-label { font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; }
.anniversary-date {
  font-family: var(--font-display); font-size: 1.2rem; color: var(--gold); margin: 0.15rem 0;
}
.anniversary-count { font-size: 0.85rem; color: var(--text-muted); }

/* badges */
.badges-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
}
.badge {
  border-radius: var(--radius); padding: 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  text-align: center; transition: transform 0.2s;
}
.badge:hover { transform: translateY(-3px); }
.badge--unlocked {
  background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(201,125,78,0.1));
  border: 1px solid rgba(212,175,55,0.4);
  box-shadow: 0 4px 24px rgba(212,175,55,0.15);
}
.badge--locked {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  opacity: 0.45; filter: grayscale(0.6);
}
.badge-emoji { font-size: 2.5rem; }
.badge-days { font-family: var(--font-display); font-size: 1.4rem; color: var(--gold); }
.badge-label { font-size: 0.8rem; color: var(--text-muted); }

.xp-section { padding: 1.5rem; }
.xp-section h3 {
  font-family: var(--font-display); font-size: 1.2rem; color: var(--gold);
  margin-bottom: 1rem;
}
.xp-bar-wrap { margin-bottom: 1.5rem; }
.xp-info { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem; }
.xp-next { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem; }

.achievements { display: flex; flex-direction: column; gap: 0.7rem; }
.achievement-item {
  display: flex; align-items: center; gap: 0.9rem;
  padding: 0.8rem; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border);
  font-size: 1.3rem;
}
.achievement-item.done { border-color: rgba(212,175,55,0.25); background: rgba(212,175,55,0.05); }
.achievement-item.locked { opacity: 0.45; }
.ach-title { font-size: 0.88rem; color: var(--text); margin-bottom: 0.15rem; }
.ach-desc { font-size: 0.75rem; color: var(--text-muted); }
.ach-check { margin-left: auto; color: var(--gold); font-size: 1.1rem; }

/* animations */
.fade-in { animation: fadein 0.5s ease; }
@keyframes fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 4px; }

@media (max-width: 400px) {
  .mood-grid { grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
  .mood-btn { padding: 0.65rem 0.3rem; font-size: 1.2rem; }
  .hero-title { font-size: 2.4rem; }
  .badges-grid { grid-template-columns: repeat(2, 1fr); }
}
`;