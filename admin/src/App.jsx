import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  LayoutDashboard, Image, Newspaper, BookOpen, Users, Calendar,
  Key, CheckSquare, Sparkles, ClipboardList, UserCog,
  LogOut, ChevronRight, Mail, Lock, Eye, EyeOff, ArrowRight,
} from 'lucide-react';
import { auth, db } from './firebase';

// Pages
import DashboardPage from './pages/Dashboard';
import BannersPage from './pages/Banners';
import NewsPage from './pages/News';
import BibleThemesPage from './pages/BibleThemes';
import GroupsPage from './pages/Groups';
import SchedulesPage from './pages/Schedules';
import LeaderCodesPage from './pages/LeaderCodes';
import AttendancePage from './pages/Attendance';
import StreamModerationPage from './pages/StreamModeration';
import JoinRequestsPage from './pages/JoinRequests';
import UsersPage from './pages/Users';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         '#F7F7F7',
  surface:    '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  primary:    '#0D0D0D',
  border:     '#E2E2E2',
  divider:    '#EDEDED',
  text:       '#0D0D0D',
  textSec:    '#555555',
  textMuted:  '#AAAAAA',
  white:      '#FFFFFF',
  error:      '#C0392B',
  success:    '#1A7A4A',
};

const s = {
  // ── Shell
  app: { display: 'flex', minHeight: '100vh', backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  // ── Sidebar
  sidebar: {
    width: 240, backgroundColor: C.primary, color: C.white,
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    borderRight: 'none',
  },
  brand: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  brandLogo: { width: 38, height: 38, objectFit: 'contain', flexShrink: 0 },
  brandText: { display: 'flex', flexDirection: 'column' },
  brandName: { fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1.2, letterSpacing: '-0.3px' },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.3px' },

  nav: { flex: 1, padding: '10px 0', overflowY: 'auto' },
  navSection: {
    padding: '16px 20px 6px',
    fontSize: 10, fontWeight: 700,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '1.4px', textTransform: 'uppercase',
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 20px', color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
    transition: 'all 0.12s',
    borderLeft: '3px solid transparent',
    margin: '1px 0',
  },
  navLinkActive: {
    color: C.white,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderLeft: '3px solid #fff',
  },

  sidebarFooter: {
    padding: '14px 20px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 34, height: 34, borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0,
  },
  userEmail: {
    fontSize: 11.5, color: 'rgba(255,255,255,0.5)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1,
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 14px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500,
    transition: 'all 0.12s',
  },

  // ── Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topBar: {
    backgroundColor: C.surface,
    borderBottom: `1px solid ${C.divider}`,
    padding: '12px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
    boxShadow: '0 1px 0 #EDEDED',
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  topBarBreadcrumb: { fontSize: 13, color: C.textMuted },
  topBarTitle: { fontSize: 14, fontWeight: 600, color: C.text },
  topBarBadge: {
    fontSize: 11, backgroundColor: C.surfaceAlt, color: C.textSec,
    borderRadius: 6, padding: '3px 10px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    border: `1px solid ${C.border}`,
  },
  content: {
    flex: 1, padding: 28, overflowY: 'auto', backgroundColor: C.bg,
  },

  // ── Login page
  loginPage: {
    minHeight: '100vh', display: 'flex',
    backgroundImage: 'url(/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    position: 'relative',
  },
  loginPageOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  loginLeft: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 60, position: 'relative', zIndex: 1,
    justifyContent: 'space-between',
  },
  loginLeftCenter: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  poweredBy: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
    paddingBottom: 8,
  },
  poweredByLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600,
  },
  poweredByLogo: {
    height: 28, objectFit: 'contain', opacity: 0.65,
  },
  loginLogoWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 48,
  },
  loginLogo: { width: 80, height: 80, objectFit: 'contain' },
  loginAppName: { fontSize: 28, fontWeight: 800, color: C.white, letterSpacing: '-0.5px' },
  loginAppSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.2px', textAlign: 'center' },
  loginRight: {
    width: 420, backgroundColor: C.white,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '48px 44px',
    boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
    position: 'relative', zIndex: 1,
  },
  loginTitle: { fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: '-0.5px' },
  loginSub: { fontSize: 14, color: C.textSec, marginBottom: 32 },

  // Inputs
  inputGroup: { marginBottom: 18 },
  inputLabel: { display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 7, letterSpacing: '0.2px' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: `1.5px solid ${C.border}`, borderRadius: 12,
    backgroundColor: C.surfaceAlt, overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  inputIcon: { padding: '0 0 0 14px', display: 'flex', alignItems: 'center', color: C.textMuted },
  input: {
    flex: 1, padding: '12px 14px', border: 'none', outline: 'none',
    fontSize: 14, backgroundColor: 'transparent', color: C.text,
  },
  eyeBtn: {
    padding: '0 14px', background: 'none', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', color: C.textMuted,
  },
  loginBtn: {
    width: '100%', padding: '13px 0', backgroundColor: C.primary, color: C.white,
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    letterSpacing: '0.2px', transition: 'opacity 0.15s',
  },
  loginErr: {
    display: 'flex', alignItems: 'center', gap: 8, color: C.error,
    fontSize: 13, marginBottom: 16,
    backgroundColor: '#FFF0F0', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #FFD0D0',
  },
  waLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, fontSize: 12, color: C.textMuted,
    textDecoration: 'none', transition: 'color 0.15s',
  },

  // ── Loading
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: C.primary,
    flexDirection: 'column', gap: 16,
  },
  loadingSpinner: {
    width: 36, height: 36,
    border: '3px solid rgba(255,255,255,0.15)',
    borderTopColor: C.white, borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
};

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [{ path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    section: 'Content',
    items: [
      { path: '/banners',      label: 'Banners',      icon: Image },
      { path: '/news',         label: 'News',         icon: Newspaper },
      { path: '/bible-themes', label: 'Bible Themes', icon: BookOpen },
      { path: '/schedules',    label: 'Schedules',    icon: Calendar },
    ],
  },
  {
    section: 'Community',
    items: [
      { path: '/groups',        label: 'Groups',         icon: Users },
      { path: '/join-requests', label: 'Join Requests',  icon: ClipboardList },
      { path: '/leader-codes',  label: 'Leader Codes',   icon: Key },
      { path: '/users',         label: 'Users',          icon: UserCog },
    ],
  },
  {
    section: 'Activity',
    items: [
      { path: '/attendance', label: 'Attendance',   icon: CheckSquare },
      { path: '/stream',     label: 'Stream Posts', icon: Sparkles },
    ],
  },
];

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getDoc(doc(db, 'users', cred.user.uid));
      if (!profile.exists() || !['admin', 'leader', 'coLeader'].includes(profile.data().role)) {
        await signOut(auth);
        setError('Access denied. Admin or leader account required.');
        return;
      }
      onLogin(cred.user);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.loginPage}>
      <div style={s.loginPageOverlay} />
      {/* Left — branding */}
      <div style={s.loginLeft}>
        {/* spacer top */}
        <div />

        {/* Center content */}
        <div style={s.loginLeftCenter}>
          <div style={s.loginLogoWrap}>
            <img src="/logo-white.png" alt="Go Disciple" style={s.loginLogo} />
            <div>
              <div style={s.loginAppName}>Go Disciple</div>
              <div style={s.loginAppSub}>Admin Dashboard · GKDI</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: 260, lineHeight: 1.8 }}>
            Manage GoDisciple Mobile app content,<br />groups, schedules, and more.
          </div>
        </div>

        {/* Powered by GKDI */}
        <div style={s.poweredBy}>
          <span style={s.poweredByLabel}>Powered by</span>
          <img src="/gkdi-white.png" alt="GKDI" style={s.poweredByLogo} />
        </div>
      </div>

      {/* Right — form */}
      <div style={s.loginRight}>
        <div style={s.loginTitle}>Welcome back</div>
        <div style={s.loginSub}>Sign in to manage your church app</div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={s.loginErr}>
              <span style={{ fontSize: 16 }}>⚠</span>
              {error}
            </div>
          )}

          <div style={s.inputGroup}>
            <label style={s.inputLabel}>EMAIL</label>
            <div style={s.inputWrap}>
              <div style={s.inputIcon}><Mail size={15} /></div>
              <input
                style={s.input}
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={s.inputGroup}>
            <label style={s.inputLabel}>PASSWORD</label>
            <div style={s.inputWrap}>
              <div style={s.inputIcon}><Lock size={15} /></div>
              <input
                style={s.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button style={{ ...s.loginBtn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>

          <a
            href="https://wa.me/6285184040685"
            target="_blank"
            rel="noopener noreferrer"
            style={s.waLink}
          >
            {/* WhatsApp icon SVG */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Need help? Contact us on WhatsApp
          </a>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ userEmail, role, onLogout }) {
  const initials = userEmail ? userEmail[0].toUpperCase() : '?';

  return (
    <div style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <img src="/logo-white.png" alt="Go Disciple" style={s.brandLogo} />
        <div style={s.brandText}>
          <div style={s.brandName}>Go Disciple</div>
          <div style={s.brandSub}>Admin Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map(section => (
          <div key={section.section}>
            <div style={s.navSection}>{section.section}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  style={({ isActive }) => ({
                    ...s.navLink,
                    ...(isActive ? s.navLinkActive : {}),
                  })}
                >
                  <Icon size={15} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.sidebarFooter}>
        <div style={s.userRow}>
          <div style={s.userAvatar}>{initials}</div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={s.userEmail}>{userEmail}</div>
            <div style={s.userRole}>{role}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [authChecked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        const p = await getDoc(doc(db, 'users', u.uid));
        setProfile(p.exists() ? p.data() : null);
      } else {
        setProfile(null);
      }
      setChecked(true);
    });
    return unsub;
  }, []);

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  if (!authChecked) {
    return (
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <span style={s.loadingText}>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !profile || !['admin', 'leader', 'coLeader'].includes(profile.role)) {
    return <LoginPage onLogin={u => setUser(u)} />;
  }

  return (
    <BrowserRouter>
      <div style={s.app}>
        <Sidebar userEmail={user.email} role={profile.role} onLogout={handleLogout} />
        <main style={s.main}>
          {/* Top bar */}
          <div style={s.topBar}>
            <div style={s.topBarLeft}>
              <span style={s.topBarBreadcrumb}>Go Disciple</span>
              <ChevronRight size={13} color={C.textMuted} />
              <span style={s.topBarTitle}>Admin CMS</span>
            </div>
            <span style={s.topBarBadge}>{profile.role}</span>
          </div>

          {/* Page content */}
          <div style={s.content}>
            <Routes>
              <Route path="/"              element={<DashboardPage />} />
              <Route path="/banners"       element={<BannersPage />} />
              <Route path="/news"          element={<NewsPage />} />
              <Route path="/bible-themes"  element={<BibleThemesPage />} />
              <Route path="/groups"        element={<GroupsPage />} />
              <Route path="/schedules"     element={<SchedulesPage />} />
              <Route path="/leader-codes"  element={<LeaderCodesPage />} />
              <Route path="/attendance"    element={<AttendancePage />} />
              <Route path="/stream"        element={<StreamModerationPage />} />
              <Route path="/join-requests" element={<JoinRequestsPage />} />
              <Route path="/users"         element={<UsersPage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
