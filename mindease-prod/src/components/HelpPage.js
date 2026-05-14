import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const indianStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'
];

const mentalHealthResources = {
  delhi: {
    emergency:[
      { name:"Delhi Mental Health Helpline", phone:"1800-121-4555", type:"24/7 Crisis Support" },
      { name:"AIIMS Emergency", phone:"011-26594401", type:"Medical Emergency" },
      { name:"Vandrevala Foundation", phone:"9999666555", type:"Suicide Prevention" }
    ],
    hospitals:[
      { name:"Institute of Human Behaviour & Allied Sciences (IHBAS)", address:"Dilshad Garden, Delhi-110095", phone:"011-22114021", specialties:["Psychiatry","Psychology","Mental Health"], onlineBooking:true, doctors:[{ name:"Dr. Rajesh Sagar", specialty:"Clinical Psychology", experience:"15 years", rating:4.9, online:true },{ name:"Dr. Mamta Sood", specialty:"Psychiatry", experience:"12 years", rating:4.8, online:true }] },
      { name:"Max Healthcare Saket", address:"1,2, Press Enclave Road, Saket, Delhi-110017", phone:"011-26515050", specialties:["Mental Health","Psychiatry","Counseling"], onlineBooking:true, doctors:[{ name:"Dr. Anjali Gupta", specialty:"Clinical Psychology", experience:"10 years", rating:4.7, online:true },{ name:"Dr. Vikram Singh", specialty:"Psychiatry", experience:"14 years", rating:4.8, online:false }] },
      { name:"Fortis Hospital Shalimar Bagh", address:"A Block, Shalimar Bagh, Delhi-110088", phone:"011-45302222", specialties:["Mental Health","Psychology","Addiction"], onlineBooking:true, doctors:[{ name:"Dr. Priya Sharma", specialty:"Addiction Psychiatry", experience:"11 years", rating:4.6, online:true },{ name:"Dr. Rohan Kapoor", specialty:"Clinical Psychology", experience:"9 years", rating:4.7, online:true }] }
    ],
    helplines:[
      { name:"Delhi State Mental Health Authority", phone:"011-23378881", services:"Mental Health Support" },
      { name:"Samaritans Delhi", phone:"011-23389090", services:"Emotional Support" },
      { name:"Connecting NGO", phone:"9911900044", services:"Youth Mental Health" }
    ],
    onlinePlatforms:[
      { name:"YourDOST", type:"Online Therapy", website:"yourdost.com", rating:4.5 },
      { name:"Mfine", type:"Telemedicine", website:"mfine.co", rating:4.3 },
      { name:"DocsApp", type:"Doctor Consultation", website:"docsapp.in", rating:4.4 }
    ]
  },
  punjab: {
    emergency:[
      { name:"Punjab Mental Health Helpline", phone:"1800-121-4555", type:"24/7 Crisis Support" },
      { name:"PGIMER Chandigarh", phone:"0172-2755253", type:"Medical Emergency" },
      { name:"Bhai Ghanaiya Ji Charitable Trust", phone:"9876543210", type:"Crisis Intervention" }
    ],
    hospitals:[
      { name:"Post Graduate Institute of Medical Education & Research (PGIMER)", address:"Sector 12, Chandigarh-160012", phone:"0172-2755253", specialties:["Psychiatry","Clinical Psychology","Mental Health"], onlineBooking:true, doctors:[{ name:"Dr. Savita Malhotra", specialty:"Child Psychiatry", experience:"18 years", rating:4.9, online:true },{ name:"Dr. Paramjeet Singh", specialty:"Clinical Psychology", experience:"13 years", rating:4.8, online:true }] },
      { name:"Fortis Hospital Mohali", address:"Sector 62, Sahibzada Ajit Singh Nagar, Punjab-160062", phone:"0172-4692222", specialties:["Mental Health","Psychiatry","Counseling"], onlineBooking:true, doctors:[{ name:"Dr. Neha Aggarwal", specialty:"Clinical Psychology", experience:"8 years", rating:4.6, online:false },{ name:"Dr. Gurpreet Singh", specialty:"Psychiatry", experience:"16 years", rating:4.9, online:true }] },
      { name:"Max Super Speciality Hospital Jalandhar", address:"Near Civil Hospital, Jalandhar, Punjab-144001", phone:"0181-6623333", specialties:["Mental Health","Psychology","Addiction Treatment"], onlineBooking:true, doctors:[{ name:"Dr. Rajinder Kaur", specialty:"Clinical Psychology", experience:"12 years", rating:4.7, online:true },{ name:"Dr. Maninder Singh", specialty:"Addiction Psychiatry", experience:"10 years", rating:4.5, online:true }] }
    ],
    helplines:[
      { name:"Punjab State Mental Health Authority", phone:"0172-2740345", services:"Mental Health Support" },
      { name:"Samaritans Punjab", phone:"0172-2704191", services:"Emotional Support" },
      { name:"Youth Line Punjab", phone:"1098", services:"Youth Counseling" }
    ],
    onlinePlatforms:[
      { name:"Practo", type:"Doctor Consultation", website:"practo.com", rating:4.6 },
      { name:"1mg", type:"Telemedicine", website:"1mg.com", rating:4.4 },
      { name:"DocsApp", type:"Online Doctors", website:"docsapp.in", rating:4.3 }
    ]
  }
};

const COUNSELORS = [
  { id:1, name:'Dr. Priya Sharma', role:'Clinical Psychologist', city:'Ludhiana', state:'punjab', online:true, offline:true, specs:['Anxiety','Depression','CBT','Trauma'], rating:4.9, reviews:312, exp:'12 yrs', av:'PS', color:'#8b5cf6', langs:['English','Hindi','Punjabi'] },
  { id:2, name:'Dr. Rajan Mehta', role:'Neurologist', city:'Chandigarh', state:'punjab', online:true, offline:true, specs:['Migraines','Sleep Disorders','ADHD','Memory'], rating:4.8, reviews:198, exp:'15 yrs', av:'RM', color:'#38bdf8', langs:['English','Hindi'] },
  { id:3, name:'Dr. Anita Kapoor', role:'Psychiatrist', city:'Delhi', state:'delhi', online:true, offline:false, specs:['Bipolar','OCD','Panic Attacks','Medication'], rating:4.7, reviews:445, exp:'10 yrs', av:'AK', color:'#10b981', langs:['English','Hindi'] },
  { id:4, name:'Dr. Suresh Nair', role:'Clinical Psychologist', city:'Mumbai', state:'maharashtra', online:true, offline:true, specs:['Grief','Self-Esteem','Mindfulness','Relations'], rating:4.9, reviews:567, exp:'14 yrs', av:'SN', color:'#f59e0b', langs:['English','Hindi','Marathi'] },
  { id:5, name:'Dr. Kavya Reddy', role:'Neuropsychologist', city:'Bangalore', state:'karnataka', online:true, offline:true, specs:['Cognition','ADHD','Stress','Learning'], rating:4.8, reviews:234, exp:'9 yrs', av:'KR', color:'#f43f5e', langs:['English','Telugu','Kannada'] },
  { id:6, name:'Dr. Arjun Bose', role:'Psychotherapist', city:'Kolkata', state:'west bengal', online:true, offline:false, specs:['Phobias','Social Anxiety','PTSD','DBT'], rating:4.6, reviews:189, exp:'8 yrs', av:'AB', color:'#a78bfa', langs:['English','Bengali','Hindi'] },
  { id:7, name:'Dr. Meera Joshi', role:'Child Psychologist', city:'Pune', state:'maharashtra', online:true, offline:true, specs:['Child Anxiety','ADHD','Behavioral Issues'], rating:4.9, reviews:421, exp:'11 yrs', av:'MJ', color:'#ec4899', langs:['English','Marathi','Hindi'] },
  { id:8, name:'Dr. Vikram Singh', role:'Addiction Psychiatrist', city:'Jaipur', state:'rajasthan', online:true, offline:true, specs:['Substance Abuse','De-addiction','PTSD'], rating:4.7, reviews:156, exp:'13 yrs', av:'VS', color:'#2dd4bf', langs:['English','Hindi'] },
  { id:9, name:'Dr. Gurpreet Kaur', role:'Psychologist', city:'Amritsar', state:'punjab', online:true, offline:true, specs:['Confidence','Decision Making','Relationships'], rating:4.8, reviews:203, exp:'11 yrs', av:'GK', color:'#fb923c', langs:['English','Punjabi','Hindi'] },
  { id:10, name:'Dr. Savita Malhotra', role:'Child Psychiatrist', city:'Chandigarh', state:'punjab', online:true, offline:true, specs:['Child Psychiatry','ADHD','Behavioral'], rating:4.9, reviews:317, exp:'18 yrs', av:'SM', color:'#6366f1', langs:['English','Hindi','Punjabi'] },
];

const CRISIS_LINES = [
  { name:'iCall', num:'9152987821', hours:'Mon–Sat 8am–10pm', desc:'Free counseling & mental health support', color:'#8b5cf6' },
  { name:'Vandrevala Foundation', num:'1860-2662-345', hours:'24/7', desc:'Suicide prevention & crisis support', color:'#f43f5e' },
  { name:'NIMHANS', num:'080-46110007', hours:'Mon–Sat 9am–5pm', desc:'National Institute of Mental Health', color:'#10b981' },
  { name:'Snehi', num:'044-24640050', hours:'Daily 8am–10pm', desc:'Emotional support helpline', color:'#f59e0b' },
  { name:'AASRA', num:'9820466627', hours:'24/7', desc:'Crisis intervention & prevention', color:'#a78bfa' },
  { name:'Fortis Stress Helpline', num:'8376804102', hours:'24/7', desc:'Stress & mental health emergency', color:'#38bdf8' },
];

const TOOLS = [
  { icon:'❤', title:'Box Breathing', cat:'Anxiety', time:'5 min', color:'#f43f5e', desc:'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 cycles. Activates your parasympathetic nervous system, lowering heart rate and anxiety within minutes.' },
  { icon:'🧠', title:'Cognitive Reframing', cat:'Depression', time:'10 min', color:'#8b5cf6', desc:'Write a negative thought. Ask: "Is this 100% true? What evidence contradicts it? What would I tell a friend?" Replace it with a balanced perspective.' },
  { icon:'🌙', title:'Sleep Hygiene Protocol', cat:'Sleep', time:'Daily', color:'#2dd4bf', desc:'Same bedtime nightly. No screens 1 hr before bed. Keep room at 18–20°C. Write tomorrow\'s to-do list to clear your mind before sleeping.' },
  { icon:'⚓', title:'5-4-3-2-1 Grounding', cat:'Panic', time:'3 min', color:'#f59e0b', desc:'Name 5 things you see → 4 you can touch → 3 you hear → 2 you smell → 1 you taste. Instantly anchors you to the present, breaking the panic cycle.' },
  { icon:'🌿', title:'Mindful Body Scan', cat:'Stress', time:'15 min', color:'#10b981', desc:'Lie down. Slowly move attention from toes to head, noticing sensations without judgment. Release tension with each exhale. Reset your nervous system.' },
  { icon:'📅', title:'Worry Time Technique', cat:'Anxiety', time:'20 min', color:'#38bdf8', desc:'Schedule 20 minutes daily as "worry time". When anxious thoughts arise outside this slot, gently postpone them. This trains your brain to contain worry.' },
];

const FAQS = [
  { q:'How do I know if I need professional help?', a:'If symptoms have lasted 2+ weeks, are affecting your daily life or relationships, or if you feel unsafe — please consult a professional. Our AI can help you assess your situation first.' },
  { q:'Is MindEase AI a replacement for therapy?', a:'No. MindEase AI is a supportive tool for psychoeducation, coping strategies, and guidance — not a substitute for professional diagnosis or therapy. Think of it as a knowledgeable, empathetic companion.' },
  { q:'Are online therapy sessions as effective as in-person?', a:'Research shows online therapy is equally effective for most conditions including anxiety, depression, and PTSD. It also offers greater accessibility, privacy, and scheduling flexibility.' },
  { q:'What if I am in immediate crisis?', a:'Call iCall (9152987821) or Vandrevala Foundation (1860-2662-345) immediately. These are free, confidential helplines available right now. If you\'re in danger, call 112.' },
  { q:'How much does therapy cost in India?', a:'Government hospitals like NIMHANS and PGIMER offer subsidized or free services. Many NGOs provide free mental health support. Online platforms offer affordable options starting from ₹300/session.' },
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <span key={i} className="text-xs" style={{ color: i <= Math.floor(rating) ? '#fbbf24' : '#374151' }}>★</span>
    ))}
    <span className="text-xs ml-1 font-medium" style={{ color:'var(--text-muted)' }}>({rating})</span>
  </div>
);

export default function HelpPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('resources');
  const [selectedStates, setSelectedStates] = useState(['punjab']);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('');
  const [faq, setFaq] = useState(null);
  const [booking, setBooking] = useState(null);
  const [hospitalBooking, setHospitalBooking] = useState(null);

  const toggleState = (s) => {
    const key = s.toLowerCase();
    setSelectedStates(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const filteredCounselors = COUNSELORS.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.specs.some(x => x.toLowerCase().includes(q)) || c.role.toLowerCase().includes(q);
    const matchMode = modeFilter === 'All' || (modeFilter === 'Online' ? c.online : c.offline);
    const matchLang = !langFilter || c.langs.some(l => l.toLowerCase().includes(langFilter.toLowerCase()));
    return matchSearch && matchMode && matchLang;
  });

  const activeResources = selectedStates.map(s => mentalHealthResources[s]).filter(Boolean);
  const mergedEmergency = activeResources.flatMap(r => r.emergency || []);
  const mergedHospitals = activeResources.flatMap(r => r.hospitals || []);
  const mergedHelplines = activeResources.flatMap(r => r.helplines || []);
  const mergedPlatforms = activeResources.flatMap(r => r.onlinePlatforms || []);

  const tabs = [
    { id:'resources', label:'🏥 Find Help' },
    { id:'specialists', label:'👨‍⚕️ Specialists' },
    { id:'crisis', label:'🆘 Crisis Help' },
    { id:'tools', label:'🌿 Self-Help' },
    { id:'faq', label:'❓ FAQ' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative" style={{ background:'var(--bg-primary)' }}>
      <div className="orb orb-2" /><div className="orb orb-3" />
      <div className="max-w-6xl mx-auto relative z-10">

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <div className="badge badge-rose mx-auto mb-4">❤ Support & Resources</div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Find Help & Support</h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color:'var(--text-secondary)' }}>
            Verified specialists, hospitals, crisis lines, and self-help techniques across India. You don't have to face this alone.
          </p>
        </motion.div>

        <div className="flex gap-1.5 mb-6 p-1.5 rounded-2xl overflow-x-auto" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={{ background: tab === t.id ? 'linear-gradient(135deg, #14b8a6, #8b5cf6)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-secondary)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'resources' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-6">
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-white mb-4">🌍 Select Your State</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {indianStates.map(state => {
                  const key = state.toLowerCase();
                  const isSelected = selectedStates.includes(key);
                  return (
                    <motion.button key={state} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                      onClick={() => toggleState(state)}
                      className="relative px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-center"
                      style={{ background: isSelected ? 'linear-gradient(135deg,#8b5cf6,#38bdf8)' : 'rgba(255,255,255,0.03)', border:`1px solid ${isSelected ? '#8b5cf6' : 'var(--border)'}`, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                      {state}
                      {isSelected && (
                        <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white"
                          style={{ fontSize:'9px' }}>✓</motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {selectedStates.length > 0 && !activeResources.length && (
                <p className="text-center text-sm mt-4" style={{ color:'var(--text-muted)' }}>
                  Detailed resources available for Delhi & Punjab. Use national crisis lines below for other states.
                </p>
              )}
            </div>

            {mergedEmergency.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="rounded-2xl p-6" style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)' }}>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2" style={{ color:'#fb7185' }}>🚨 Emergency Contacts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mergedEmergency.map((contact, i) => (
                    <motion.div key={i} whileHover={{ scale:1.02 }}
                      className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(244,63,94,0.2)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(244,63,94,0.15)' }}>📞</div>
                        <div>
                          <p className="font-semibold text-white text-sm">{contact.name}</p>
                          <p className="text-xs" style={{ color:'var(--text-muted)' }}>{contact.type}</p>
                        </div>
                      </div>
                      <a href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                        style={{ background:'linear-gradient(135deg,#f43f5e,#fb7185)' }}>
                        📞 {contact.phone}
                      </a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {mergedHospitals.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="card p-6">
                <h2 className="font-display text-xl font-bold text-white mb-5">🏥 Mental Health Hospitals & Clinics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mergedHospitals.map((hospital, i) => (
                    <motion.div key={i} whileHover={{ y:-2 }}
                      className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
                      <h3 className="font-semibold text-white mb-1">{hospital.name}</h3>
                      <p className="text-xs mb-3 flex items-start gap-1.5" style={{ color:'var(--text-muted)' }}>
                        <span className="mt-0.5">📍</span>{hospital.address}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hospital.specialties.map(sp => (
                          <span key={sp} className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(139,92,246,0.15)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.3)' }}>{sp}</span>
                        ))}
                      </div>
                      {hospital.doctors && (
                        <div className="mb-3 space-y-2">
                          <p className="text-xs font-semibold" style={{ color:'var(--text-secondary)' }}>Available Doctors:</p>
                          {hospital.doctors.map((doc, di) => (
                            <div key={di} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.04)' }}>
                              <div>
                                <p className="text-sm font-medium text-white">{doc.name}</p>
                                <p className="text-xs" style={{ color:'var(--text-muted)' }}>{doc.specialty} · {doc.experience}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.online && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:'rgba(16,185,129,0.15)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)' }}>🟢 Online</span>
                                )}
                                <span className="text-xs font-bold" style={{ color:'#fbbf24' }}>★ {doc.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <a href={`tel:${hospital.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                          style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                          📞 Call Now
                        </a>
                        {hospital.onlineBooking && (
                          <button onClick={() => setHospitalBooking(hospital)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background:'linear-gradient(135deg,#10b981,#14b8a6)' }}>
                            📅 Book Online
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {mergedHelplines.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                className="rounded-2xl p-6" style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)' }}>
                <h2 className="font-display text-xl font-bold mb-4" style={{ color:'#60a5fa' }}>📞 Mental Health Helplines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mergedHelplines.map((h, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(59,130,246,0.15)' }}>
                      <p className="font-semibold text-white text-sm">{h.name}</p>
                      <p className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>{h.services}</p>
                      <a href={`tel:${h.phone}`} className="font-bold text-base hover:opacity-80 transition-opacity" style={{ color:'#60a5fa' }}>{h.phone}</a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {mergedPlatforms.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                className="rounded-2xl p-6" style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <h2 className="font-display text-xl font-bold mb-4" style={{ color:'#34d399' }}>💻 Online Therapy Platforms</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {mergedPlatforms.map((p, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(16,185,129,0.15)' }}>
                      <p className="font-semibold text-white text-sm">{p.name}</p>
                      <p className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>{p.type}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color:'#fbbf24' }}>★ {p.rating}/5</span>
                        <a href={`https://${p.website}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold hover:opacity-80" style={{ color:'#34d399' }}>Visit →</a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedStates.length > 0 && !activeResources.length && (
              <div className="card p-6">
                <p className="text-sm mb-4 text-center" style={{ color:'var(--text-secondary)' }}>National crisis helplines — available across all states:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CRISIS_LINES.slice(0,4).map((cl, i) => (
                    <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:cl.color+'15' }}>📞</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{cl.name}</p>
                        <a href={`tel:${cl.num.replace(/-/g,'')}`} className="text-base font-bold hover:opacity-80" style={{ color:cl.color }}>{cl.num}</a>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button onClick={() => setTab('specialists')} className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2">
                    <span>👨‍⚕️ Browse Online Specialists</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'specialists' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-44">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'var(--text-muted)' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialty, or role..."
                  className="input-dark pl-9 py-2.5 w-full" style={{ fontSize:'13px' }} />
              </div>
              <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} className="input-dark py-2.5 cursor-pointer" style={{ fontSize:'13px' }}>
                {['All','Online','In-Person'].map(o => <option key={o} style={{ background:'var(--bg-card)' }}>{o}</option>)}
              </select>
              <select value={langFilter} onChange={e => setLangFilter(e.target.value)} className="input-dark py-2.5 cursor-pointer" style={{ fontSize:'13px' }}>
                <option value="" style={{ background:'var(--bg-card)' }}>All Languages</option>
                {['English','Hindi','Punjabi','Marathi','Bengali','Telugu','Kannada'].map(l => (
                  <option key={l} style={{ background:'var(--bg-card)' }}>{l}</option>
                ))}
              </select>
              <span className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>{filteredCounselors.length} found</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCounselors.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  whileHover={{ y:-3 }} className="card p-5">
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${s.color},${s.color}88)` }}>{s.av}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{s.name}</div>
                      <div className="text-xs font-semibold mt-0.5" style={{ color:s.color }}>{s.role}</div>
                      <StarRating rating={s.rating} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.specs.slice(0,3).map(sp => (
                      <span key={sp} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ color:s.color, background:s.color+'15', border:`1px solid ${s.color}30` }}>{sp}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-3 text-xs" style={{ color:'var(--text-muted)' }}>
                    <span>📍 {s.city}</span>
                    <div className="flex gap-1.5">
                      {s.online && <span className="badge badge-emerald text-xs">🟢 Online</span>}
                      {s.offline && <span className="badge badge-amber text-xs">🏥 In-Person</span>}
                    </div>
                  </div>
                  <div className="text-xs mb-4 flex items-center gap-3" style={{ color:'var(--text-muted)' }}>
                    <span>⏱ {s.exp}</span>
                    <span>🌐 {s.langs.slice(0,2).join(', ')}</span>
                  </div>
                  <div className="flex gap-2">
                    {s.online && (
                      <button onClick={() => setBooking({ s, mode:'online' })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                        style={{ background:`linear-gradient(135deg,${s.color},${s.color}cc)` }}>
                        📹 Book Online
                      </button>
                    )}
                    {s.offline && (
                      <button onClick={() => setBooking({ s, mode:'offline' })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                        style={{ border:`1px solid ${s.color}40`, color:s.color, background:'transparent' }}>
                        🏥 In-Person
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredCounselors.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-white">No specialists found</p>
                <p className="text-sm mt-1" style={{ color:'var(--text-muted)' }}>Try adjusting your filters</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'crisis' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
            <div className="rounded-2xl p-5 flex gap-4" style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)' }}>
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">In immediate danger?</h3>
                <p className="text-sm mb-3" style={{ color:'var(--text-secondary)' }}>If you or someone you know is at immediate risk, call emergency services right now.</p>
                <a href="tel:112" className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2"><span>📞 Call 112 — Emergency</span></a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRISIS_LINES.map((cl, i) => (
                <motion.div key={cl.name} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background:cl.color+'15' }}>📞</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{cl.name}</div>
                      <div className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>{cl.desc}</div>
                      <a href={`tel:${cl.num.replace(/-/g,'')}`} className="text-xl font-bold font-mono hover:opacity-80 transition-opacity" style={{ color:cl.color }}>{cl.num}</a>
                      <div className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>⏰ {cl.hours}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="card p-6 text-center">
              <p className="text-sm mb-3" style={{ color:'var(--text-secondary)' }}>Not in crisis but want to talk right now? Our AI is available instantly.</p>
              <button onClick={() => navigate('/chat')} className="btn-primary px-6 py-3 text-sm"><span>💬 Talk to MindEase AI</span></button>
            </div>
          </motion.div>
        )}

        {tab === 'tools' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLS.map((t, i) => (
              <motion.div key={t.title} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background:t.color+'15' }}>{t.icon}</div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.title}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="badge text-xs" style={{ color:t.color, background:t.color+'15', border:`1px solid ${t.color}30` }}>{t.cat}</span>
                      <span className="text-xs" style={{ color:'var(--text-muted)' }}>⏱ {t.time}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-secondary)' }}>{t.desc}</p>
                <button onClick={() => navigate('/chat')} className="mt-3 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80" style={{ color:t.color }}>
                  Practice with AI Guide →
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'faq' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-3">
            {FAQS.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className="card overflow-hidden">
                <button onClick={() => setFaq(faq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/02 transition-colors">
                  <span className="font-semibold text-white text-sm pr-4">{f.q}</span>
                  <span className="text-sm flex-shrink-0" style={{ color:'var(--text-muted)' }}>{faq === i ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {faq === i && (
                    <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color:'var(--text-secondary)', borderTop:'1px solid var(--border)' }}>
                        <div className="pt-3">{f.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center">
          <div className="credit-badge mx-auto w-fit"><span>❤</span><span>Built by <strong>Devansh Gupta</strong> & Team</span></div>
        </div>
      </div>

      <AnimatePresence>
        {booking && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
            onClick={() => setBooking(null)}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              className="w-full max-w-sm p-7 rounded-3xl" style={{ background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">{booking.mode === 'online' ? '📹' : '🏥'}</div>
                <h3 className="font-display text-xl font-bold text-white">Book Session</h3>
                <p className="text-sm mt-1" style={{ color:'var(--text-secondary)' }}>with {booking.s.name}</p>
              </div>
              <div className="rounded-xl p-4 mb-4 space-y-2.5 text-sm" style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
                {[['Role',booking.s.role],['Mode', booking.mode === 'online' ? '🟢 Video Call (Online)' : `🏥 In-Person – ${booking.s.city}`],['Experience',booking.s.exp],['Languages',booking.s.langs.join(', ')]].map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span className="font-medium text-white">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center mb-4" style={{ color:'var(--text-muted)' }}>Demo mode — real booking integration coming soon.</p>
              <div className="flex gap-3">
                <button onClick={() => setBooking(null)} className="btn-ghost flex-1 text-sm py-2.5">Cancel</button>
                <button onClick={() => setBooking(null)} className="flex-1 py-2.5 px-6 rounded-xl text-sm font-semibold text-white"
                  style={{ background:`linear-gradient(135deg,${booking.s.color},${booking.s.color}cc)` }}>Confirm ✓</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hospitalBooking && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
            onClick={() => setHospitalBooking(null)}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              className="w-full max-w-sm p-7 rounded-3xl" style={{ background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">🏥</div>
                <h3 className="font-display text-xl font-bold text-white">{hospitalBooking.name}</h3>
                <p className="text-sm mt-1" style={{ color:'var(--text-secondary)' }}>Book an appointment</p>
              </div>
              <div className="rounded-xl p-4 mb-4 space-y-2.5 text-sm" style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
                <div className="flex gap-2"><span style={{ color:'var(--text-muted)' }}>Address:</span><span className="font-medium text-white text-xs">{hospitalBooking.address}</span></div>
                <div className="flex gap-2"><span style={{ color:'var(--text-muted)' }}>Phone:</span><a href={`tel:${hospitalBooking.phone}`} className="font-bold" style={{ color:'#60a5fa' }}>{hospitalBooking.phone}</a></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setHospitalBooking(null)} className="btn-ghost flex-1 text-sm py-2.5">Close</button>
                <a href={`tel:${hospitalBooking.phone}`} className="flex-1 py-2.5 px-6 rounded-xl text-sm font-semibold text-white text-center"
                  style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>📞 Call Now</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
