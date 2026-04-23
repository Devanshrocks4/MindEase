import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['admin@mindease.com','admin@mind.com','devansh@mindease.com','jasica@kaur.com','devansh@gupta.com'];

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => { if (isAdmin) navigate('/admin'); }, [isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) { toast.error('Access denied. Admin accounts only.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('👑 Admin access granted');
      navigate('/admin');
    } catch (err) {
      if (err.code === 'auth/user-not-found') toast.error('Admin account not found');
      else if (err.code === 'auth/wrong-password') toast.error('Incorrect password');
      else toast.error('Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="card p-8" style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>⚙</div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Restricted access — authorized personnel only</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-secondary)' }}>ADMIN EMAIL</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@mindease.com"
                className="input-dark" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-secondary)' }}>PASSWORD</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" className="input-dark pr-11" disabled={loading} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⟳ Verifying...' : '⚙ Access Admin Panel'}
            </motion.button>
          </form>
          <div className="divider" />
          <div className="text-center">
            <Link to="/login" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
              ← Back to user login
            </Link>
          </div>
          <div className="mt-5 text-center">
            <div className="credit-badge mx-auto w-fit"><span>❤</span><span>By <strong>Devansh Gupta</strong> & Team</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
