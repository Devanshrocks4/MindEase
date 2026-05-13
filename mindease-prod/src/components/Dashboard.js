import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { downloadPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CAT = {
  stress:     { emoji:'🧠', label:'Stress & Anxiety',      color:'#8b5cf6' },
  depression: { emoji:'🌧',  label:'Depression & Mood',     color:'#38bdf8' },
  confidence: { emoji:'💪',  label:'Confidence',            color:'#10b981' },
  emotional:  { emoji:'🎭',  label:'Emotional Stability',   color:'#f59e0b' },
  decision:   { emoji:'🧩',  label:'Decision-Making',       color:'#a78bfa' },
  social:     { emoji:'🤝',  label:'Social Relationships',  color:'#f43f5e' },
  sleep:      { emoji:'🌙',  label:'Sleep Quality',         color:'#2dd4bf' },
  behavioral: { emoji:'🏃',  label:'Behavioral & Lifestyle',color:'#fb923c' },
  digital:    { emoji:'📱',  label:'Digital Well-Being',    color:'#e879f9' },
};

const TIPS = [
  { icon:'🌅', text:'Spend 5 minutes in sunlight each morning — it resets your cortisol rhythm and improves sleep 12 hours later.' },
  { icon:'📝', text:'Write 3 things you\'re grateful for before bed. This trains your brain to scan for positives.' },
  { icon:'💧', text:'Drink a glass of water when you feel irritable. Dehydration mimics anxiety symptoms.' },
  { icon:'🚶', text:'A 20-minute walk in nature reduces cortisol by up to 21% — no gym required.' },
  { icon:'📵', text:'Try a 1-hour phone-free window each evening. Your nervous system will thank you.' },
  { icon:'🧘', text:'4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Activates your parasympathetic system.' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(18,18,42,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'#94a3b8', marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#2dd4bf', fontWeight:600 }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { userId, currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('overview');
  const [pdfLoading, setPdfLoading]   = useState(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const load = async () => {
      try {
        let data = [];
        if (isFirebaseConfigured && db) {
          const q = query(
            collection(db, 'assessments'),
            where('userId', '==', userId),
            orderBy('date', 'desc'),
          );
          const snap = await getDocs(q);
          data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else {
          const local = JSON.parse(localStorage.getItem('mindease_assessments') || '[]');
          data = local.filter((a) => a.userId === userId);
        }
        setAssessments(data);
      } catch (err) {
        console.error('Dashboard load error:', err);
        const local = JSON.parse(localStorage.getItem('mindease_assessments') || '[]');
        setAssessments(local.filter((a) => a.userId === userId));
      } finally { setLoading(false); }
    };
    if (userId) load();
  }, [userId]);

  // Derived stats
  const avgScore   = assessments.length ? Math.round(assessments.reduce((s, a) => s + (a.wellnessIndex || 0), 0) / assessments.length) : 0;
  const latestScore = assessments[0]?.wellnessIndex ?? 0;
  const trend       = assessments.length >= 2 ? latestScore - (assessments[1]?.wellnessIndex ?? 0) : 0;

  // Radar data — one entry per category from latest assessments
  const latestByCategory = {};
  assessments.forEach((a) => {
    if (!latestByCategory[a.category]) latestByCategory[a.category] = a;
  });
  const radarData = Object.entries(latestByCategory).map(([cat, a]) => ({
    subject: CAT[cat]?.label || cat,
    score: a.wellnessIndex || 0,
    color: CAT[cat]?.color || '#8b5cf6',
  }));

  // Area chart data — last 7 assessments reversed
  const areaData = [...assessments].slice(0, 8).reverse().map((a, i) => ({
    name: `#${i + 1}`,
    score: a.wellnessIndex || 0,
    date: new Date(a.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    cat: CAT[a.category]?.label || a.category,
  }));

  const handlePDF = async (a) => {
    setPdfLoading(a.id);
    try { await downloadPDF(a); toast.success('PDF downloaded!'); }
    catch { toast.error('PDF failed. Try again.'); }
    finally { setPdfLoading(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-display" style={{ color:'var(--text-muted)' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  if (assessments.length === 0) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center card p-10 max-w-md relative z-10">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">No assessments yet</h2>
        <p className="text-sm mb-6" style={{ color:'var(--text-secondary)' }}>Complete your first assessment to see insights and track your mental wellness over time.</p>
        <button onClick={() => navigate('/assessment/stress')} className="btn-primary px-8 py-3 text-sm"><span>Take First Assessment →</span></button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background:'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <div className="badge badge-teal mb-3 w-fit">Your Wellness Hub</div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Hello, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Here's your mental wellness overview.</p>
        </motion.div>

        {/* Daily tip */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="card p-5 mb-6 flex items-start gap-4" style={{ border:'1px solid rgba(0,212,255,0.1)', background:'rgba(0,212,255,0.03)' }}>
          <span className="text-2xl">{tip.icon}</span>
          <div>
            <p className="text-xs font-display font-bold tracking-widest mb-1" style={{ color:'var(--cyan)' }}>DAILY TIP</p>
            <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{tip.text}</p>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'✦', label:'Assessments', value: assessments.length, sub:'completed' },
            { icon:'📈', label:'Avg Wellness', value:`${avgScore}%`, sub:'across all tests' },
            { icon:'🎯', label:'Latest Score', value:`${latestScore}%`, sub: trend !== 0 ? `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}% vs last` : 'first result', color: trend > 0 ? '#10b981' : trend < 0 ? '#f43f5e' : undefined },
            { icon:'🏆', label:'Categories', value: Object.keys(latestByCategory).length, sub:'tracked' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 + i * 0.07 }} className="stat-card">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="font-display text-2xl font-bold" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs font-bold font-display text-white mt-0.5">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background:'var(--bg-card)' }}>
          {['overview', 'history', 'radar'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all capitalize"
              style={{ background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent', color: tab === t ? 'var(--cyan)' : 'var(--text-muted)', border: tab === t ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent', cursor:'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {/* Area chart */}
              {areaData.length > 1 && (
                <div className="card p-5 mb-6">
                  <h3 className="font-display text-base font-bold text-white mb-4">Wellness Over Time</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill:'#4a5568', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0,100]} tick={{ fill:'#4a5568', fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" name="Wellness" stroke="#00d4ff" strokeWidth={2} fill="url(#grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Latest by category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(latestByCategory).map(([cat, a], i) => {
                  const info = CAT[cat] || { emoji:'📊', label: cat, color:'#8b5cf6' };
                  return (
                    <motion.div key={cat} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.05 }}
                      className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.emoji}</span>
                          <span className="font-display font-bold text-white text-sm">{info.label}</span>
                        </div>
                        <span className="font-display font-bold text-lg" style={{ color: info.color }}>{a.wellnessIndex}%</span>
                      </div>
                      <div className="progress-bar mb-2">
                        <motion.div className="progress-fill" initial={{ width:0 }} animate={{ width:`${a.wellnessIndex}%` }}
                          transition={{ duration:1, delay:0.3 + i * 0.05 }}
                          style={{ background:`linear-gradient(90deg,${info.color}80,${info.color})` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                        <span className="text-xs font-bold" style={{ color: info.color }}>{a.wellnessLevel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
              {assessments.map((a, i) => {
                const info = CAT[a.category] || { emoji:'📊', label: a.category, color:'#8b5cf6' };
                return (
                  <motion.div key={a.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.04 }}
                    className="card p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.emoji}</span>
                      <div>
                        <p className="font-display font-bold text-white text-sm">{a.categoryName || info.label}</p>
                        <p className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-display font-bold text-lg" style={{ color: info.color }}>{a.wellnessIndex}%</span>
                      <button onClick={() => handlePDF(a)} disabled={pdfLoading === a.id}
                        className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: pdfLoading === a.id ? 0.6 : 1 }}>
                        {pdfLoading === a.id ? '⏳' : '📄'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {tab === 'radar' && (
            <motion.div key="radar" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {radarData.length >= 3 ? (
                <div className="card p-6">
                  <h3 className="font-display text-base font-bold text-white mb-4">Wellness Profile</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:'#8892b0', fontSize:11 }} />
                      <Radar name="Score" dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.1} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="card p-10 text-center">
                  <div className="text-4xl mb-3">🕸️</div>
                  <p className="font-display font-bold text-white mb-2">Complete 3+ categories</p>
                  <p className="text-sm" style={{ color:'var(--text-secondary)' }}>The radar chart appears once you've assessed at least 3 different wellness areas.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} className="mt-8 flex flex-wrap gap-3">
          {['stress','sleep','social','depression'].map((cat) => {
            const info = CAT[cat];
            return (
              <motion.button key={cat} onClick={() => navigate(`/assessment/${cat}`)}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-display transition-all"
                style={{ background:`${info.color}10`, border:`1px solid ${info.color}30`, color: info.color, cursor:'pointer' }}>
                <span>{info.emoji}</span> {info.label.split('&')[0].trim()}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
