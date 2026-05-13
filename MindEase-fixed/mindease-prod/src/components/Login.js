import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = [
  'admin@mindease.com','jasica@kaur.com','devansh@gupta.com',
  'admin@mind.com','devansh@mindease.com',
];

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    if (isAdmin && !ADMIN_EMAILS.includes(email.toLowerCase())) {
      toast.error('Not a recognised admin email'); return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(isAdmin ? '👑 Admin access granted!' : '✨ Welcome back!');
      navigate(isAdmin ? '/admin' : '/');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('user-not-found')) toast.error('No account with that email');
      else if (code.includes('wrong-password')) toast.error('Incorrect password');
      else if (code.includes('too-many-requests')) toast.error('Too many attempts — try later');
      else toast.error('Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4" style={{ boxShadow: '0 0 25px rgba(0,212,255,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <img
                src={process.env.PUBLIC_URL + '/mindease-logo.png'} alt="MindEase"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg,#00d4ff,#6366f1)'; e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:28px">🧠</div>'; }}
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {isAdmin ? 'Admin Access' : 'Welcome back'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isAdmin ? 'Sign in to the admin panel' : 'Continue your wellness journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>EMAIL ADDRESS</label>
              <input
                value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" placeholder="you@example.com"
                className="input-dark" disabled={loading} autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>PASSWORD</label>
              <div className="relative">
                <input
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  className="input-dark pr-11" disabled={loading} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors hover:text-white"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Admin toggle */}
            <button
              type="button" onClick={() => setIsAdmin(!isAdmin)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
              style={{
                borderColor: isAdmin ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)',
                background: isAdmin ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: isAdmin ? '#f59e0b' : 'transparent', borderColor: isAdmin ? '#f59e0b' : '#4a5568' }}>
                {isAdmin && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div>
                <div className="text-sm font-semibold font-display" style={{ color: isAdmin ? '#f59e0b' : 'var(--text-muted)' }}>⚙ Login as Administrator</div>
                {isAdmin && <div className="text-xs mt-0.5" style={{ color: '#b45309' }}>Admin credentials required</div>}
              </div>
            </button>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all relative overflow-hidden"
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                  : 'linear-gradient(135deg, var(--cyan-dim), var(--indigo), var(--violet))',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : isAdmin ? '⚙ Access Admin Panel' : '✦ Sign In'}
            </motion.button>
          </form>

          <div className="divider" />

          <div className="text-center space-y-2">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              New here?{' '}
              <Link to="/register" className="font-semibold hover:text-white transition-colors" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Create account</Link>
            </p>
            <Link to="/" className="text-xs block hover:text-white transition-colors" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Continue without account →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
