import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const chatbotLogo = process.env.PUBLIC_URL + '/chatbot-logo.png';

// ── Specialist data ────────────────────────────────────────────────
const SPECIALISTS = [
  { id:1, name:'Dr. Priya Sharma',   role:'Clinical Psychologist', city:'Ludhiana',   color:'#8b5cf6', specialFor:['anxiety','depression','trauma','stress','cbt','grief','ocd','ptsd','panic'] },
  { id:2, name:'Dr. Rajan Mehta',    role:'Neurologist',           city:'Chandigarh', color:'#00d4ff', specialFor:['migraine','headache','sleep','memory','adhd','brain','concentration','fog','nerve'] },
  { id:3, name:'Dr. Anita Kapoor',   role:'Psychiatrist',          city:'Delhi',      color:'#10b981', specialFor:['bipolar','ocd','panic','medication','psychosis','schizophrenia','mood disorder'] },
  { id:4, name:'Dr. Suresh Nair',    role:'Clinical Psychologist', city:'Mumbai',     color:'#f59e0b', specialFor:['grief','relationship','self-esteem','mindfulness','divorce','loss'] },
  { id:5, name:'Dr. Kavya Reddy',    role:'Neuropsychologist',     city:'Bangalore',  color:'#f43f5e', specialFor:['cognition','adhd','learning','focus','memory','concentration'] },
  { id:6, name:'Dr. Arjun Bose',     role:'Psychotherapist',       city:'Kolkata',    color:'#a78bfa', specialFor:['phobia','social anxiety','ptsd','dbt','avoidance','fear'] },
  { id:7, name:'Dr. Meera Joshi',    role:'Child Psychologist',    city:'Pune',       color:'#ec4899', specialFor:['child','teen','adolescent','adhd','behavioral','school','parenting'] },
  { id:8, name:'Dr. Vikram Singh',   role:'Addiction Psychiatrist',city:'Jaipur',     color:'#2dd4bf', specialFor:['addiction','substance','alcohol','drug','de-addiction'] },
];

function suggestSpecialists(conversationText) {
  const text = conversationText.toLowerCase();
  const scored = SPECIALISTS.map(s => ({
    ...s,
    score: s.specialFor.filter(kw => text.includes(kw)).length
  })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, 2);
}

function detectNeedForHelp(messages) {
  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  const indicators = ['weeks','months','every day','daily','can\'t sleep','can\'t eat','always feel','never feel','hopeless','worthless','no point','exhausted','can\'t function','affecting work','affecting relationship','need help','should i see','should i talk','therapist','psychiatrist','medication','doctor'];
  const count = indicators.filter(ind => allText.includes(ind)).length;
  return count >= 2;
}

async function callGeminiAPI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('NO_KEY');
  }

  const systemPrompt = `You are MindEase AI — a compassionate dual-role mental health companion combining Clinical Psychology and Neurology expertise, built by Devansh Gupta & Team for users in India.

PERSONA: Warm, empathetic, professionally grounded. Never robotic. Validate emotions first, then offer solutions. Use evidence-based approaches: CBT, mindfulness, psychoeducation. Ask ONE question at a time. Be conversational, not clinical.

PSYCHOLOGY EXPERTISE: Anxiety, depression, stress, trauma, grief, relationships, self-esteem, OCD, PTSD, panic attacks. Teach: box breathing, grounding (5-4-3-2-1), journaling, cognitive reframing.

NEUROLOGY EXPERTISE: Sleep disorders, headaches/migraines, brain fog, memory issues, ADHD, poor concentration. Explain brain-body connections. Suggest: sleep hygiene, diet, exercise, screen habits.

ASSESSMENT: After 4-6 exchanges, if you sense the person needs professional help (persistent symptoms, severe distress, safety concerns), gently recommend a specialist. Specify PSYCHOLOGIST for emotional/mental issues, NEUROLOGIST for brain/sleep/physical symptoms, PSYCHIATRIST for medication needs or severe conditions.

SAFETY: If self-harm or suicide is mentioned → immediately provide: iCall: 9152987821 | Vandrevala: 1860-2662-345 | NIMHANS: 080-46110007 | Emergency: 112. Urge them to call NOW.

STYLE: 3-5 sentences unless more is needed. Warm conversational tone. End with a gentle question or empathetic suggestion. Be culturally aware of South Asian mental health stigma — normalize seeking help.

IMPORTANT: When you identify the person likely needs a specific type of specialist, include this exact marker in your response: [NEEDS_SPECIALIST:psychologist] or [NEEDS_SPECIALIST:neurologist] or [NEEDS_SPECIALIST:psychiatrist] — this will trigger the app to show the right doctor. Only add this marker once, when you are genuinely confident.`;

  try {
    // Convert messages to Gemini format (system as first content)
    const contents = [
      {
        parts: [{ text: systemPrompt }]
      },
      ...messages.map(m => ({
        parts: [{ text: m.content }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.8,
            topP: 0.95,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ]
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', response.status, err);
      if (response.status === 400 || response.status === 403) throw new Error('INVALID_KEY');
      if (response.status === 429) throw new Error('RATE_LIMIT');
      if (response.status >= 500) throw new Error('OVERLOADED');
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      console.error('No valid response from Gemini:', data);
      throw new Error('NO_RESPONSE');
    }
    return aiText;
  } catch (err) {
    console.error('Gemini API call failed:', err);
    throw err;
  }
}

// ── Demo fallback (if no API key) ──────────────────────────────────
function getDemoResponse(text, conversationHistory = [], isFirstMessage = false) {
  const t = text.toLowerCase();
  const historyText = conversationHistory.map(m => m.content).join(' ').toLowerCase();
  
  // Don't repeat intro after first message
  if (!isFirstMessage && historyText.includes('VITE_GEMINI_API_KEY')) {
    return "I understand you're sharing something important. While my full AI capabilities are offline (add VITE_GEMINI_API_KEY to .env for Gemini), I can still offer support. Tell me more about what you're experiencing?";
  }
  
  // Context-aware responses
  if (t.includes('headache') || t.includes('headaches') || t.includes('migraine')) {
    return "Frequent headaches can be really disruptive. From a neurology perspective, common triggers include tension, dehydration, sleep issues, or screen time. Try: staying hydrated, 20-20-20 rule (every 20 min, look 20ft away for 20sec), and gentle neck stretches. How long have they been happening and what makes them worse?";
  }
  if (t.includes('anxiety') || t.includes('anxious') || t.includes('worry')) {
    return "I hear you — anxiety can feel overwhelming and all-consuming. Your feelings are completely valid. A simple technique that often helps is box breathing: inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Would you like to try it together, or would you prefer to talk more about what's been triggering your anxiety?";
  }
  if (t.includes('depress') || t.includes('sad') || t.includes('hopeless')) {
    return "Thank you for sharing something so personal with me. Feeling depressed or hopeless can make every day feel like an uphill battle. You're not alone in this, and reaching out shows real courage. Can you tell me how long you've been feeling this way? That will help me understand what kind of support might be most helpful for you.";
  }
  if (t.includes('sleep') || t.includes('insomnia')) {
    return "Sleep problems can have such a profound impact on everything — mood, focus, physical health. From a neuroscience perspective, our brains consolidate memories and repair themselves during sleep, so I understand how crucial this is. A few evidence-based approaches: keep consistent sleep/wake times, limit screens 1 hour before bed, and try a body scan meditation. What does your typical evening routine look like?";
  }
  if (t.includes('stress') || t.includes('overwhelmed')) {
    return "Feeling overwhelmed is your mind and body signaling that you need some relief — it's not a sign of weakness. Stress often builds when we feel like we lack control. Let's break this down together. What's the one thing weighing on you most heavily right now? Sometimes naming it is the first step to releasing some of its power.";
  }
  
  // Generic follow-up if no specific match
  if (!isFirstMessage) {
    return "Thank you for sharing that. I want to understand better so I can offer the most helpful support. Can you tell me more about what you're experiencing or how it's affecting you?";
  }
  
  // First message fallback (original intro)
  return "I'm glad you reached out — that takes real strength. I'm MindEase AI, your mental wellness companion with expertise in psychology and neurology. I'm here to listen without judgment and support you through whatever you're experiencing. To add your Gemini API key, edit the .env file and add VITE_GEMINI_API_KEY=your_key. What's been on your mind lately?";
}

async function callAI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    // Demo mode — use fallback with context
    const lastMsg = messages[messages.length - 1]?.content || '';
    const isFirstMessage = messages.length === 1;
    return getDemoResponse(lastMsg, messages.slice(0, -1), isFirstMessage);
  }
  return await callGeminiAPI(messages);
}

// ── UI CONSTANTS ────────────────────────────────────────────────────
const MOODS = [
  { emoji:'😊', label:'Good',     color:'#10b981' },
  { emoji:'😐', label:'Okay',     color:'#f59e0b' },
  { emoji:'😔', label:'Low',      color:'#a855f7' },
  { emoji:'😰', label:'Anxious',  color:'#f97316' },
  { emoji:'😢', label:'Sad',      color:'#00d4ff' },
  { emoji:'😤', label:'Stressed', color:'#f43f5e' },
];

const PROMPTS = [
  "I've been feeling very anxious lately",
  "I'm struggling to sleep properly",
  "I feel completely overwhelmed",
  "I've been having frequent headaches",
  "I'm feeling unmotivated and low",
  "I need help managing my stress",
];

const CRISIS_WORDS = ['suicide','kill myself','end it all','not worth living','want to die','harm myself','hurt myself','no reason to live'];
const isCrisis = (t) => CRISIS_WORDS.some(k => t.toLowerCase().includes(k));

// ── MAIN COMPONENT ──────────────────────────────────────────────────
export default function Chat({ userId }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('mood');
  const [mood, setMood] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [suggestedSpecialists, setSuggestedSpecialists] = useState([]);
  const [showSpecialistBanner, setShowSpecialistBanner] = useState(false);
  const [specialistType, setSpecialistType] = useState(null);
  const [count, setCount] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'friend';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const startChat = useCallback((m) => {
    setStep('chat');
    const mCtx = m ? ` I see you're feeling ${m.label.toLowerCase()} today.` : '';
    setMessages([{
      id: 1, role: 'assistant',
      content: `Hi ${name}! I'm MindEase AI — your mental wellness companion powered by Gemini.${mCtx} I bring expertise in both psychology and neurology to support you. Whatever's on your mind, I'm here to listen without judgment. What would you like to talk about today?`,
      ts: new Date()
    }]);
  }, [name]);

  const processAIResponse = useCallback((reply, updatedMessages) => {
    const specialistMatch = reply.match(/\[NEEDS_SPECIALIST:(psychologist|neurologist|psychiatrist)\]/i);
    let cleanReply = reply.replace(/\[NEEDS_SPECIALIST:[^\]]+\]/gi, '').trim();

    if (specialistMatch) {
      const type = specialistMatch[1].toLowerCase();
      setSpecialistType(type);
      const allText = updatedMessages.map(m => m.content).join(' ');
      const suggested = suggestSpecialists(allText + ' ' + type);
      if (suggested.length > 0) setSuggestedSpecialists(suggested);
      setShowSpecialistBanner(true);
    } else if (count >= 5 && !showSpecialistBanner) {
      const allText = updatedMessages.map(m => m.content).join(' ');
      if (detectNeedForHelp(updatedMessages)) {
        const suggested = suggestSpecialists(allText);
        if (suggested.length > 0) { setSuggestedSpecialists(suggested); setShowSpecialistBanner(true); }
      }
    }
    return cleanReply;
  }, [count, showSpecialistBanner]);

  const send = useCallback(async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput('');
    if (isCrisis(text)) setCrisis(true);

    const userMsg = { id: Date.now(), role: 'user', content: text, ts: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    const n = count + 1;
    setCount(n);

    try {
      const history = updated.map(m => ({ role: m.role, content: m.content }));
      if (n === 1 && mood) history[history.length-1].content = `[Mood: ${mood.label}] ${text}`;
      const rawReply = await callAI(history);
      const cleanReply = processAIResponse(rawReply, updated);
      setMessages(p => [...p, { id: Date.now()+1, role: 'assistant', content: cleanReply, ts: new Date() }]);
    } catch (err) {
      let errMsg;
      if (err.message === 'NO_KEY') {
        // Only show API key message once, then use demo mode
        const hasShownKeyError = messages.some(m => m.content.includes('VITE_GEMINI_API_KEY'));
        if (!hasShownKeyError) {
          errMsg = '🔑 No Gemini API key found. Please add VITE_GEMINI_API_KEY to your .env file. Get a free key at aistudio.google.com/app/apikey';
        } else {
          errMsg = "I'm here in demo mode. Continue sharing - I can still provide helpful guidance! 💙";
        }
      } else if (err.message === 'INVALID_KEY') {
        errMsg = '⚠️ Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in the .env file.';
      } else if (err.message === 'RATE_LIMIT') {
        errMsg = "I'm a bit busy right now 😊 Please wait a moment and try again — I'm here for you.";
      } else if (err.message === 'OVERLOADED') {
        errMsg = "The AI is temporarily overloaded. Please try again in a moment.";
      } else {
        const fallbacks = [
          "I'm having a brief connection issue. Whatever you're feeling right now is valid. Try taking 3 deep breaths. Please try again in a moment.",
          "Connection hiccup on my end! If you need immediate support, iCall (9152987821) is available Mon–Sat 8am–10pm.",
        ];
        errMsg = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }
      setMessages(p => [...p, { id: Date.now()+1, role: 'assistant', content: errMsg, ts: new Date() }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, messages, count, mood, processAIResponse]);

  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getSpecialistTypeLabel = () => {
    if (specialistType === 'neurologist') return 'Neurologist';
    if (specialistType === 'psychiatrist') return 'Psychiatrist';
    return 'Psychologist';
  };

  // ── MOOD SCREEN ──────────────────────────────────────────────────
  if (step === 'mood') return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="grid-bg" />
      <motion.div initial={{ opacity:0, y:40, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.6, ease:[0.16,1,0.3,1] }} className="w-full max-w-md relative z-10">
        <div className="card p-8" style={{ background:'rgba(13,13,34,0.85)', backdropFilter:'blur(40px)', border:'1px solid rgba(0,212,255,0.12)', boxShadow:'0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,212,255,0.05)' }}>
          
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <motion.div className="mx-auto mb-5 relative w-20 h-20"
              animate={{ y:[0,-5,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}>
              <div className="absolute inset-0 rounded-2xl" style={{ background:'radial-gradient(circle, rgba(0,212,255,0.2), transparent 70%)', filter:'blur(15px)', transform:'scale(1.3)' }} />
              <img src={chatbotLogo} alt="MindEase AI" className="w-20 h-20 rounded-2xl object-cover relative z-10" style={{ boxShadow:'0 0 30px rgba(0,212,255,0.3)' }}
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 items-center justify-center text-3xl hidden absolute inset-0 z-10">🧠</div>
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">MindEase AI</h1>
            <p className="text-xs mt-1 font-display tracking-widest uppercase" style={{ color:'var(--cyan)', letterSpacing:'0.12em' }}>Powered by Gemini</p>
            <p className="text-sm mt-3" style={{ color:'var(--text-secondary)' }}>
              Welcome, <span className="font-semibold" style={{ color:'var(--cyan)' }}>{name}</span>. How are you feeling right now?
            </p>
          </div>

          {/* Mood grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {MOODS.map((m, i) => (
              <motion.button key={m.label}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3+i*0.05 }}
                onClick={() => setMood(mood?.label === m.label ? null : m)}
                whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.97 }}
                className="flex flex-col items-center p-3.5 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: mood?.label === m.label ? m.color : 'rgba(255,255,255,0.06)',
                  background: mood?.label === m.label ? m.color+'18' : 'rgba(255,255,255,0.02)',
                  boxShadow: mood?.label === m.label ? `0 0 20px ${m.color}25` : 'none'
                }}>
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-xs font-semibold font-display" style={{ color: mood?.label === m.label ? m.color : 'var(--text-muted)' }}>{m.label}</span>
              </motion.button>
            ))}
          </div>

          <motion.button onClick={() => startChat(mood)} className="btn-primary w-full py-3.5"
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
            <span>Begin Session →</span>
          </motion.button>
          <p className="text-center text-xs mt-4" style={{ color:'var(--text-muted)' }}>
            🔒 Confidential · Crisis: iCall 9152987821
          </p>
          <div className="mt-4 text-center">
            <div className="credit-badge mx-auto w-fit"><span>✦</span><span>By <strong>Devansh Gupta</strong> & Team</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // ── CHAT SCREEN ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col pt-16" style={{ height:'100vh', background:'var(--bg-primary)' }}>
      <div className="orb orb-1" style={{ opacity:0.15 }} />
      <div className="orb orb-2" style={{ opacity:0.1 }} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom:'1px solid rgba(0,212,255,0.08)', background:'rgba(4,4,15,0.92)', backdropFilter:'blur(24px)' }}>
        <motion.div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 relative"
          animate={{ boxShadow:['0 0 10px rgba(0,212,255,0.3)','0 0 25px rgba(0,212,255,0.6)','0 0 10px rgba(0,212,255,0.3)'] }}
          transition={{ duration:2.5, repeat:Infinity }}>
          <img src={chatbotLogo} alt="AI" className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-violet-500 items-center justify-center text-white text-xs font-bold font-display hidden absolute inset-0">AI</div>
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-bold font-display text-white tracking-tight">MindEase AI</div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }} />
            <span className="text-xs font-display" style={{ color:'var(--text-muted)' }}>Gemini · Psychology & Neurology</span>
          </div>
        </div>
        {mood && <span className="text-xl" title={`Mood: ${mood.label}`}>{mood.emoji}</span>}
        <button onClick={() => navigate('/help')} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
          👨‍⚕️ Find Help
        </button>
      </div>

      {/* Crisis banner */}
      <AnimatePresence>
        {crisis && (
          <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="flex-shrink-0 overflow-hidden"
            style={{ background:'rgba(244,63,94,0.08)', borderBottom:'1px solid rgba(244,63,94,0.25)' }}>
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="text-lg">🆘</span>
              <div className="flex-1 text-xs" style={{ color:'#fb7185' }}>
                <strong>Immediate Help:</strong> iCall <strong>9152987821</strong> · Vandrevala <strong>1860-2662-345</strong> · Emergency <strong>112</strong>
              </div>
              <button onClick={() => setCrisis(false)} className="text-rose-400 hover:text-rose-300 text-xs">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specialist suggestion banner */}
      <AnimatePresence>
        {showSpecialistBanner && suggestedSpecialists.length > 0 && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            className="flex-shrink-0 overflow-hidden"
            style={{ background:'rgba(0,212,255,0.05)', borderBottom:'1px solid rgba(0,212,255,0.15)' }}>
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold font-display" style={{ color:'var(--cyan)' }}>
                  💡 Based on our conversation, these {getSpecialistTypeLabel()}s may help:
                </p>
                <button onClick={() => setShowSpecialistBanner(false)} className="text-xs" style={{ color:'var(--text-muted)' }}>✕</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {suggestedSpecialists.map(s => (
                  <button key={s.id} onClick={() => navigate('/help')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 font-display"
                    style={{ background:`linear-gradient(135deg,${s.color},${s.color}99)`, boxShadow:`0 0 15px ${s.color}30` }}>
                    {s.name} · {s.role}
                  </button>
                ))}
                <button onClick={() => navigate('/help')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold font-display transition-all hover:opacity-80"
                  style={{ border:'1px solid rgba(0,212,255,0.3)', color:'var(--cyan)' }}>
                  View All →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-3xl w-full mx-auto">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.3 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden relative ${msg.role === 'assistant' ? '' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}
              style={msg.role === 'assistant' ? { boxShadow:'0 0 15px rgba(0,212,255,0.3)' } : {}}>
              {msg.role === 'assistant' ? (
                <>
                  <img src={chatbotLogo} alt="AI" className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-violet-500 items-center justify-center text-white text-xs font-bold font-display hidden absolute inset-0">AI</div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold font-display">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`max-w-xs md:max-w-lg px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}
              style={{ whiteSpace:'pre-wrap' }}>
              {msg.content}
              <div className="text-xs mt-2 opacity-30 font-mono">{fmtTime(msg.ts)}</div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 relative" style={{ boxShadow:'0 0 15px rgba(0,212,255,0.3)' }}>
              <img src={chatbotLogo} alt="AI" className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-violet-500 items-center justify-center text-white text-xs font-bold hidden absolute inset-0 flex">AI</div>
            </div>
            <div className="bubble-ai px-5 py-4 flex items-center gap-2">
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay:`${i*0.15}s` }} />)}
            </div>
          </motion.div>
        )}

        {messages.length === 1 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="flex flex-wrap gap-2 pt-2">
            {PROMPTS.map(p => (
              <motion.button key={p} onClick={() => send(p)}
                whileHover={{ scale:1.02, borderColor:'rgba(0,212,255,0.4)' }}
                className="text-xs px-3.5 py-2 rounded-full transition-all font-display"
                style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'var(--text-secondary)' }}>
                {p}
              </motion.button>
            ))}
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-5 max-w-3xl w-full mx-auto">
        <motion.div className="flex gap-2 items-end rounded-2xl p-2 pl-4 transition-all"
          style={{ background:'rgba(13,13,34,0.9)', border:'1px solid rgba(0,212,255,0.12)', backdropFilter:'blur(20px)' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Share what's on your mind..." rows={1}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none resize-none py-1"
            style={{ maxHeight:120, fontFamily:'var(--font-body)' }} />
          <motion.button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 transition-all"
            style={{
              background: !input.trim() || loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#00a8cc,#6366f1,#a855f7)',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              boxShadow: input.trim() && !loading ? '0 0 20px rgba(0,212,255,0.3)' : 'none'
            }}
            whileHover={{ scale: input.trim() && !loading ? 1.08 : 1 }}
            whileTap={{ scale:0.95 }}>
            ↑
          </motion.button>
        </motion.div>
        <p className="text-center text-xs mt-2" style={{ color:'var(--text-muted)' }}>
          Crisis: iCall <strong>9152987821</strong> · Vandrevala <strong>1860-2662-345</strong> · Made by <strong style={{ color:'var(--cyan)' }}>Devansh Gupta</strong> & Team
        </p>
      </div>
    </div>
  );
}
