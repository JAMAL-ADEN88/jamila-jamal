"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HEARTS = ["❤️", "🤍", "✨", "💛", "🌙"];
function Particle({ id }) {
  const s = {
    left: `${(id * 17 + 7) % 100}%`,
    animationDuration: `${9 + (id * 3) % 11}s`,
    animationDelay: `${(id * 2.3) % 8}s`,
    fontSize: `${11 + (id * 4) % 12}px`,
    opacity: 0.15 + (id % 4) * 0.05,
  };
  return <span className="particle" style={s}>{HEARTS[id % HEARTS.length]}</span>;
}

function StreakRing({ value, max = 365 }) {
  const pct = Math.min(value / max, 1);
  const r = 88;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg viewBox="0 0 200 200" width="210" height="210">
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#c97d4e" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
      <circle cx="100" cy="100" r={r} fill="none" stroke="url(#rg)" strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        filter="url(#glow)"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function StreakApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");

  const [couple, setCouple] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [inputCode, setInputCode] = useState("");
  const [coupleLoading, setCoupleLoading] = useState(false);
  const [coupleError, setCoupleError] = useState("");

  const [activeTab, setActiveTab] = useState("home");
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [mood, setMood] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [todayConfirmed, setTodayConfirmed] = useState(false);

  const QUOTES = [
    "Every peaceful day is proof you chose love over pride.",
    "Peace between two people isn't silence — it's trust.",
    "The bravest thing lovers can do is choose calm over chaos.",
    "Your streak isn't a number — it's proof love is worth protecting.",
    "Patience is the quietest form of love.",
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) loadProfile(); }, [user]);

  useEffect(() => {
    if (profile?.couple_id) {
      loadCouple(profile.couple_id);
      loadNotes(profile.couple_id);
    }
  }, [profile]);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (couple) {
      const today = new Date().toISOString().split("T")[0];
      const confirmed = couple.last_confirmed === today &&
        (couple.confirmed_by || []).includes(user?.id);
      setTodayConfirmed(confirmed);
    }
  }, [couple, user]);

  async function loadProfile() {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
      } else {
        const { data: np } = await supabase
          .from("profiles")
          .insert({ id: user.id, name: user.user_metadata?.name || "Love", invite_code: generateCode(), couple_id: null })
          .select().single();
        setProfile(np);
      }
    } catch (e) { console.error(e); }
  }

  async function loadCouple(coupleId) {
    const { data } = await supabase.from("couples").select("*").eq("id", coupleId).single();
    if (data) {
      setCouple(data);
      const partnerId = data.user1_id === user.id ? data.user2_id : data.user1_id;
      if (partnerId) {
        const { data: partner } = await supabase.from("profiles").select("*").eq("id", partnerId).single();
        setPartnerProfile(partner);
      }
    }
  }

  async function loadNotes(coupleId) {
    const { data } = await supabase.from("notes").select("*").eq("couple_id", coupleId)
      .order("created_at", { ascending: false }).limit(20);
    if (data) setNotes(data);
  }

  async function handleSignup() {
    if (!email || !password || !name) { setAuthError("Please fill in all fields"); return; }
    if (password.length < 6) { setAuthError("Password must be at least 6 characters"); return; }
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { name: name.trim() }
        },
      });
      if (error) {
        setAuthError(error.message);
      } else if (data?.user?.identities?.length === 0) {
        setAuthError("This email is already registered. Please sign in.");
      } else {
        setAuthSuccess("✅ Account created! You can now sign in.");
        setAuthMode("login");
        setEmail(email);
        setPassword("");
        setName("");
      }
    } catch (e) {
      setAuthError("Something went wrong. Please try again.");
    }
    setAuthLoading(false);
  }

  async function handleLogin() {
    if (!email || !password) { setAuthError("Please enter email and password"); return; }
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setAuthError("Please check your email and click the confirmation link first.");
        } else {
          setAuthError("Wrong email or password. Please try again.");
        }
      }
    } catch (e) {
      setAuthError("Something went wrong. Please try again.");
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null); setCouple(null); setPartnerProfile(null);
  }

  async function createCouple() {
    setCoupleLoading(true); setCoupleError("");
    try {
      const { data: nc, error } = await supabase.from("couples")
        .insert({ user1_id: user.id, streak: 0, longest_streak: 0, total_peaceful: 0, confirmed_by: [] })
        .select().single();
      if (error) throw error;
      await supabase.from("profiles").update({ couple_id: nc.id }).eq("id", user.id);
      setProfile(p => ({ ...p, couple_id: nc.id }));
      setCouple(nc);
    } catch (e) { setCoupleError("Error creating couple. Please try again."); }
    setCoupleLoading(false);
  }

  async function joinCouple() {
    if (!inputCode.trim()) { setCoupleError("Enter your partner's invite code"); return; }
    setCoupleLoading(true); setCoupleError("");
    try {
      const { data: partner } = await supabase.from("profiles").select("*")
        .eq("invite_code", inputCode.trim().toUpperCase()).single();
      if (!partner) { setCoupleError("Code not found. Check with your partner."); setCoupleLoading(false); return; }
      if (partner.id === user.id) { setCoupleError("That's your own code!"); setCoupleLoading(false); return; }
      if (!partner.couple_id) { setCoupleError("Your partner hasn't created a couple yet."); setCoupleLoading(false); return; }
      await supabase.from("couples").update({ user2_id: user.id }).eq("id", partner.couple_id);
      await supabase.from("profiles").update({ couple_id: partner.couple_id }).eq("id", user.id);
      setProfile(p => ({ ...p, couple_id: partner.couple_id }));
      loadCouple(partner.couple_id);
    } catch (e) { setCoupleError("Something went wrong. Please try again."); }
    setCoupleLoading(false);
  }

  async function confirmPeace() {
    if (todayConfirmed || !couple) return;
    const today = new Date().toISOString().split("T")[0];
    const confirmedBy = couple.confirmed_by || [];
    if (confirmedBy.includes(user.id)) { setTodayConfirmed(true); return; }
    const newConfirmedBy = [...confirmedBy, user.id];
    const bothConfirmed = newConfirmedBy.length >= 2;
    const isNewDay = couple.last_confirmed !== today;
    let updates = { confirmed_by: newConfirmedBy, last_confirmed: today };
    if (bothConfirmed && isNewDay) {
      const ns = couple.streak + 1;
      updates.streak = ns;
      updates.total_peaceful = couple.total_peaceful + 1;
      updates.confirmed_by = [];
      if (ns > couple.longest_streak) updates.longest_streak = ns;
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2500);
    } else if (isNewDay) {
      updates.confirmed_by = [user.id];
    }
    await supabase.from("couples").update(updates).eq("id", couple.id);
    loadCouple(couple.id);
    setTodayConfirmed(true);
  }

  async function resetStreak() {
    await supabase.from("couples").update({ streak: 0, confirmed_by: [], last_confirmed: null }).eq("id", couple.id);
    loadCouple(couple.id);
    setShowReset(false);
    setTodayConfirmed(false);
  }

  async function sendNote() {
    if (!noteText.trim() || !couple) return;
    await supabase.from("notes").insert({ couple_id: couple.id, author: profile?.name || "You", text: noteText.trim() });
    setNoteText("");
    loadNotes(couple.id);
  }

  if (loading) return (
    <><style>{CSS}</style>
      <div className="loader"><div className="heart-pulse">❤️</div><p>Loading your love story…</p></div>
    </>
  );

  if (!user) return (
    <><style>{CSS}</style>
      <div className="landing">
        <div className="particles">{Array.from({ length: 14 }, (_, i) => <Particle key={i} id={i} />)}</div>
        <div className="auth-wrap">
          <div className="auth-card glass">
            <div className="auth-logo">
              <span className="brand-big">Jamila / Jamal</span>
              <p className="auth-tagline">A sanctuary for two 🌙</p>
            </div>
            <div className="auth-tabs">
              <button className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}>Sign In</button>
              <button className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
                onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthSuccess(""); }}>Create Account</button>
            </div>
            {authMode === "signup" && (
              <input className="auth-input" placeholder="Your name (e.g. Jamila or Jamal)"
                value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="auth-input" placeholder="Email address" type="email"
              value={email} onChange={e => setEmail(e.target.value)} />
            <input className="auth-input" placeholder="Password (min 6 characters)" type="password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleSignup())} />
            {authError && <p className="auth-error">{authError}</p>}
            {authSuccess && <p className="auth-success">{authSuccess}</p>}
            <button className="btn-primary full" onClick={authMode === "login" ? handleLogin : handleSignup} disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "login" ? "Sign In 💛" : "Create Account ✨"}
            </button>
            <p className="auth-switch">
              {authMode === "login" ? "No account? " : "Already have one? "}
              <span onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); setAuthSuccess(""); }}>
                {authMode === "login" ? "Sign up" : "Sign in"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );

  if (!profile?.couple_id) return (
    <><style>{CSS}</style>
      <div className="landing">
        <div className="particles">{Array.from({ length: 10 }, (_, i) => <Particle key={i} id={i} />)}</div>
        <div className="auth-wrap">
          <div className="auth-card glass">
            <p className="welcome-name">Welcome, {profile?.name || "Love"} 💛</p>
            <h2 className="setup-title">Connect With Your Partner</h2>
            <p className="setup-sub">One of you creates the couple, the other joins with an invite code.</p>
            <div className="setup-divider">
              <div className="setup-block">
                <h3>I'll create our couple</h3>
                <p>You get an invite code to share with your partner</p>
                <button className="btn-primary full" onClick={createCouple} disabled={coupleLoading}>
                  {coupleLoading ? "Creating…" : "Create Our Couple 💑"}
                </button>
                {profile?.invite_code && (
                  <div className="invite-code-box">
                    <p>Your invite code:</p>
                    <span className="invite-code">{profile.invite_code}</span>
                    <p className="invite-hint">Share this with your partner so they can join</p>
                  </div>
                )}
              </div>
              <div className="or-divider"><span>OR</span></div>
              <div className="setup-block">
                <h3>My partner already created one</h3>
                <p>Enter the code they shared with you</p>
                <input className="auth-input" placeholder="Enter invite code (e.g. AB12CD)"
                  value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} />
                <button className="btn-secondary full" onClick={joinCouple} disabled={coupleLoading}>
                  {coupleLoading ? "Joining…" : "Join Our Couple 💛"}
                </button>
              </div>
            </div>
            {coupleError && <p className="auth-error">{coupleError}</p>}
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </div>
    </>
  );

  const streak = couple?.streak || 0;
  const longest = couple?.longest_streak || 0;
  const total = couple?.total_peaceful || 0;
  const partnerConfirmed = (couple?.confirmed_by || []).some(id => id !== user.id);
  const milestones = [
    { days: 7, label: "First Week", emoji: "🌱" },
    { days: 30, label: "A Month", emoji: "🌸" },
    { days: 100, label: "100 Days", emoji: "💎" },
    { days: 365, label: "A Year", emoji: "👑" },
  ];
  const nextMilestone = milestones.find(m => m.days > streak);

  return (
    <><style>{CSS}</style>
      <div className="app">
        <div className="particles">{Array.from({ length: 10 }, (_, i) => <Particle key={i} id={i} />)}</div>
        <header className="app-header">
          <span className="brand" onClick={handleLogout} title="Tap to sign out">J / J</span>
          <div className="header-mid"><span className="couple-names">{profile?.name || "You"} & {partnerProfile?.name || "Partner"}</span></div>
          <span className="header-streak">🔥 {streak}</span>
        </header>
        <nav className="bottom-nav">
          {[{ id: "home", icon: "🏠", label: "Home" }, { id: "notes", icon: "💌", label: "Notes" }, { id: "mood", icon: "🌙", label: "Mood" }, { id: "badges", icon: "🏆", label: "Badges" }].map(t => (
            <button key={t.id} className={`nav-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span><small>{t.label}</small>
            </button>
          ))}
        </nav>

        {activeTab === "home" && (
          <main className="tab">
            <div className="quote-bar glass"><p className="quote fade-in" key={quoteIdx}>"{QUOTES[quoteIdx]}"</p></div>
            <div className={`streak-card glass ${celebrating ? "glow" : ""}`}>
              <p className="eyebrow">✨ Your Peace Streak</p>
              <div className="ring-wrap">
                <StreakRing value={streak} />
                <div className="ring-center">
                  <span className="streak-num">{streak}</span>
                  <span className="streak-unit">days</span>
                  {celebrating && <div className="burst">🎉</div>}
                </div>
              </div>
              <p className="streak-sub">of peaceful, beautiful love</p>
              <div className="stats-row">
                <div className="stat"><span className="sv">{longest}</span><span className="sk">Longest</span></div>
                <div className="sdiv" />
                <div className="stat"><span className="sv">{total}</span><span className="sk">Total Days</span></div>
                <div className="sdiv" />
                <div className="stat"><span className="sv">{partnerConfirmed ? "✅" : "⏳"}</span><span className="sk">Partner</span></div>
              </div>
            </div>
            {partnerProfile && (
              <div className="partner-status glass">
                <span className="ps-icon">{partnerConfirmed ? "✅" : "⏳"}</span>
                <div>
                  <p className="ps-name">{partnerProfile.name}</p>
                  <p className="ps-sub">{partnerConfirmed ? "Has confirmed peace today 💛" : "Hasn't confirmed yet today"}</p>
                </div>
              </div>
            )}
            <div className="daily glass">
              <h3>Daily Peace Check</h3>
              <p>{todayConfirmed ? "You've confirmed peace today ✅" : "Did you maintain peace today?"}</p>
              <div className="check-btns">
                <button className={`btn-confirm ${todayConfirmed ? "confirmed" : ""}`} onClick={confirmPeace} disabled={todayConfirmed}>
                  {todayConfirmed ? "✅ Confirmed!" : "✨ Yes, we had peace"}
                </button>
                <button className="btn-fight" onClick={() => setShowReset(true)}>😔 We had a fight</button>
              </div>
              {todayConfirmed && !partnerConfirmed && <p className="waiting-msg">Waiting for {partnerProfile?.name || "your partner"} to confirm… 💛</p>}
              {todayConfirmed && partnerConfirmed && <p className="waiting-msg">Both confirmed! Streak updated 🎉</p>}
            </div>
            {nextMilestone && (
              <div className="milestone glass">
                <span className="me">{nextMilestone.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p className="mt">{nextMilestone.label} in {nextMilestone.days - streak} day{nextMilestone.days - streak !== 1 ? "s" : ""}</p>
                  <div className="pbar"><div className="pfill" style={{ width: `${(streak / nextMilestone.days) * 100}%` }} /></div>
                </div>
              </div>
            )}
            {!partnerProfile && (
              <div className="invite-remind glass">
                <p>🔗 Share your invite code with your partner:</p>
                <span className="invite-code">{profile?.invite_code}</span>
                <p className="invite-hint">They enter this when signing up</p>
              </div>
            )}
            {showReset && (
              <div className="overlay" onClick={() => setShowReset(false)}>
                <div className="modal glass" onClick={e => e.stopPropagation()}>
                  <h3>Reset Streak?</h3>
                  <p>This resets your {streak}-day streak to 0. Honesty builds stronger love. 💛</p>
                  <div className="modal-btns">
                    <button className="btn-danger" onClick={resetStreak}>Yes, reset</button>
                    <button className="btn-secondary" onClick={() => setShowReset(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {activeTab === "notes" && (
          <main className="tab">
            <div className="sec-header"><h2>Love Notes 💌</h2><p>Messages just for you two</p></div>
            <div className="note-input-wrap glass">
              <textarea className="note-input" placeholder="Write something beautiful… 🌙"
                value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} />
              <button className="btn-primary" onClick={sendNote}>Send 💛</button>
            </div>
            <div className="notes-list">
              {notes.length === 0 && <p className="empty">No notes yet. Write the first one 💛</p>}
              {notes.map(n => (
                <div key={n.id} className="note-card glass fade-in">
                  <div className="note-head">
                    <span className="note-author">{n.author}</span>
                    <span className="note-time">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="note-text">{n.text}</p>
                </div>
              ))}
            </div>
          </main>
        )}

        {activeTab === "mood" && (
          <main className="tab">
            <div className="sec-header"><h2>How are you feeling? 🌙</h2><p>Let your partner know your heart</p></div>
            <div className="mood-grid glass">
              {[{ e: "😌", l: "Peaceful" }, { e: "💛", l: "Loving" }, { e: "😔", l: "Sad" }, { e: "😤", l: "Frustrated" }, { e: "🥰", l: "Adoring" }, { e: "😴", l: "Tired" }, { e: "🌟", l: "Grateful" }, { e: "🤗", l: "Need a Hug" }].map(m => (
                <button key={m.l} className={`mood-btn ${mood === m.l ? "mood-active" : ""}`} onClick={() => setMood(m.l)}>
                  <span>{m.e}</span><small>{m.l}</small>
                </button>
              ))}
            </div>
            {mood && (
              <div className="mood-resp glass fade-in">
                <p>You're feeling <strong>{mood}</strong> today 🌙</p>
                <p className="mood-tip">
                  {mood === "Frustrated" ? "Take a breath. Communicate calmly. Your partner loves you. 💛"
                    : mood === "Sad" ? "Reach out — let your partner be there for you. 🤗"
                    : "Share this feeling with your partner. ✨"}
                </p>
              </div>
            )}
          </main>
        )}

        {activeTab === "badges" && (
          <main className="tab">
            <div className="sec-header"><h2>Milestones 🏆</h2><p>Every badge is proof of your love</p></div>
            <div className="badges-grid">
              {milestones.map(m => (
                <div key={m.days} className={`badge ${streak >= m.days || longest >= m.days ? "badge-on" : "badge-off"}`}>
                  <span className="be">{m.emoji}</span>
                  <span className="bd">{m.days}d</span>
                  <span className="bl">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="xp-card glass">
              <h3>Your Journey</h3>
              <div className="journey-stats">
                <div className="js"><span className="jv">{streak}</span><span className="jk">Current Streak</span></div>
                <div className="js"><span className="jv">{longest}</span><span className="jk">Best Streak</span></div>
                <div className="js"><span className="jv">{total}</span><span className="jk">Total Peaceful</span></div>
              </div>
              <div className="ach-list">
                {[
                  { i: "🌱", t: "First Week", d: "7 days of peace", done: longest >= 7 },
                  { i: "🌸", t: "A Month", d: "30 days of peace", done: longest >= 30 },
                  { i: "💎", t: "100 Days", d: "100 days of peace", done: longest >= 100 },
                  { i: "💌", t: "Note Writers", d: "Sent a love note", done: notes.length > 0 },
                ].map(a => (
                  <div key={a.t} className={`ach ${a.done ? "ach-done" : "ach-lock"}`}>
                    <span>{a.i}</span>
                    <div><p className="at">{a.t}</p><p className="ad">{a.d}</p></div>
                    {a.done && <span className="ac">✓</span>}
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--gold:#d4af37;--brown:#c97d4e;--bg:#0a0705;--s:rgba(255,255,255,0.04);--b:rgba(212,175,55,0.15);--t:#f2e8d5;--tm:rgba(242,232,213,0.5);--r:20px;--fd:'Cormorant Garamond',Georgia,serif;--fb:'DM Sans',system-ui,sans-serif}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--t);font-family:var(--fb);min-height:100vh;overflow-x:hidden}
.particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.particle{position:absolute;bottom:-20px;animation:fup linear infinite;user-select:none}
@keyframes fup{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}90%{opacity:.8}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
.glass{background:var(--s);border:1px solid var(--b);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:var(--r)}
.loader{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:var(--bg)}
.heart-pulse{font-size:3rem;animation:pulse 1.2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
.loader p{color:var(--tm);font-family:var(--fd);font-size:1.2rem}
.landing{min-height:100vh;background:radial-gradient(ellipse at 30% 0%,rgba(212,175,55,.08) 0%,transparent 60%),var(--bg);position:relative}
.auth-wrap{display:flex;justify-content:center;align-items:center;min-height:100vh;padding:1.5rem;position:relative;z-index:5}
.auth-card{width:100%;max-width:420px;padding:2.5rem;display:flex;flex-direction:column;gap:1rem}
.auth-logo{text-align:center;margin-bottom:.5rem}
.brand-big{font-family:var(--fd);font-size:2.2rem;font-weight:300;color:var(--gold)}
.auth-tagline{color:var(--tm);font-size:.88rem;margin-top:.3rem}
.auth-tabs{display:flex;background:rgba(255,255,255,.04);border-radius:12px;padding:4px;gap:4px}
.auth-tab{flex:1;background:transparent;border:none;color:var(--tm);font-family:var(--fb);padding:.6rem;border-radius:9px;cursor:pointer;transition:all .2s;font-size:.9rem}
.auth-tab.active{background:rgba(212,175,55,.15);color:var(--gold);border:1px solid var(--b)}
.auth-input{background:rgba(255,255,255,.06);border:1px solid var(--b);border-radius:12px;color:var(--t);font-family:var(--fb);font-size:.95rem;padding:.85rem 1rem;outline:none;transition:border-color .2s;width:100%}
.auth-input:focus{border-color:var(--gold)}
.auth-input::placeholder{color:var(--tm)}
.auth-error{color:#e08080;font-size:.85rem;text-align:center;line-height:1.5}
.auth-success{color:#80d080;font-size:.85rem;text-align:center;line-height:1.5;padding:.75rem;background:rgba(80,160,80,.1);border:1px solid rgba(80,160,80,.2);border-radius:10px}
.auth-switch{text-align:center;color:var(--tm);font-size:.85rem}
.auth-switch span{color:var(--gold);cursor:pointer;text-decoration:underline}
.btn-primary{background:linear-gradient(135deg,var(--gold) 0%,var(--brown) 100%);color:#0a0705;font-weight:600;font-family:var(--fb);border:none;border-radius:50px;padding:.9rem 2rem;font-size:.95rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 24px rgba(212,175,55,.3)}
.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(212,175,55,.45)}
.btn-primary:disabled{opacity:.6;cursor:default}
.btn-primary.full{width:100%}
.btn-secondary{background:transparent;border:1px solid var(--b);color:var(--t);font-family:var(--fb);border-radius:50px;padding:.9rem 2rem;font-size:.95rem;cursor:pointer;transition:background .2s,border-color .2s;width:100%;text-align:center}
.btn-secondary:hover{background:var(--s);border-color:var(--gold)}
.logout-btn{background:none;border:none;color:var(--tm);font-family:var(--fb);font-size:.8rem;cursor:pointer;text-align:center;text-decoration:underline;padding:.5rem}
.welcome-name{text-align:center;color:var(--gold);font-family:var(--fd);font-size:1.3rem}
.setup-title{font-family:var(--fd);font-size:1.8rem;font-weight:400;color:var(--t);text-align:center}
.setup-sub{color:var(--tm);font-size:.88rem;text-align:center;line-height:1.6}
.setup-divider{display:flex;flex-direction:column;gap:1.5rem}
.setup-block{display:flex;flex-direction:column;gap:.75rem}
.setup-block h3{font-family:var(--fd);font-size:1.1rem;color:var(--gold)}
.setup-block p{color:var(--tm);font-size:.85rem}
.or-divider{display:flex;align-items:center;gap:1rem;color:var(--tm);font-size:.8rem}
.or-divider::before,.or-divider::after{content:'';flex:1;height:1px;background:var(--b)}
.invite-code-box{background:rgba(212,175,55,.08);border:1px solid var(--b);border-radius:12px;padding:1rem;text-align:center}
.invite-code-box p{color:var(--tm);font-size:.8rem;margin-bottom:.4rem}
.invite-code{font-family:var(--fd);font-size:2rem;color:var(--gold);letter-spacing:.2em;font-weight:500}
.invite-hint{color:var(--tm);font-size:.75rem;margin-top:.4rem}
.app{min-height:100vh;padding-bottom:80px;background:radial-gradient(ellipse at 50% -10%,rgba(212,175,55,.07) 0%,transparent 55%),var(--bg);position:relative}
.app-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;background:rgba(10,7,5,.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--b);position:sticky;top:0;z-index:100}
.brand{font-family:var(--fd);font-size:1.2rem;color:var(--gold);cursor:pointer}
.header-mid{flex:1;text-align:center}
.couple-names{font-size:.82rem;color:var(--tm)}
.header-streak{font-size:.9rem;color:var(--gold)}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;display:flex;background:rgba(10,7,5,.95);backdrop-filter:blur(20px);border-top:1px solid var(--b);z-index:100;padding:.5rem 0}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;color:var(--tm);font-family:var(--fb);cursor:pointer;padding:.4rem 0;transition:color .2s;font-size:1.3rem}
.nav-btn small{font-size:.65rem}
.nav-btn.active{color:var(--gold)}
.tab{padding:1.5rem;display:flex;flex-direction:column;gap:1.2rem;max-width:600px;margin:0 auto;position:relative;z-index:5}
.quote-bar{padding:1rem 1.4rem}
.quote{font-family:var(--fd);font-style:italic;font-size:.95rem;color:var(--tm);line-height:1.6;text-align:center}
.streak-card{padding:2rem 1.5rem;text-align:center;transition:box-shadow .5s}
.streak-card.glow{animation:pglow 2.5s ease}
@keyframes pglow{0%{box-shadow:0 0 0 0 rgba(212,175,55,0)}50%{box-shadow:0 0 80px rgba(212,175,55,.5),0 0 0 3px rgba(212,175,55,.4)}100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}}
.eyebrow{font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);opacity:.7;margin-bottom:1.5rem}
.ring-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;margin-bottom:1rem}
.ring-center{position:absolute;display:flex;flex-direction:column;align-items:center}
.streak-num{font-family:var(--fd);font-size:4rem;font-weight:300;color:var(--gold);line-height:1}
.streak-unit{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--tm)}
.burst{font-size:1.5rem;position:absolute;top:-20px;animation:burst 2.5s ease forwards}
@keyframes burst{0%{transform:scale(0) rotate(-20deg);opacity:0}30%{transform:scale(2) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0deg) translateY(-30px);opacity:0}}
.streak-sub{color:var(--tm);font-size:.9rem;margin-bottom:1.5rem}
.stats-row{display:flex;align-items:center;justify-content:center;gap:1.5rem}
.stat{text-align:center}
.sv{display:block;font-family:var(--fd);font-size:1.5rem;color:var(--gold)}
.sk{font-size:.72rem;color:var(--tm);letter-spacing:.1em}
.sdiv{width:1px;height:30px;background:var(--b)}
.partner-status{padding:1rem 1.2rem;display:flex;align-items:center;gap:1rem}
.ps-icon{font-size:1.8rem}
.ps-name{font-size:.95rem;color:var(--t);margin-bottom:.2rem}
.ps-sub{font-size:.82rem;color:var(--tm)}
.daily{padding:1.5rem}
.daily h3{font-family:var(--fd);font-size:1.3rem;color:var(--gold);margin-bottom:.3rem}
.daily p{color:var(--tm);font-size:.9rem;margin-bottom:1rem}
.check-btns{display:flex;flex-direction:column;gap:.75rem}
.btn-confirm{background:linear-gradient(135deg,var(--gold) 0%,var(--brown) 100%);color:#0a0705;font-weight:600;font-family:var(--fb);border:none;border-radius:14px;padding:1rem;font-size:1rem;cursor:pointer;transition:transform .2s,opacity .2s}
.btn-confirm:hover:not(:disabled){transform:scale(1.02)}
.btn-confirm:disabled{opacity:.6;cursor:default}
.btn-confirm.confirmed{background:linear-gradient(135deg,#3d5e3a 0%,#2d4a2a 100%);color:#a0d0a0}
.btn-fight{background:transparent;border:1px solid rgba(180,60,60,.3);color:rgba(220,120,120,.8);font-family:var(--fb);border-radius:14px;padding:.8rem;font-size:.9rem;cursor:pointer;transition:background .2s}
.btn-fight:hover{background:rgba(180,60,60,.1)}
.waiting-msg{color:var(--tm);font-size:.82rem;text-align:center;margin-top:.75rem}
.milestone{padding:1.2rem;display:flex;align-items:center;gap:1rem}
.me{font-size:2rem}
.mt{font-size:.9rem;color:var(--t);margin-bottom:.5rem}
.pbar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
.pfill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--gold),var(--brown));transition:width .8s cubic-bezier(.4,0,.2,1)}
.invite-remind{padding:1.2rem;text-align:center;display:flex;flex-direction:column;gap:.5rem;align-items:center}
.invite-remind p{color:var(--tm);font-size:.85rem}
.overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1.5rem}
.modal{width:100%;max-width:380px;padding:2rem;text-align:center}
.modal h3{font-family:var(--fd);font-size:1.6rem;color:var(--gold);margin-bottom:.75rem}
.modal p{color:var(--tm);line-height:1.6;margin-bottom:1.5rem}
.modal-btns{display:flex;gap:1rem}
.btn-danger{flex:1;background:rgba(180,60,60,.2);border:1px solid rgba(180,60,60,.4);color:#e08080;font-family:var(--fb);border-radius:12px;padding:.8rem;cursor:pointer;transition:background .2s}
.btn-danger:hover{background:rgba(180,60,60,.35)}
.sec-header{text-align:center;padding:.5rem 0}
.sec-header h2{font-family:var(--fd);font-size:1.8rem;font-weight:400;color:var(--gold);margin-bottom:.25rem}
.sec-header p{color:var(--tm);font-size:.88rem}
.note-input-wrap{padding:1.2rem;display:flex;flex-direction:column;gap:.75rem}
.note-input{background:rgba(255,255,255,.05);border:1px solid var(--b);border-radius:12px;color:var(--t);font-family:var(--fb);font-size:.95rem;padding:.85rem;outline:none;resize:none;transition:border-color .2s;width:100%}
.note-input:focus{border-color:var(--gold)}
.note-input::placeholder{color:var(--tm)}
.notes-list{display:flex;flex-direction:column;gap:.8rem}
.empty{text-align:center;color:var(--tm);padding:2rem}
.note-card{padding:1.2rem}
.note-head{display:flex;justify-content:space-between;margin-bottom:.5rem}
.note-author{font-size:.85rem;color:var(--gold);font-weight:500}
.note-time{font-size:.78rem;color:var(--tm)}
.note-text{color:var(--t);font-size:.95rem;line-height:1.6}
.mood-grid{padding:1.5rem;display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem}
.mood-btn{display:flex;flex-direction:column;align-items:center;gap:.3rem;background:rgba(255,255,255,.04);border:1px solid var(--b);border-radius:14px;padding:.85rem .5rem;cursor:pointer;color:var(--t);font-family:var(--fb);transition:border-color .2s,background .2s;font-size:1.4rem}
.mood-btn small{font-size:.65rem;color:var(--tm);text-align:center;line-height:1.2}
.mood-btn:hover,.mood-active{border-color:var(--gold);background:rgba(212,175,55,.12)}
.mood-resp{padding:1.2rem;text-align:center}
.mood-resp p:first-child{color:var(--t);margin-bottom:.4rem}
.mood-tip{color:var(--tm);font-size:.88rem;line-height:1.6}
.badges-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.badge{border-radius:var(--r);padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;transition:transform .2s}
.badge:hover{transform:translateY(-3px)}
.badge-on{background:linear-gradient(135deg,rgba(212,175,55,.15),rgba(201,125,78,.1));border:1px solid rgba(212,175,55,.4);box-shadow:0 4px 24px rgba(212,175,55,.15)}
.badge-off{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);opacity:.4;filter:grayscale(.6)}
.be{font-size:2.5rem}.bd{font-family:var(--fd);font-size:1.4rem;color:var(--gold)}.bl{font-size:.8rem;color:var(--tm)}
.xp-card{padding:1.5rem}
.xp-card h3{font-family:var(--fd);font-size:1.2rem;color:var(--gold);margin-bottom:1rem}
.journey-stats{display:flex;justify-content:space-around;margin-bottom:1.5rem}
.js{text-align:center}
.jv{display:block;font-family:var(--fd);font-size:1.8rem;color:var(--gold)}
.jk{font-size:.72rem;color:var(--tm)}
.ach-list{display:flex;flex-direction:column;gap:.7rem}
.ach{display:flex;align-items:center;gap:.9rem;padding:.8rem;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--b);font-size:1.3rem}
.ach-done{border-color:rgba(212,175,55,.25);background:rgba(212,175,55,.05)}
.ach-lock{opacity:.45}
.at{font-size:.88rem;color:var(--t);margin-bottom:.15rem}.ad{font-size:.75rem;color:var(--tm)}.ac{margin-left:auto;color:var(--gold);font-size:1.1rem}
.fade-in{animation:fadein .5s ease}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2);border-radius:4px}
@media(max-width:400px){.mood-grid{gap:.5rem}.mood-btn{padding:.65rem .3rem;font-size:1.2rem}.badges-grid{grid-template-columns:repeat(2,1fr)}}
`;

