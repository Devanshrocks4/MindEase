import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ASSESSMENT_DATA, getOverallWellnessIndex, getWellnessRecommendations } from '../data/assessmentData';

const CAT_TESTS = {
  stress:     ['pss','gad7'],
  depression: ['phq9'],
  confidence: ['rses'],
  emotional:  ['ders'],
  decision:   ['bis11'],
  social:     ['ucla_loneliness'],
  sleep:      ['psqi'],
  behavioral: ['eat26'],
  digital:    ['iat','sassv'],
};

const CAT_INFO = {
  stress:     { emoji:'🧠', name:'Stress & Anxiety Assessment',     color:'#8b5cf6', desc:'Measures perceived stress, generalized anxiety, and worry patterns.' },
  depression: { emoji:'🌧',  name:'Depression & Mood Assessment',    color:'#38bdf8', desc:'Evaluates mood, energy, and signs of depression.' },
  confidence: { emoji:'💪',  name:'Confidence & Self-Esteem',        color:'#10b981', desc:'Assesses self-worth, motivation, and sense of control.' },
  emotional:  { emoji:'🎭',  name:'Emotional Stability Assessment',  color:'#f59e0b', desc:'Measures emotional regulation and impulse control.' },
  decision:   { emoji:'🧩',  name:'Cognitive & Decision-Making',     color:'#a78bfa', desc:'Evaluates impulsivity, attention, and cognitive functioning.' },
  social:     { emoji:'🤝',  name:'Social Relationships Assessment', color:'#f43f5e', desc:'Assesses loneliness, social skills, and relationship quality.' },
  sleep:      { emoji:'🌙',  name:'Sleep Quality Assessment',        color:'#2dd4bf', desc:'Measures sleep patterns, insomnia, and rest quality.' },
  behavioral: { emoji:'🏃',  name:'Behavioral & Lifestyle Review',   color:'#fb923c', desc:'Evaluates eating habits, physical activity, and lifestyle.' },
  digital:    { emoji:'📱',  name:'Digital Well-Being Assessment',   color:'#e879f9', desc:'Measures internet addiction and smartphone dependency.' },
};

export default function AssessmentTest() {
  const { type } = useParams();
  const [responses, setResponses] = useState({});
  const [loading, setLoading]     = useState(false);
  const [testIdx, setTestIdx]     = useState(0);
  const [completed, setCompleted] = useState([]);
  const { userId, currentUser }   = useAuth();
  const navigate = useNavigate();

  const testKeys = CAT_TESTS[type] || [type];
  const testKey  = testKeys[testIdx];
  const data     = ASSESSMENT_DATA?.[testKey];
  const catInfo  = CAT_INFO[type] || { emoji:'📊', name:'Assessment', color:'#8b5cf6', desc:'' };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center card p-10 max-w-sm mx-4">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="font-display text-xl font-bold text-white mb-2">Assessment Not Found</h2>
        <p className="text-sm mb-5" style={{ color:'var(--text-secondary)' }}>The assessment type "{type}" doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary px-6 py-2.5 text-sm"><span>← Back Home</span></button>
      </motion.div>
    </div>
  );

  const questions    = data.questions || [];
  const options      = data.options   || [];
  const answeredCount = Object.keys(responses).length;
  const totalQ       = questions.length;
  const overallPct   = ((testIdx + answeredCount / Math.max(totalQ, 1)) / testKeys.length) * 100;

  const calcScore = () => {
    let total = 0;
    Object.entries(responses).forEach(([qi, ai]) => {
      const pts = options[ai]?.points ?? 0;
      if (data.reverseScored?.includes(parseInt(qi))) {
        const max = Math.max(...options.map((o) => o.points ?? 0));
        total += max - pts;
      } else {
        total += pts;
      }
    });
    return total;
  };

  const handleAnswer = (qi, ai) => {
    setResponses((prev) => ({ ...prev, [qi]: ai }));
  };

  const handleNext = async () => {
    const score = calcScore();
    const sev   = data.getSeverity(score);
    const result = {
      testKey, testName: data.name, score,
      maxScore: data.maxScore, severity: sev.level,
      color: sev.color, bg: sev.bg,
      responses: { ...responses }, date: new Date().toISOString(),
    };
    const allCompleted = [...completed, result];
    setCompleted(allCompleted);

    if (testIdx < testKeys.length - 1) {
      setTestIdx((p) => p + 1);
      setResponses({});
    } else {
      await saveResults(allCompleted);
    }
  };

  const saveResults = async (allResults) => {
    setLoading(true);
    try {
      const wi = getOverallWellnessIndex(allResults);
      const wd = getWellnessRecommendations(wi);
      const aData = {
        userId,
        userName:      currentUser?.displayName || 'Anonymous',
        userEmail:     currentUser?.email || 'anonymous',
        category:      type,
        categoryName:  catInfo.name,
        testResults:   allResults,
        wellnessIndex: wi,
        wellnessLevel: wd.level,
        wellnessColor: wd.color,
        wellnessBg:    wd.bg,
        suggestions:   wd.suggestions,
        date:          new Date().toISOString(),
        completed:     true,
      };

      if (isFirebaseConfigured && db) {
        const ref  = await addDoc(collection(db, 'assessments'), aData);
        aData.id   = ref.id;
      } else {
        aData.id = 'local_' + Date.now();
        const local = JSON.parse(localStorage.getItem('mindease_assessments') || '[]');
        local.unshift(aData);
        localStorage.setItem('mindease_assessments', JSON.stringify(local.slice(0, 50)));
      }

      toast.success('Assessment complete! 🎉');
      navigate('/results', { state: { assessment: aData } });
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Could not save results, but they\'re shown below.');
      const wi = getOverallWellnessIndex(allResults);
      const wd = getWellnessRecommendations(wi);
      navigate('/results', { state: { assessment: { userId, category: type, categoryName: catInfo.name, testResults: allResults, wellnessIndex: wi, wellnessLevel: wd.level, wellnessColor: wd.color, wellnessBg: wd.bg, suggestions: wd.suggestions, date: new Date().toISOString() } } });
    } finally { setLoading(false); }
  };

  const isComplete = answeredCount === totalQ;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="max-w-2xl mx-auto relative z-10">

        {/* Progress bar */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 22 }}>{catInfo.emoji}</span>
              <div>
                <p className="font-display font-bold text-white text-sm">{catInfo.name}</p>
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>Test {testIdx + 1} of {testKeys.length}</p>
              </div>
            </div>
            <span className="font-display text-sm font-bold" style={{ color: catInfo.color }}>{Math.round(overallPct)}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <motion.div className="progress-fill" animate={{ width:`${overallPct}%` }} transition={{ duration:0.5 }}
              style={{ background:`linear-gradient(90deg, ${catInfo.color}80, ${catInfo.color})` }} />
          </div>
        </motion.div>

        {/* Test header */}
        <motion.div key={testKey} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="card p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-white mb-1">{data.name}</h2>
          <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{catInfo.desc}</p>
          <p className="text-xs mt-2 font-mono" style={{ color:'var(--text-muted)' }}>
            {answeredCount} / {totalQ} answered
          </p>
        </motion.div>

        {/* Questions */}
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {questions.map((q, qi) => (
              <motion.div key={`${testKey}-${qi}`}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: qi * 0.04 }}
                className="card p-5">
                <p className="font-display font-semibold text-white text-sm mb-4 leading-relaxed">
                  <span className="text-xs font-mono mr-2" style={{ color: catInfo.color }}>Q{qi + 1}</span>
                  {q}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {options.map((opt, ai) => {
                    const selected = responses[qi] === ai;
                    return (
                      <motion.button key={ai} onClick={() => handleAnswer(qi, ai)}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                        style={{
                          background: selected ? `${catInfo.color}15` : 'var(--bg-secondary)',
                          border: `1px solid ${selected ? catInfo.color + '60' : 'var(--border)'}`,
                          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)',
                          cursor: 'pointer',
                        }}>
                        <span className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ borderColor: selected ? catInfo.color : 'var(--text-muted)', background: selected ? catInfo.color : 'transparent' }}>
                            {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                          </span>
                          {opt.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Submit */}
        {isComplete && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mt-8 text-center">
            <motion.button onClick={handleNext} disabled={loading}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              className="btn-primary px-12 py-4 text-base glow-pulse"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Calculating…
                </span>
              ) : testIdx < testKeys.length - 1 ? (
                <span>Next Test →</span>
              ) : (
                <span>✦ View Results</span>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
