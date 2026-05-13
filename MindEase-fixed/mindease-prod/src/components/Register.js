import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('🎉 Account created! Welcome to MindEase.');
      navigate('/');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('email-already-in-use')) toast.error('Email already registered');
      else if (code.includes('weak-password')) toast.error('Password too weak');
      else toast.error('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', '#f43f5e', '#f59e0b', '#10b981'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

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
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4" style={{ boxShadow: '0 0 25px rgba(0,212,255,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <img src={process.env.PUBLIC_URL + '/mindease-logo.png'} alt="MindEase" className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg,#00d4ff,#6366f1)'; e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:28px">🧠</div>'; }} />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Start your mental wellness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'FULL NAME', value: name, setter: setName, type: 'text', placeholder: 'Your name', autoComplete: 'name' },
              { label: 'EMAIL ADDRESS', value: email, setter: setEmail, type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
            ].map(({ label, value, setter, type, placeholder, autoComplete }) => (
              <div key={label}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</label>
                <input value={value} onChange={(e) => setter(e.target.value)} type={type} placeholder={placeholder}
                  className="input-dark" disabled={loading} autoComplete={autoComplete} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>PASSWORD</label>
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                  className="input-dark pr-11" disabled={loading} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ background: s <= strength ? strengthColors[strength] : 'var(--border)' }} />
                  ))}
                  <span className="text-xs font-display font-semibold" style={{ color: strengthColors[strength], minWidth: 40 }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>CONFIRM PASSWORD</label>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Repeat your password"
                className="input-dark" disabled={loading} autoComplete="new-password" />
              {confirm && password !== confirm && (
                <p className="text-xs mt-1.5" style={{ color: '#f43f5e' }}>Passwords don't match</p>
              )}
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, var(--cyan-dim), var(--indigo), var(--violet))', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account…
                </span>
              ) : '✦ Create Account'}
            </motion.button>
          </form>

          <div className="divider" />
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
