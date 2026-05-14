import React, { Suspense, lazy, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components (eager)
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

// Pages (lazy)
const Login          = lazy(() => import('./components/Login'));
const Register       = lazy(() => import('./components/Register'));
const AssessmentTest = lazy(() => import('./components/AssessmentTest'));
const ResultsPage    = lazy(() => import('./components/ResultsPage'));
const Chat           = lazy(() => import('./components/Chat'));
const HelpPage       = lazy(() => import('./components/HelpPage'));
const Dashboard      = lazy(() => import('./components/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminLogin     = lazy(() => import('./components/AdminLogin'));

// ── Static data ────────────────────────────────────────────────────
const ISSUES = [
  { id:'stress',     emoji:'🧠', label:'Stress & Anxiety',           desc:'PSS-10 · GAD-7',        color:'#6366f1', glow:'rgba(99,102,241,0.25)' },
  { id:'depression', emoji:'🌧',  label:'Depression & Mood',           desc:'PHQ-9',                 color:'#00d4ff', glow:'rgba(0,212,255,0.25)' },
  { id:'confidence', emoji:'💪',  label:'Confidence & Self-Esteem',    desc:'RSES',                  color:'#10b981', glow:'rgba(16,185,129,0.25)' },
  { id:'emotional',  emoji:'🎭',  label:'Emotional Stability',         desc:'DERS',                  color:'#f59e0b', glow:'rgba(245,158,11,0.25)' },
  { id:'decision',   emoji:'🧩',  label:'Decision-Making & Cognition', desc:'BIS-11',                color:'#a855f7', glow:'rgba(168,85,247,0.25)' },
  { id:'social',     emoji:'🤝',  label:'Social Relationships',        desc:'UCLA Loneliness Scale',  color:'#f43f5e', glow:'rgba(244,63,94,0.25)' },
  { id:'sleep',      emoji:'🌙',  label:'Sleep Quality',               desc:'PSQI',                  color:'#2dd4bf', glow:'rgba(45,212,191,0.25)' },
  { id:'behavioral', emoji:'🏃',  label:'Behavioral & Lifestyle',      desc:'EAT-26 · IPAQ',         color:'#fb923c', glow:'rgba(251,146,60,0.25)' },
  { id:'digital',    emoji:'📱',  label:'Digital Well-Being',          desc:'IAT · SAS-SV',          color:'#e879f9', glow:'rgba(232,121,249,0.25)' },
];

const pageVariants  = { initial:{ opacity:0, y:16 }, animate:{ opacity:1, y:0 }, exit:{ opacity:0, y:-8 } };
const pageTransition = { duration:0.3, ease:'easeInOut' };

// ── Floating particles ─────────────────────────────────────────────
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(18)].map((_, i) => (
        <div key={i} className="particle" style={{
          left:`${Math.random() * 100}%`,
          width:`${1 + Math.random() * 2}px`,
          height:`${1 + Math.random() * 2}px`,
          animationDuration:`${8 + Math.random() * 15}s`,
          animationDelay:`${Math.random() * 10}s`,
          opacity: 0.3 + Math.random() * 0.4,
          background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#6366f1' : '#a855f7',
        }} />
      ))}
    </div>
  );
}

// ── 3D stat card ───────────────────────────────────────────────────
function StatCard({ value, label, delay }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateZ(10px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };

  return (
    <motion.div ref={ref} initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.6 }}
      onMouseMove={onMove} onMouseLeave={onLeave}
      className="card p-5 text-center cursor-default"
      style={{ transformStyle:'preserve-3d', transition:'transform 0.15s ease' }}>
      <div className="font-display text-3xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-xs font-display tracking-widest uppercase" style={{ color:'var(--text-muted)', letterSpacing:'0.1em' }}>{label}</div>
    </motion.div>
  );
}

// ── Assessment card ────────────────────────────────────────────────
function AssessmentCard({ item, index, onClick }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-4px) scale(1.01)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };

  return (
    <motion.button ref={ref} initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:0.55 + index * 0.04, duration:0.5 }}
      onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave}
      className="card p-5 text-left group relative overflow-hidden"
      style={{ transformStyle:'preserve-3d', transition:'transform 0.15s ease', cursor:'pointer', border:'none', width:'100%' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background:`radial-gradient(circle at 20% 80%, ${item.glow}, transparent 65%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background:`linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
      <div className="relative z-10">
        <div className="text-3xl mb-3" style={{ filter:`drop-shadow(0 0 12px ${item.color}60)` }}>{item.emoji}</div>
        <div className="font-bold font-display text-primary text-sm mb-1">{item.label}</div>
        <div className="font-mono text-xs" style={{ color:'var(--text-secondary)', fontSize:'11px' }}>{item.desc}</div>
        <div className="mt-3 flex items-center gap-1 text-xs font-bold font-display" style={{ color:item.color }}>
          Start <motion.span animate={{ x:[0,3,0] }} transition={{ duration:1.5, repeat:Infinity }}>→</motion.span>
        </div>
      </div>
    </motion.button>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop:'1px solid rgba(0,212,255,0.06)', background:'rgba(4,4,15,0.9)' }} className="py-8 px-6 mt-auto relative z-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ boxShadow:'0 0 10px rgba(0,212,255,0.2)' }}>
            <img src={process.env.PUBLIC_URL + '/mindease-logo.png'} alt="MindEase" className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display='none'; e.target.parentElement.style.background='linear-gradient(135deg,#00d4ff,#6366f1)'; }} />
          </div>
          <span className="font-display text-sm font-bold text-white">MindEase</span>
        </div>
        <div className="credit-badge">
          <span>✦</span>
          <span>Crafted with care by <strong>Devansh Gupta</strong> &amp; Team</span>
        </div>
        <p className="text-xs" style={{ color:'var(--text-muted)' }}>Not medical advice · © 2025</p>
      </div>
    </footer>
  );
}

// ── Home page ──────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0,1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);

  return (
    <motion.div {...pageVariants} transition={pageTransition} className="min-h-screen relative">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-4" />
      <div className="grid-bg" />
      <Particles />

      <motion.div ref={heroRef} style={{ y:heroY, opacity:heroOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-5 pt-32 pb-16 text-center">

        {/* Logo */}
        <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.8, ease:[0.16,1,0.3,1] }} className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl blur-2xl"
              style={{ background:'radial-gradient(circle,rgba(0,212,255,0.3),rgba(99,102,241,0.2),transparent 70%)', transform:'scale(1.5)' }} />
            <motion.div animate={{ y:[0,-8,0], rotateZ:[0,1,-1,0] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
              className="relative">
              <img src={process.env.PUBLIC_URL + '/mindease-logo.png'} alt="MindEase"
                className="w-24 h-24 rounded-3xl object-cover mx-auto"
                style={{ boxShadow:'0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(99,102,241,0.2)', border:'1px solid rgba(0,212,255,0.2)' }}
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 text-white text-5xl items-center justify-center mx-auto hidden"
                style={{ boxShadow:'0 0 40px rgba(0,212,255,0.4)' }}>🧠</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="badge badge-teal mb-6 mx-auto w-fit">
          <motion.span animate={{ scale:[1,1.3,1] }} transition={{ duration:1.8, repeat:Infinity }} className="inline-block">✦</motion.span>
          <span>AI-Powered Mental Wellness · Gemini</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25, duration:0.7 }}
          className="font-display font-bold leading-tight mb-6"
          style={{ fontSize:'clamp(2.5rem, 7vw, 5rem)', letterSpacing:'-0.02em' }}>
          <span className="text-white">Your mind deserves</span><br />
          <span className="gradient-text">the best care.</span>
        </motion.h1>

        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="text-lg max-w-xl mx-auto mb-10 font-body text-primary/90" style={{ color:'var(--text-primary)' }}>
          Clinically-validated assessments, AI therapy powered by Gemini, and real specialist connections — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
          className="flex flex-wrap gap-3 justify-center mb-16">
          <motion.button onClick={() => navigate('/chat')} className="btn-primary text-sm px-8 py-4 glow-pulse"
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
            <span className="flex items-center gap-2">💬 Talk to AI Now</span>
          </motion.button>
          <motion.button onClick={() => navigate('/assessment/stress')} className="btn-ghost text-sm px-8 py-4"
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
            📋 Take Assessment
          </motion.button>
          {!currentUser && (
            <motion.button onClick={() => navigate('/register')} className="btn-ghost text-sm px-8 py-4"
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
              🌟 Create Free Account
            </motion.button>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 max-w-sm mx-auto gap-3 mb-20">
          <StatCard value="9" label="Clinical Tests" delay={0.5} />
          <StatCard value="24/7" label="AI Support" delay={0.55} />
          <StatCard value="100%" label="Confidential" delay={0.6} />
        </div>

        {/* Divider */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
          className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.2))' }} />
          <span className="text-xs font-mono tracking-widest uppercase font-display" style={{ color:'var(--cyan)', opacity:0.6, letterSpacing:'0.15em' }}>Choose Assessment</span>
          <div className="flex-1 h-px" style={{ background:'linear-gradient(90deg,rgba(0,212,255,0.2),transparent)' }} />
        </motion.div>

        {/* Assessment grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
          {ISSUES.map((item, i) => (
            <AssessmentCard key={item.id} item={item} index={i} onClick={() => navigate(`/assessment/${item.id}`)} />
          ))}
        </div>

        {/* Specialists CTA */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.0 }}
          className="mt-12 p-8 rounded-2xl relative overflow-hidden text-center scan-line"
          style={{ background:'linear-gradient(135deg,rgba(0,212,255,0.06),rgba(99,102,241,0.06))', border:'1px solid rgba(0,212,255,0.15)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background:'radial-gradient(ellipse at top,rgba(0,212,255,0.06),transparent 60%)' }} />
  <div className="font-display text-2xl font-bold text-primary mb-2 relative z-10">Need a real specialist?</div>
  <p className="text-sm mb-5 relative z-10" style={{ color:'var(--text-secondary)' }}>
    Verified psychologists, neurologists &amp; psychiatrists — online &amp; in-person across India.
  </p>
          <motion.button onClick={() => navigate('/help')} className="btn-primary px-8 py-3 text-sm relative z-10"
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
            <span>Find Specialists Near You →</span>
          </motion.button>
        </motion.div>
      </motion.div>
      <Footer />
    </motion.div>
  );
}

// ── Page loader ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-primary)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );
}

// ── App root ───────────────────────────────────────────────────────
export default function App() {
  const { userId } = useAuth();

  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"                  element={<HomePage />} />
            <Route path="/login"             element={<Login />} />
            <Route path="/register"          element={<Register />} />
            <Route path="/admin-login"       element={<AdminLogin />} />
            <Route path="/assessment/:type"  element={<ProtectedRoute><AssessmentTest /></ProtectedRoute>} />
            <Route path="/results"           element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/chat"              element={<Chat userId={userId} />} />
            <Route path="/help"              element={<HelpPage />} />
            <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin"             element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="*"                  element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(13,13,34,0.95)',
            color: '#f0f4ff',
            border: '1px solid rgba(0,212,255,0.15)',
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          },
          success: { iconTheme:{ primary:'#00d4ff', secondary:'#0d0d22' } },
          error:   { iconTheme:{ primary:'#f43f5e', secondary:'#0d0d22' } },
        }}
      />
    </>
  );
}
