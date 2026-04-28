# AdminDashboard.js Cleanup Progress

## Plan Status
- [ ] **1. Add missing imports** (db, isFirebaseConfigured from firebase.js)
- [ ] **2. Fix fetchAll() destructuring** (use { data, error })
- [ ] **3. Remove onlineUsers from useMemo deps**
- [ ] **4. Remove onlineUsers state reference** (if declared)
- [ ] **5. Remove "online" filter option**
- [ ] **6. Update StatCard "Online Now"** (analytics.onlineUsers || 0)
- [ ] **7. Remove green dot indicators** (2 locations: user row, profile)
- [ ] **8. Remove "Online" badge** (profile modal)
- [ ] **9. Clean genDemoAnalytics()** (remove onlineUsers: 3)
- [ ] **10. Verify no undefined vars**
- [ ] **11. Test compilation & functionality**

**Current step:** 1/11 - Adding imports
