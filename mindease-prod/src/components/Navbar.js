import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/',                  label: 'Home',       icon: '🏠' },
  { path: '/assessment/stress', label: 'Assessment', icon: '📋' },
  { path: '/chat',              label: 'AI Chat',    icon: '💬' },
  { path: '/dashboard',        label: 'Dashboard',  icon: '📊' },
  { path: '/help',             label: 'Find Help',  icon: '❤️' },
];

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out — see you soon! 👋');
    navigate('/');
  };

  const active = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          background: scrolled
            ? 'rgba(8,8,24,0.92)'
            : 'rgba(4,4,15,0.5)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: scrolled ? '1px solid rgba(0,212,255,0.08)' : '1px solid transparent',
          transition: 'all 0.4s ease',
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 16px rgba(0,212,255,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <img
                src={process.env.PUBLIC_URL + '/mindease-logo.png'}
                alt="MindEase"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg,#00d4ff,#6366f1)'; e.target.parentElement.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;height:100%;font-size:18px">🧠</span>'; }}
              />
            </motion.div>
            <span className="font-display font-bold text-white" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>MindEase</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="nav-pill"
                  style={{
                    background: active(item.path) ? 'rgba(0,212,255,0.1)' : 'transparent',
                    color: active(item.path) ? 'var(--cyan)' : 'var(--text-secondary)',
                    borderColor: active(item.path) ? 'rgba(0,212,255,0.2)' : 'transparent',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  {item.label}
                  {active(item.path) && (
                    <motion.span layoutId="nav-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
                  )}
                </motion.div>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.04 }} className="nav-pill"
                  style={{ background: active('/admin') ? 'rgba(245,158,11,0.1)' : 'transparent', color: active('/admin') ? '#f59e0b' : 'var(--text-secondary)', border: '1px solid transparent', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 999 }}>
                  ⚙ Admin
                </motion.div>
              </Link>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>

            {/* User menu */}
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setUserOpen(!userOpen)}
                  whileHover={{ scale: 1.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="font-display hidden sm:block" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: userOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </motion.button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      style={{ position: 'absolute', top: '110%', right: 0, width: 180, background: 'rgba(13,13,34,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 8, backdropFilter: 'blur(20px)', boxShadow: '0 16px 50px rgba(0,0,0,0.5)' }}
                    >
                      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <div className="menu-item" style={menuItemStyle}>📊 Dashboard</div>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" style={{ textDecoration: 'none' }}>
                          <div className="menu-item" style={menuItemStyle}>⚙ Admin Panel</div>
                        </Link>
                      )}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                      <button onClick={handleLogout} style={{ ...menuItemStyle, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}>
                        🚪 Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"><motion.button whileHover={{ scale: 1.04 }} className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>Sign In</motion.button></Link>
                <Link to="/register"><motion.button whileHover={{ scale: 1.04 }} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}><span>Get Started</span></motion.button></Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <motion.button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              whileTap={{ scale: 0.9 }}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 18 }}>{menuOpen ? '✕' : '☰'}</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(8,8,24,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 16px 16px' }}>
                {NAV_ITEMS.map((item) => (
                  <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: active(item.path) ? 'rgba(0,212,255,0.08)' : 'transparent', color: active(item.path) ? 'var(--cyan)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>
                      <span>{item.icon}</span> {item.label}
                    </div>
                  </Link>
                ))}
                {!currentUser && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Link to="/login" style={{ flex: 1, textDecoration: 'none' }}><button className="btn-ghost" style={{ width: '100%', padding: '10px', fontSize: 13 }}>Sign In</button></Link>
                    <Link to="/register" style={{ flex: 1, textDecoration: 'none' }}><button className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 13 }}><span>Get Started</span></button></Link>
                  </div>
                )}
                {currentUser && (
                  <button onClick={handleLogout} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    🚪 Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Click-away for user dropdown */}
      {userOpen && <div onClick={() => setUserOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />}
    </>
  );
}

const menuItemStyle = {
  display: 'block',
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background 0.15s',
  textDecoration: 'none',
};
