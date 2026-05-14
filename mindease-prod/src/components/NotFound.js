import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center card p-12 max-w-sm relative z-10">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-6xl mb-5"
        >🌫️</motion.div>
        <div className="badge badge-violet mx-auto mb-4 w-fit">404</div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3">
          <motion.button onClick={() => navigate('/')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn-primary px-8 py-3 text-sm"><span>🏠 Back to Home</span>
          </motion.button>
          <motion.button onClick={() => navigate(-1)} whileHover={{ scale: 1.02 }}
            className="btn-ghost px-8 py-3 text-sm">← Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
