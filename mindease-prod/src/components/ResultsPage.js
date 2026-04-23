import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getWellnessRecommendations } from '../data/assessmentData';
import { downloadPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [pdfLoading, setPdfLoading] = useState(false);
  const assessment = location.state?.assessment;

  if (!assessment) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center card p-10 max-w-sm mx-4">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="font-display text-xl font-bold text-white mb-2">No Results Found</h2>
        <p className="text-sm mb-5" style={{ color:'var(--text-secondary)' }}>Please complete an assessment first.</p>
        <button onClick={() => navigate('/')} className="btn-primary px-6 py-2.5 text-sm"><span>← Back Home</span></button>
      </motion.div>
    </div>
  );

  const wd         = getWellnessRecommendations(assessment.wellnessIndex);
  const score      = assessment.wellnessIndex ?? 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e';
  const scoreEmoji = score >= 70 ? '😊' : score >= 45 ? '😐' : '😔';

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF(assessment);
      toast.success('📄 Report downloaded!');
    } catch {
      toast.error('PDF download failed. Please try again.');
    } finally { setPdfLoading(false); }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="max-w-3xl mx-auto relative z-10">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <div className="text-6xl mb-4">{scoreEmoji}</div>
          <div className="badge badge-violet mx-auto mb-3 w-fit">Assessment Complete</div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">{assessment.categoryName}</h1>

          {/* Score ring */}
          <div className="my-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <motion.circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100) }}
                  transition={{ duration: 1.5, ease:'easeOut', delay: 0.3 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold" style={{ color: scoreColor }}>{score}</span>
                <span className="text-xs" style={{ color:'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
          </div>

          <div className="font-display text-xl font-bold" style={{ color: scoreColor }}>{wd.level}</div>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color:'var(--text-secondary)' }}>{wd.message}</p>
        </motion.div>

        {/* Individual results */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {(assessment.testResults || []).map((t, i) => {
            const pct = Math.round((t.score / t.maxScore) * 100);
            return (
              <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 + i * 0.08 }}
                className="card p-5">
                <h3 className="font-semibold text-white text-sm mb-1 font-display">{t.testName}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>{t.score}/{t.maxScore}</span>
                  <span className="badge text-xs px-2 py-0.5" style={{ color: t.color, background: t.bg, border:`1px solid ${t.color}40` }}>{t.severity}</span>
                </div>
                <div className="progress-bar">
                  <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:0.5 + i * 0.08 }}
                    className="progress-fill" style={{ background:`linear-gradient(90deg, ${t.color}80, ${t.color})` }} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recommendations */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }} className="card p-6 mb-5">
          <h3 className="font-display text-lg font-bold text-white mb-4">✦ Personalized Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(assessment.suggestions || []).map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.7 + i * 0.06 }}
                className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background:'rgba(139,92,246,0.2)', color:'#a78bfa' }}>{i + 1}</div>
                <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{s}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
          className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-3 text-sm"><span>📊 View Dashboard</span></button>
          <button onClick={() => navigate('/chat')} className="btn-ghost px-6 py-3 text-sm">💬 Talk to AI</button>
          <motion.button
            onClick={handleDownloadPDF} disabled={pdfLoading}
            whileHover={{ scale: pdfLoading ? 1 : 1.02 }}
            className="btn-ghost px-6 py-3 text-sm"
            style={{ opacity: pdfLoading ? 0.6 : 1 }}
          >
            {pdfLoading ? '⏳ Generating…' : '📄 Download PDF'}
          </motion.button>
          <button onClick={() => navigate('/')} className="btn-ghost px-6 py-3 text-sm">← Home</button>
        </motion.div>
      </div>
    </div>
  );
}
