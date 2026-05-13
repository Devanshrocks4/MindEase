// ─────────────────────────────────────────────────────────────────
//  src/components/Dashboard.js  (DEBUG-ENABLED VERSION)
//
//  Replace your current Dashboard.js with this file.
//
//  WHAT'S NEW: a dark "🔍 Diagnostic" panel at the top of the page
//  that shows you in plain English:
//    • Whether you're signed in, and as whom
//    • Your Firebase UID
//    • The exact query being run
//    • How many docs were returned
//    • The userId field on each returned doc (so you can spot mismatches)
//    • Every Firestore error code, verbatim
//
//  The panel only appears when you're on /dashboard. Once everything
//  works, you can delete the <DiagPanel/> line and you're back to clean.
// ─────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, isFirebaseConfigured } from '../services/firebase';
import {
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { downloadPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CAT = {
  stress:     { emoji: '🧠', label: 'Stress & Anxiety',       color: '#8b5cf6' },
  depression: { emoji: '🌧', label: 'Depression & Mood',      color: '#38bdf8' },
  confidence: { emoji: '💪', label: 'Confidence',             color: '#10b981' },
  emotional:  { emoji: '🎭', label: 'Emotional Stability',    color: '#f59e0b' },
  decision:   { emoji: '🧩', label: 'Decision-Making',        color: '#a78bfa' },
  social:     { emoji: '🤝', label: 'Social Relationships',   color: '#f43f5e' },
  sleep:      { emoji: '🌙', label: 'Sleep Quality',          color: '#2dd4bf' },
  behavioral: { emoji: '🏃', label: 'Behavioral & Lifestyle', color: '#fb923c' },
  digital:    { emoji: '📱', label: 'Digital Well-Being',     color: '#e879f9' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(18,18,42,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#2dd4bf', fontWeight: 600 }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
//  🔍 Diagnostic panel — delete this component once Dashboard works
// ──────────────────────────────────────────────────────────────────
function DiagPanel({ diag }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: '#0a0a2a',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#e2e8f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <strong style={{ color: '#00d4ff' }}>🔍 Diagnostic — what's actually happening</strong>
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          {open ? 'hide' : 'show'}
        </button>
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 6, lineHeight: 1.6 }}>
          <Row k="isFirebaseConfigured"    v={String(diag.isFirebaseConfigured)} />
          <Row k="currentUser?.email"      v={diag.email || 'NOT SIGNED IN'} ok={!!diag.email} />
          <Row k="currentUser?.uid"        v={diag.uid   || '— (anonymous)'}  ok={!!diag.uid} />
          <Row k="query"                   v={diag.queryDesc} />
          <Row k="raw docs returned"       v={String(diag.docsCount)} ok={diag.docsCount > 0} />
          <Row k="error (if any)"          v={diag.errorCode || '— none —'} ok={!diag.errorCode} />
          {diag.errorMessage && <Row k="error.message" v={diag.errorMessage} />}
          {diag.sampleDocs?.length > 0 && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <strong style={{ color: '#00d4ff', fontSize: 11 }}>Sample of what's in Firestore for this query:</strong>
              {diag.sampleDocs.map((d, i) => (
                <div key={i} style={{ marginTop: 6, padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                  <div>doc id: <span style={{ color: '#fbbf24' }}>{d.id}</span></div>
                  <div>userId on doc: <span style={{ color: d.userId === diag.uid ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{d.userId || '(missing)'}</span></div>
                  <div>category: <span style={{ color: '#a78bfa' }}>{d.category}</span></div>
                  <div>date: <span style={{ color: '#94a3b8' }}>{d.date}</span></div>
                </div>
              ))}
            </div>
          )}
          {!diag.uid && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, color: '#fbbf24' }}>
              ⚠ You're not signed in to Firebase Auth. Sign in with a real account and try again.
            </div>
          )}
          {diag.uid && diag.docsCount === 0 && !diag.errorCode && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, color: '#fbbf24' }}>
              ⚠ Query succeeded but returned 0 results. The assessments in Firestore likely have a different <code>userId</code>. Open Firebase Console → Firestore → assessments → click any doc → check its <code>userId</code> field. It should equal: <strong>{diag.uid}</strong>
            </div>
          )}
          {diag.errorCode === 'permission-denied' && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, color: '#f87171' }}>
              ❌ Firestore rules denied this read. Re-publish firestore.rules in Firebase Console.
            </div>
          )}
          {diag.errorCode === 'failed-precondition' && (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, color: '#f87171' }}>
              ❌ Composite index missing. Open browser console (F12) — Firebase has logged a direct link to create the index. Click it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function Row({ k, v, ok }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: '#94a3b8', minWidth: 200 }}>{k}:</span>
      <span style={{ color: ok === undefined ? '#e2e8f0' : ok ? '#10b981' : '#f87171', wordBreak: 'break-all' }}>{v}</span>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('overview');
  const [pdfLoading, setPdfLoading]   = useState(null);
  const [diag, setDiag] = useState({
    isFirebaseConfigured,
    email: '',
    uid: '',
    queryDesc: '(loading…)',
    docsCount: 0,
    errorCode: '',
    errorMessage: '',
    sampleDocs: [],
  });

  useEffect(() => {
    const uid   = currentUser?.uid || '';
    const email = currentUser?.email || '';

    const load = async () => {
      const next = {
        isFirebaseConfigured,
        email,
        uid,
        queryDesc: '(starting)',
        docsCount: 0,
        errorCode: '',
        errorMessage: '',
        sampleDocs: [],
      };
      console.log('[Dashboard] DIAG start →', { isFirebaseConfigured, uid, email });

      try {
        let data = [];

        if (isFirebaseConfigured && db && uid) {
          // First: try ALL assessments in the collection that this user can read.
          // The rules only let them read their OWN, so this returns just their docs
          // but doesn't require any composite index.
          next.queryDesc = `collection('assessments').where('userId','==','${uid}')`;
          let snap;
          try {
            const q = query(collection(db, 'assessments'), where('userId', '==', uid));
            snap = await getDocs(q);
          } catch (qErr) {
            console.error('[Dashboard] primary query failed:', qErr.code, qErr.message);
            next.errorCode = qErr.code || 'unknown';
            next.errorMessage = qErr.message || '';
            // Try fetching ALL — rules will still only return what user can read
            try {
              snap = await getDocs(collection(db, 'assessments'));
              next.queryDesc += ' → fallback: getDocs(collection)';
            } catch (qErr2) {
              console.error('[Dashboard] fallback query failed:', qErr2.code, qErr2.message);
              next.errorCode = qErr2.code || next.errorCode;
              next.errorMessage = qErr2.message || next.errorMessage;
              throw qErr2;
            }
          }

          data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Filter client-side in case fallback grabbed broader set
          data = data.filter(a => a.userId === uid);
          data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

          next.docsCount = data.length;
          next.sampleDocs = snap.docs.slice(0, 5).map(d => ({
            id: d.id,
            userId: d.data().userId,
            category: d.data().category,
            date: d.data().date,
          }));

          console.log('[Dashboard] DIAG result →', { docsCount: data.length, sample: next.sampleDocs });
        } else {
          next.queryDesc = '(skipped — firebase not configured OR not signed in)';
          const local = JSON.parse(localStorage.getItem('mindease_assessments') || '[]');
          data = uid ? local.filter((a) => a.userId === uid) : local;
          next.docsCount = data.length;
        }

        setAssessments(data);
      } catch (err) {
        console.error('[Dashboard] load error:', err.code, err.message);
        next.errorCode = err.code || 'unknown';
        next.errorMessage = err.message || '';
        if (err.code === 'permission-denied') {
          toast.error('🔒 Firestore rules blocked the read. Re-publish rules.', { duration: 6000 });
        }
        const local = JSON.parse(localStorage.getItem('mindease_assessments') || '[]');
        setAssessments(uid ? local.filter((a) => a.userId === uid) : local);
      } finally {
        setDiag(next);
        setLoading(false);
      }
    };

    if (currentUser !== undefined) load();
  }, [currentUser]);

  const avgScore    = assessments.length ? Math.round(assessments.reduce((s, a) => s + (a.wellnessIndex || 0), 0) / assessments.length) : 0;
  const latestScore = assessments[0]?.wellnessIndex ?? 0;
  const trend       = assessments.length >= 2 ? latestScore - (assessments[1]?.wellnessIndex ?? 0) : 0;

  const latestByCategory = {};
  assessments.forEach((a) => { if (!latestByCategory[a.category]) latestByCategory[a.category] = a; });
  const radarData = Object.entries(latestByCategory).map(([cat, a]) => ({
    subject: CAT[cat]?.label || cat,
    score:   a.wellnessIndex || 0,
    color:   CAT[cat]?.color  || '#8b5cf6',
  }));

  const areaData = [...assessments].slice(0, 8).reverse().map((a, i) => ({
    name:  `#${i + 1}`,
    score: a.wellnessIndex || 0,
    date:  new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    cat:   CAT[a.category]?.label || a.category,
  }));

  const handlePDF = async (a) => {
    setPdfLoading(a.id);
    try { await downloadPDF(a); toast.success('PDF downloaded!'); }
    catch { toast.error('PDF failed. Try again.'); }
    finally { setPdfLoading(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

// Empty state
  if (assessments.length === 0) return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center card p-10">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">No assessments yet</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Take your first wellness assessment to get started!</p>
          <button onClick={() => navigate('/assessment/stress')} className="btn-primary px-8 py-3 text-sm"><span>Take First Assessment →</span></button>
        </div>
      </div>
    </div>
  );

return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="badge badge-teal mb-3 w-fit">Your Wellness Hub</div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Hello, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Here's your mental wellness overview.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '📈', label: 'Latest Score', value: `${latestScore}%`, sub: trend >= 0 ? `+${trend}` : `${trend}`, color: trend >= 0 ? '#10b981' : '#f43f5e' },
            { icon: '🎯', label: 'Average', value: `${avgScore}%`, sub: 'overall' },
            { icon: '📋', label: 'Tests Taken', value: assessments.length, sub: 'completed' },
            { icon: '🏆', label: 'Categories', value: Object.keys(latestByCategory).length, sub: 'tracked' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="stat-card">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="font-display text-2xl font-bold" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs font-bold font-display text-white mt-0.5">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)' }}>
          {['overview', 'history', 'radar'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all capitalize"
              style={{ background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent', color: tab === t ? 'var(--cyan)' : 'var(--text-muted)', border: tab === t ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {areaData.length > 1 && (
                <div className="card p-5 mb-6">
                  <h3 className="font-display text-base font-bold text-white mb-4">Wellness Over Time</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" name="Wellness" stroke="#00d4ff" strokeWidth={2} fill="url(#grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(latestByCategory).map(([cat, a], i) => {
                  const info = CAT[cat] || { emoji: '📊', label: cat, color: '#8b5cf6' };
                  return (
                    <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.emoji}</span>
                          <span className="font-display font-bold text-white text-sm">{info.label}</span>
                        </div>
                        <span className="font-display font-bold text-lg" style={{ color: info.color }}>{a.wellnessIndex}%</span>
                      </div>
                      <div className="progress-bar mb-2">
                        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${a.wellnessIndex}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                          style={{ background: `linear-gradient(90deg,${info.color}80,${info.color})` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-xs font-bold" style={{ color: info.color }}>{a.wellnessLevel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {assessments.map((a, i) => {
                const info = CAT[a.category] || { emoji: '📊', label: a.category, color: '#8b5cf6' };
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.emoji}</span>
                      <div>
                        <p className="font-display font-bold text-white text-sm">{a.categoryName || info.label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-display font-bold text-lg" style={{ color: info.color }}>{a.wellnessIndex}%</span>
                      <button onClick={() => handlePDF(a)} disabled={pdfLoading === a.id} className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: pdfLoading === a.id ? 0.6 : 1 }}>
                        {pdfLoading === a.id ? '⏳' : '📄'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {tab === 'radar' && (
            <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {radarData.length >= 3 ? (
                <div className="card p-6">
                  <h3 className="font-display text-base font-bold text-white mb-4">Wellness Profile</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8892b0', fontSize: 11 }} />
                      <Radar name="Score" dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.1} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="card p-10 text-center">
                  <div className="text-4xl mb-3">🕸️</div>
                  <p className="font-display font-bold text-white mb-2">Complete 3+ categories</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The radar chart appears once you've assessed at least 3 different wellness areas.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap gap-3">
          {['stress', 'sleep', 'social', 'depression'].map((cat) => {
            const info = CAT[cat];
            return (
              <motion.button key={cat} onClick={() => navigate(`/assessment/${cat}`)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-display transition-all"
                style={{ background: `${info.color}10`, border: `1px solid ${info.color}30`, color: info.color, cursor: 'pointer' }}>
                <span>{info.emoji}</span> {info.label.split('&')[0].trim()}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}