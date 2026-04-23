import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4"
            style={{ boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
          />
          <p className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        </motion.div>
      </div>
    );
  }

  if (adminOnly) {
    return isAdmin ? children : <Navigate to="/admin-login" replace />;
  }

  return currentUser ? children : <Navigate to="/login" replace />;
}
