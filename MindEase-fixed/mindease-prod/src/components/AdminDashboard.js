import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaChartLine, FaDownload, FaSearch, FaTrash, FaEdit,
  FaPlus, FaEye, FaTimes, FaCheck, FaBan, FaUndo, FaSort,
  FaSortUp, FaSortDown, FaSync, FaFileExport, FaHeartbeat, FaBrain
} from 'react-icons/fa';
import { adminService } from '../services/firebaseService';
import { db, isFirebaseConfigured } from '../services/firebase.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const ISSUE_COLORS = {
  stress: '#8b5cf6', depression: '#38bdf8', confidence: '#10b981',
  emotional: '#f59e0b', decision: '#a78bfa', social: '#f43f5e',
  sleep: '#2dd4bf', behavioral: '#fb923c', digital: '#e879f9'
};
const ISSUE_ICONS = {
  stress: '🧠', depression: '🌧', confidence: '💪', emotional: '🎭',
  decision: '🧩', social: '🤝', sleep: '🌙', behavioral: '🏃', digital: '📱'
};

/* ─── sub-components ─────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, sub }) => (
  <motion.div whileHover={{ translateY: -4, scale: 1.01 }}
    className="stat-card flex flex-col gap-3 relative overflow-hidden"
    style={{ borderColor: `${color}22` }}>
    <div className="absolute inset-0 rounded-2xl opacity-5"
      style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg relative z-10"
      style={{ background: `${color}18`, color }}>
      {icon}
    </div>
    <div className="relative z-10">
      <div className="text-2xl font-bold font-display text-white">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </div>
  </motion.div>
);

const Badge = ({ status }) => {
  const map = {
    active:    { cls: 'badge-emerald', text: 'Active' },
    inactive:  { cls: 'badge-rose',    text: 'Inactive' },
    suspended: { cls: 'badge-amber',   text: 'Suspended' },
    admin:     { cls: 'badge-violet',  text: 'Admin' },
    user:      { cls: 'badge-teal',    text: 'User' },
    moderator: { cls: 'badge-amber',   text: 'Moderator' },
  };
  const b = map[status] || { cls: 'badge-teal', text: status || 'Unknown' };
  return <span className={`badge ${b.cls} text-xs`}>{b.text}</span>;
};

const RiskBadge = ({ score }) => {
  if (score == null) return <span className="badge badge-teal text-xs">N/A</span>;
  if (score < 33) return <span className="badge badge-emerald text-xs">Low</span>;
  if (score < 66) return <span className="badge badge-amber text-xs">Moderate</span>;
  return <span className="badge badge-rose text-xs">High</span>;
};

const Spinner = () => (
  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    className="w-4 h-4 border-2 rounded-full inline-block"
    style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
);

const Modal = ({ show, onClose, title, children, wide }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
          className={`card p-6 w-full relative ${wide ? 'max-w-2xl' : 'max-w-md'}`}
          style={{ border: '1px solid rgba(139,92,246,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}>
              <FaTimes />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ConfirmModal = ({ show, onClose, onConfirm, title, message, danger }) => (
  <Modal show={show} onClose={onClose} title={title || 'Confirm Action'}>
    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-ghost text-sm px-4 py-2" onClick={onClose}>Cancel</button>
      <button className={danger ? 'btn-danger text-sm px-4 py-2' : 'btn-primary text-sm px-4 py-2'} onClick={onConfirm}>
        Confirm
      </button>
    </div>
  </Modal>
);

/* ─── demo data ──────────────────────────────────────────────────── */
function genDemoUsers(n = 20) {
  const names = ['Aryan Sharma','Priya Singh','Rahul Verma','Ananya Patel','Vikram Nair','Meera Joshi','Kabir Das','Nisha Gupta','Aditya Kumar','Riya Malhotra','Siddharth Rao','Divya Reddy','Akash Iyer','Pooja Shah','Nikhil Mehta','Shreya Tiwari','Rohan Chauhan','Kavya Nair','Harsh Kapoor','Isha Srivastava'];
  return Array.from({ length: n }, (_, i) => {
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    return {
      _id: `demo_${i + 1}`,
      name: names[i % names.length],
      email: `${names[i % names.length].split(' ')[0].toLowerCase()}${i + 1}@example.com`,
      role: i === 0 ? 'admin' : 'user',
      isActive: Math.random() > 0.15,
      createdAt,
      lastLogin: Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
    };
  });
}

function genDemoAnalytics() {
  return {
    totalUsers: 24, totalAssessments: 87, averageRiskScore: 42, onlineUsers: 0,
    issueBreakdown: { stress: 18, depression: 12, anxiety: 16, sleep: 10, social: 8, behavioral: 9, emotional: 7, decision: 4, digital: 3 },
    riskLevelBreakdown: { Low: 35, Moderate: 38, High: 14 },
    recentAssessments: [
      { userName: 'Aryan Sharma', type: 'stress', wellnessIndex: 72, testDate: new Date() },
      { userName: 'Priya Singh', type: 'depression', wellnessIndex: 45, testDate: new Date(Date.now() - 3600000) },
      { userName: 'Rahul Verma', type: 'sleep', wellnessIndex: 28, testDate: new Date(Date.now() - 7200000) },
    ],
    userStats: [
      { name: 'Aryan Sharma', email: 'aryan@ex.com', totalAssessments: 5, averageScore: 68, lastAssessment: new Date() },
      { name: 'Priya Singh', email: 'priya@ex.com', totalAssessments: 3, averageScore: 45, lastAssessment: new Date() },
    ],
    recentAssessmentsCount: 7,
  };
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const TABS = [
    { id: 'overview',    icon: '📊', label: 'Overview' },
    { id: 'users',       icon: '👥', label: 'Users' },
    { id: 'assessments', icon: '📋', label: 'Assessments' },
    { id: 'groups',      icon: '🤝', label: 'Groups' },
    { id: 'chats',       icon: '💬', label: 'Chats' },
    { id: 'analytics',   icon: '📈', label: 'Analytics' },
  ];

  const [activeTab, setActiveTab]           = useState('overview');
  const [analytics, setAnalytics]           = useState(genDemoAnalytics());
  const [allUsers, setAllUsers]             = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [groups, setGroups]                 = useState([]);
  const [chats, setChats]                 = useState([]);
  const [firestoreUsers, setFirestoreUsers] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  // filters / sort / pagination
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey]           = useState('createdAt');
  const [sortDir, setSortDir]           = useState('desc');
  const [currentPage, setCurrentPage]   = useState(1);
  const PER_PAGE = 15;

  // modals
  const [showAdd, setShowAdd]           = useState(false);
  const [showEdit, setShowEdit]         = useState(false);
  const [showView, setShowView]         = useState(false);
  const [confirm, setConfirm]           = useState({ show: false });

  // form
  const [editTarget, setEditTarget]         = useState(null);
  const [viewTarget, setViewTarget]         = useState(null);
  const [userAssessments, setUserAssessments] = useState([]);
  const [form, setForm]                     = useState({ name: '', email: '', password: '', role: 'user', isActive: true });
  const [formErrors, setFormErrors]         = useState({});
  const [formLoading, setFormLoading]       = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* fetch */
  const fetchAll = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const { data, error } = await adminService.fetchAll();
      if (error) {
        console.error('Admin fetch error:', error);
        return;
      }
      
      if (data.analytics) setAnalytics(data.analytics);
      if (data.users) setAllUsers(data.users);
      if (data.assessments) setAllAssessments(data.assessments);
      if (data.groups) setGroups(data.groups);
    } catch (error) {
      console.error('fetchAll error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Firestore real-time users listener
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        _id: doc.id,
        ...doc.data()
      }));
      setFirestoreUsers(userList);
    }, (error) => {
      console.error("Firestore listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Seed demo users immediately so dashboard shows content
    if (!isFirebaseConfigured) {
      setAllUsers(genDemoUsers(20));
    }
    fetchAll();
  }, [fetchAll]);

  /* CRUD */
  const handleCreate = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const result = await adminService.addUser(form);
      if (result.error) {
        setFormErrors({ server: result.error });
        return;
      }
      setAllUsers(p => [result.data, ...p]);
      setAnalytics(p => ({ ...p, totalUsers: (p.totalUsers || 0) + 1 }));
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'user', isActive: true });
      showToast('User created successfully ✓');
    } catch (error) {
      console.error('Create user error:', error);
      const demo = { _id: `demo_${Date.now()}`, name: form.name, email: form.email, role: form.role, isActive: true, createdAt: new Date(), lastLogin: null };
      setAllUsers(p => [demo, ...p]);
      setAnalytics(p => ({ ...p, totalUsers: (p.totalUsers || 0) + 1 }));
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'user', isActive: true });
      showToast('User created (demo mode) ✓');
    }
    setFormLoading(false);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const updates = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
      const { data, error } = await adminService.updateUser(editTarget._id, updates);
      if (error) {
        showToast('Failed to update user', 'error');
        return;
      }
      setAllUsers(p => p.map(u => u._id === editTarget._id ? { ...u, ...data } : u));
      showToast('User updated ✓');
    } catch (error) {
      console.error('Update user error:', error);
      setAllUsers(p => p.map(u => u._id === editTarget._id ? { ...u, name: form.name, email: form.email, role: form.role, isActive: form.isActive } : u));
      showToast('User updated (demo mode) ✓');
    }
    setShowEdit(false);
    setEditTarget(null);
    setFormLoading(false);
  };

  const handleDelete = async (userId) => {
    try {
      const { error } = await adminService.deleteUser(userId);
      if (error) throw new Error(error.message);
      setAllUsers(p => p.filter(u => u._id !== userId));
      setAnalytics(p => ({ ...p, totalUsers: Math.max(0, (p.totalUsers || 0) - 1) }));
      showToast('User deleted', 'error');
    } catch (error) {
      console.error('Delete user error:', error);
      setAllUsers(p => p.filter(u => u._id !== userId));
      showToast('User deleted (demo mode)', 'error');
    }
  };

  const handleToggle = async (user) => {
    const next = !(user.isActive !== false);
    try {
      const { error } = await adminService.updateUser(user._id, { isActive: next });
      if (error) throw new Error(error.message);
      setAllUsers(p => p.map(u => u._id === user._id ? { ...u, isActive: next } : u));
      showToast(next ? 'User activated ✓' : 'User deactivated');
    } catch (error) {
      console.error('Toggle user error:', error);
      setAllUsers(p => p.map(u => u._id === user._id ? { ...u, isActive: next } : u));
      showToast(next ? 'User activated (demo)' : 'User deactivated (demo)');
    }
  };

  const handleDelAssessment = async (id) => {
    try {
      const { error } = await adminService.deleteAssessment(id);
      if (error) throw new Error(error.message);
      setAllAssessments(p => p.filter(a => (a._id || a.id) !== id));
      showToast('Assessment deleted', 'error');
    } catch (error) {
      console.error('Delete assessment error:', error);
      setAllAssessments(p => p.filter(a => (a._id || a.id) !== id));
      showToast('Assessment deleted (demo)', 'error');
    }
  };

  const openView = async (user) => {
    setViewTarget(user); setUserAssessments([]); setShowView(true);
    try {
      const { data, error } = await adminService.getUserAssessments(user._id);
      if (error) {
        console.error('Get assessments error:', error);
        return;
      }
      setUserAssessments(data || []);
    } catch (error) {
      console.error('Get assessments error:', error);
    }
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setForm({ name: user.name, email: user.email, role: user.role || 'user', password: '', isActive: user.isActive !== false });
    setFormErrors({});
    setShowEdit(true);
  };

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'user', isActive: true });
    setFormErrors({});
    setShowAdd(true);
  };

  const doConfirm = (title, message, action, danger = false) =>
    setConfirm({ show: true, title, message, action, danger });

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => k !== 'passwordHash');
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: filename });
    a.click();
    showToast('CSV exported ✓');
  };

  /* filter / sort / paginate */
  const processed = React.useMemo(() => {
    // Prefer Firestore users if available, fallback to service/demo
    let list = firestoreUsers.length > 0 ? [...firestoreUsers] : [...allUsers];
    
    if (searchTerm) list = list.filter(u => (u.email || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterRole !== 'all') list = list.filter(u => u.role === filterRole);
    if (filterStatus === 'active') list = list.filter(u => (u.isActive !== false && !('isActive' in u) /* default active */));
    else if (filterStatus === 'inactive') list = list.filter(u => u.isActive === false);
    list.sort((a, b) => {
      let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
      if (['createdAt', 'lastLogin'].includes(sortKey)) { 
        va = va ? +new Date(va) : 0; 
        vb = vb ? +new Date(vb) : 0; 
      }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return list;
  }, [firestoreUsers, allUsers, searchTerm, filterRole, filterStatus, sortKey, sortDir]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterRole, filterStatus, sortKey, sortDir]);
  const totalPages = Math.ceil(processed.length / PER_PAGE);
  const paged = processed.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSort = k => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };
  const SortIcon = ({ k }) => sortKey !== k ? <FaSort className="opacity-25 ml-1" /> : sortDir === 'asc' ? <FaSortUp className="ml-1" style={{ color: 'var(--cyan)' }} /> : <FaSortDown className="ml-1" style={{ color: 'var(--cyan)' }} />;

  /* form field helper */
  const Field = ({ id, label, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {label.toUpperCase()}
      </label>
      <input type={type} value={form[id] || ''} placeholder={placeholder} className="input-dark"
        onChange={e => { setForm(p => ({ ...p, [id]: e.target.value })); setFormErrors(p => ({ ...p, [id]: '' })); }} />
      {formErrors[id] && <p className="text-xs mt-1" style={{ color: 'var(--rose)' }}>{formErrors[id]}</p>}
    </div>
  );

  /* ── loading screen ── */
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full border-4" style={{ borderColor: 'var(--violet)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading Admin Panel…</p>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -30, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-none"
            style={{ background: toast.type === 'error' ? 'var(--rose)' : 'var(--emerald)', color: '#fff', zIndex: 9999 }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-screen-xl mx-auto px-4 pt-24 pb-16 relative z-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">⚙ Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              MindEase Control Centre · {firestoreUsers.length > 0 ? firestoreUsers.length : allUsers.length} users · {allAssessments.length} assessments
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex items-center gap-2 text-sm px-4 py-2" onClick={() => fetchAll(true)} disabled={refreshing}>
              <FaSync className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2" onClick={openAdd}>
              <FaPlus /><span>Add User</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1.5 rounded-2xl mb-8 overflow-x-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={activeTab === t.id
                ? { background: 'linear-gradient(135deg, var(--teal-dim), var(--violet))', color: '#fff', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }
                : { color: 'var(--text-secondary)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={<FaUsers />}            label="Total Users"      value={analytics.totalUsers}       color="var(--violet)" />
              <StatCard icon="🟢"                    label="Online Now"       value={analytics.onlineUsers || 0}  color="var(--emerald)" />
              <StatCard icon={<FaHeartbeat />}        label="Assessments"      value={analytics.totalAssessments}  color="var(--cyan)" />
              <StatCard icon={<FaChartLine />}        label="Avg Risk Score"   value={`${analytics.averageRiskScore}%`} color="var(--amber)" />
              <StatCard icon="⚠"                     label="High Risk"        value={analytics.riskLevelBreakdown?.High || 0}  color="var(--rose)" />
              <StatCard icon={<FaBrain />}            label="Today"            value={analytics.recentAssessmentsCount || 0}    color="var(--sky)" />
            </div>

            {/* Issue Breakdown */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Issue Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(analytics.issueBreakdown || {}).map(([key, count]) => (
                  <div key={key} className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: `${ISSUE_COLORS[key] || '#8b5cf6'}12`, border: `1px solid ${ISSUE_COLORS[key] || '#8b5cf6'}25` }}>
                    <span className="text-xl">{ISSUE_ICONS[key] || '🧠'}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{count}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{key}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Assessments */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white">Recent Assessments</h3>
                <button className="text-xs" style={{ color: 'var(--cyan)' }} onClick={() => setActiveTab('assessments')}>View all →</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {['User', 'Type', 'Risk', 'Date'].map(h => <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(analytics.recentAssessments || []).slice(0, 6).map((a, i) => (
                    <tr key={i} className="hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2.5 px-2 text-white">{a.userName || a.userId?.name || 'User'}</td>
                      <td className="py-2.5 px-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{a.type || a.category || '—'}</td>
                      <td className="py-2.5 px-2"><RiskBadge score={a.wellnessIndex ?? a.score} /></td>
                      <td className="py-2.5 px-2 text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(a.date || a.testDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card p-5 flex items-center gap-4 hover:border-violet-500/40 transition-colors text-left" onClick={openAdd}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet)' }}><FaPlus /></div>
                <div><div className="font-semibold text-white">Add User</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Create a new user account</div></div>
              </button>
              <button className="card p-5 flex items-center gap-4 hover:border-teal-500/40 transition-colors text-left" onClick={() => exportCSV(allUsers, 'users.csv')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--cyan)' }}><FaDownload /></div>
                <div><div className="font-semibold text-white">Export Users</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Download CSV file</div></div>
              </button>
              <button className="card p-5 flex items-center gap-4 hover:border-amber-500/40 transition-colors text-left" onClick={() => fetchAll(true)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}><FaSync /></div>
                <div><div className="font-semibold text-white">Refresh Data</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sync with backend</div></div>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search name or email…" className="input-dark pl-9 py-2.5 text-sm" />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-dark py-2.5 text-sm w-36">
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-dark py-2.5 text-sm w-36">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="btn-ghost flex items-center gap-2 text-sm px-4 py-2.5" onClick={() => exportCSV(processed, 'users.csv')}>
                <FaFileExport /> CSV
              </button>
              <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5" onClick={openAdd}>
                <FaPlus /> Add User
              </button>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {[['name', 'User'], ['role', 'Role'], ['isActive', 'Status'], ['lastLogin', 'Last Login'], ['createdAt', 'Joined']].map(([k, label]) => (
                      <th key={k} className="text-left py-3 px-4 font-medium cursor-pointer select-none"
                        style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort(k)}>
                        <span className="flex items-center">{label}<SortIcon k={k} /></span>
                      </th>
                    ))}
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(user => (
                    <motion.tr key={user._id} layout
                      className="hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4 cursor-pointer" onClick={() => openView(user)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--teal-dim), var(--violet))' }}>
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-white leading-tight">{user.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge status={user.role || 'user'} /></td>
                      <td className="py-3 px-4"><Badge status={user.isActive !== false ? 'active' : 'inactive'} /></td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(user.lastLogin)}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button title="View" onClick={() => openView(user)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-teal-500/20 text-cyan-400 transition-colors">
                            <FaEye className="text-xs" />
                          </button>
                          <button title="Edit" onClick={() => openEdit(user)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-500/20 text-violet-400 transition-colors">
                            <FaEdit className="text-xs" />
                          </button>
                          <button title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                            onClick={() => doConfirm(
                              user.isActive !== false ? 'Deactivate User' : 'Activate User',
                              `${user.isActive !== false ? 'Deactivate' : 'Activate'} account for ${user.name}?`,
                              () => handleToggle(user)
                            )}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 text-amber-400 transition-colors">
                            {user.isActive !== false ? <FaBan className="text-xs" /> : <FaUndo className="text-xs" />}
                          </button>
                          <button title="Delete"
                            onClick={() => doConfirm('Delete User', `Permanently delete ${user.name} and all their data?`, () => handleDelete(user._id), true)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-400 transition-colors">
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {!paged.length && (
                    <tr><td colSpan={6} className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>No users match your search</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>
                  {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, processed.length)} of {processed.length} users
                </span>
                <div className="flex gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">←</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page = totalPages > 7 && currentPage > 4 ? currentPage - 3 + i : i + 1;
                    if (page < 1 || page > totalPages) return null;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={page === currentPage ? { background: 'var(--violet)', color: '#fff' } : { color: 'var(--text-secondary)' }}>
                        {page}
                      </button>
                    );
                  })}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">→</button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ASSESSMENTS ── */}
        {activeTab === 'assessments' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <button className="btn-ghost flex items-center gap-2 text-sm px-4 py-2.5" onClick={() => exportCSV(allAssessments, 'assessments.csv')}>
                <FaFileExport /> Export CSV
              </button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['User', 'Category', 'Score', 'Risk Level', 'Date', ''].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allAssessments.slice(0, 100).map((a, i) => (
                    <tr key={a._id || i} className="hover:bg-white/[0.03]" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4 text-white">{a.userId?.name || a.userName || '—'}</td>
                      <td className="py-3 px-4 capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {ISSUE_ICONS[a.category] || '🧠'} {a.categoryName || a.category || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{a.wellnessIndex ?? a.score ?? '—'}</td>
                      <td className="py-3 px-4"><RiskBadge score={a.wellnessIndex ?? a.score} /></td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{fmtTime(a.testDate || a.date)}</td>
                      <td className="py-3 px-4">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-400 transition-colors"
                          onClick={() => doConfirm('Delete Assessment', 'Delete this record permanently?', () => handleDelAssessment(a._id || a.id), true)}>
                          <FaTrash className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!allAssessments.length && (
                    <tr><td colSpan={6} className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>No assessments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── GROUPS ── */}
        {activeTab === 'groups' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {groups.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups.map(g => (
                  <div key={g._id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-white">{g.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.members?.length || 0} members</div>
                      </div>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-400 transition-colors"
                        onClick={() => doConfirm('Delete Group', `Delete "${g.name}"?`, () => { setGroups(p => p.filter(x => x._id !== g._id)); showToast('Group deleted'); }, true)}>
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{g.description || 'No description'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-12 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">🤝</span>
                <p style={{ color: 'var(--text-muted)' }}>No groups yet — they'll appear here when users create them.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CHATS ── */}
        {activeTab === 'chats' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {chats.length ? (
              <div className="space-y-3">
                {chats.map((c, i) => (
                  <div key={i} className="card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{c.userName || 'User'}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.messageCount || 0} messages · {fmt(c.lastMessage)}</div>
                    </div>
                    <button className="btn-danger text-xs px-3 py-1.5"
                      onClick={() => doConfirm('Delete Chat', 'Delete this chat history?', () => { setChats(p => p.filter((_, idx) => idx !== i)); showToast('Chat deleted'); }, true)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-12 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">💬</span>
                <p style={{ color: 'var(--text-muted)' }}>No chat sessions found. User AI chat histories will appear here.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-5">Risk Level Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Low Risk',      count: analytics.riskLevelBreakdown?.Low || 0,      color: 'var(--emerald)' },
                  { label: 'Moderate Risk', count: analytics.riskLevelBreakdown?.Moderate || 0, color: 'var(--amber)' },
                  { label: 'High Risk',     count: analytics.riskLevelBreakdown?.High || 0,     color: 'var(--rose)' },
                ].map(r => {
                  const tot = (analytics.riskLevelBreakdown?.Low || 0) + (analytics.riskLevelBreakdown?.Moderate || 0) + (analytics.riskLevelBreakdown?.High || 0);
                  const pct = tot ? Math.round((r.count / tot) * 100) : 0;
                  return (
                    <div key={r.label} className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ background: `${r.color}10`, border: `1px solid ${r.color}25` }}>
                      <div className="text-2xl font-bold font-display" style={{ color: r.color }}>{r.count}</div>
                      <div>
                        <div className="text-sm text-white">{r.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct}% of total</div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: r.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Top Users by Engagement</h3>
              <table className="w-full text-sm">
                <thead style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <tr>
                    {['User', 'Assessments', 'Avg Score', 'Last Active'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analytics.userStats || []).slice(0, 10).map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.03]">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td className="py-2.5 px-3 text-white">{u.totalAssessments}</td>
                      <td className="py-2.5 px-3"><RiskBadge score={u.averageScore} /></td>
                      <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(u.lastAssessment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Export Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button className="btn-ghost flex items-center justify-center gap-2 py-3" onClick={() => exportCSV(allUsers, 'mindease_users.csv')}>
                  <FaDownload /> Users CSV
                </button>
                <button className="btn-ghost flex items-center justify-center gap-2 py-3" onClick={() => exportCSV(allAssessments, 'mindease_assessments.csv')}>
                  <FaDownload /> Assessments CSV
                </button>
                <button className="btn-ghost flex items-center justify-center gap-2 py-3" onClick={() => {
                  const data = JSON.stringify({ analytics, exported: new Date().toISOString() }, null, 2);
                  Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([data], { type: 'application/json' })), download: 'mindease_analytics.json' }).click();
                  showToast('Analytics exported ✓');
                }}>
                  <FaDownload /> Analytics JSON
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Add User */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="➕ Add New User">
        <div className="space-y-4">
          {formErrors.server && (
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
              {formErrors.server}
            </div>
          )}
          <Field id="name" label="Full Name" placeholder="e.g. Aryan Sharma" />
          <Field id="email" label="Email Address" type="email" placeholder="aryan@example.com" />
          <Field id="password" label="Password" type="password" placeholder="Minimum 6 characters" />
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-secondary)' }}>ROLE</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-dark">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1 py-2.5 text-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? <><Spinner /> Creating…</> : <><FaPlus /> Create User</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User */}
      <Modal show={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit User">
        {editTarget && (
          <div className="space-y-4">
            <Field id="name" label="Full Name" />
            <Field id="email" label="Email Address" type="email" />
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-secondary)' }}>ROLE</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-dark">
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <span className="text-sm text-white">Account Active</span>
              <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: form.isActive ? 'var(--emerald)' : 'var(--text-muted)' }}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: form.isActive ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-ghost flex-1 py-2.5 text-sm" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2" onClick={handleUpdate} disabled={formLoading}>
                {formLoading ? <><Spinner /> Saving…</> : <><FaCheck /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View User */}
      <Modal show={showView} onClose={() => setShowView(false)} title="👤 User Profile" wide>
        {viewTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--teal-dim), var(--violet))' }}>
                {viewTarget.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-lg">{viewTarget.name}</div>
                <div className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{viewTarget.email}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge status={viewTarget.role || 'user'} />
                  <Badge status={viewTarget.isActive !== false ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Joined',       value: fmt(viewTarget.createdAt) },
                { label: 'Last Login',   value: fmt(viewTarget.lastLogin) },
                { label: 'Assessments',  value: userAssessments.length || '—' },
                { label: 'User ID',      value: (viewTarget._id || '').toString().slice(-8) },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                  <div className="text-sm font-medium text-white mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>

            {userAssessments.length > 0 && (
              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Assessment History</h4>
                <div className="space-y-2">
                  {userAssessments.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-2">
                        <span>{ISSUE_ICONS[a.category] || '🧠'}</span>
                        <span className="text-sm text-white capitalize">{a.categoryName || a.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiskBadge score={a.wellnessIndex} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(a.testDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm"
                onClick={() => { setShowView(false); openEdit(viewTarget); }}>
                <FaEdit /> Edit User
              </button>
              <button className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm"
                onClick={() => { setShowView(false); doConfirm('Delete User', `Permanently delete ${viewTarget.name}?`, () => handleDelete(viewTarget._id), true); }}>
                <FaTrash /> Delete User
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm */}
      <ConfirmModal
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        onClose={() => setConfirm(p => ({ ...p, show: false }))}
        onConfirm={() => { confirm.action?.(); setConfirm(p => ({ ...p, show: false })); }}
      />
    </div>
  );
}
