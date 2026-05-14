# MindEase — Why Your Test Data Isn't Saving (and How to Fix It in 15 Minutes)

This guide fixes four problems at once: assessments not saving to Firestore,
admin panel showing demo data only, login/logout activity not tracked, and
the Gemini chatbot staying silent.

> **TL;DR — do these four things in order. Nothing else matters.**
> 1. Publish `firestore.rules` in the Firebase Console
> 2. Create the `assessments` composite index in Firestore
> 3. Drop `netlify.toml` at the repo root + the fixed `netlify/functions/chat.js`
> 4. Replace 3 React files (`AuthContext.js`, `AssessmentTest.js`, `Dashboard.js`)
> Then **Clear cache and deploy** in Netlify. Done.

---

## File layout in this fix bundle

```
mindease-fix/
├── firestore.rules                 → paste in Firebase Console
├── firestore.indexes.json          → reference (or use Firebase CLI)
├── netlify.toml                    → REPO ROOT (sibling to mindease-prod/)
├── netlify/functions/chat.js       → replace mindease-prod/netlify/functions/chat.js
└── src/
    ├── contexts/AuthContext.js     → replace mindease-prod/src/contexts/AuthContext.js
    └── components/
        ├── AssessmentTest.js       → replace mindease-prod/src/components/AssessmentTest.js
        └── Dashboard.js            → replace mindease-prod/src/components/Dashboard.js
```

---

## Step 1 — Publish Firestore security rules (THIS IS WHY NOTHING IS SAVING)

This is the #1 cause. Default Firestore rules deny every write.

1. Open https://console.firebase.google.com/project/mindease-edff1/firestore/rules
2. Replace **everything** in the editor with the contents of `firestore.rules`
3. Click **Publish**
4. Wait 10 seconds for rules to propagate

To verify it worked, go to **Firestore → Data**, log into your site, take an assessment,
and watch the `assessments` collection — a new doc should appear within 2 seconds.

**Want to test this is the issue right now?** Open your live site, open browser DevTools
→ Console, take an assessment, watch for `permission-denied` errors. If you see one,
this step is your fix.

---

## Step 2 — Enable Email/Password authentication

1. https://console.firebase.google.com/project/mindease-edff1/authentication/providers
2. **Email/Password** → toggle ON → Save
3. **Settings → Authorized domains** → add `mindeasewell.netlify.app` if missing

---

## Step 3 — Create the composite index for the user Dashboard

The Dashboard query (`where userId ==` + `orderBy date desc`) needs a composite index.

**Easy way:** load the deployed site signed in as a real user with assessments. The
console will show:

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Click that link → **Create index** → wait ~2 minutes for it to build.

**Manual way:**
- Firestore → Indexes tab → **Add index**
- Collection ID: `assessments`
- Field 1: `userId` (Ascending)
- Field 2: `date` (Descending)
- Query scope: Collection → Create

Repeat for `loginActivities` (`userId` asc, `loginTime` desc) if you want
per-user login history in the admin panel.

The new Dashboard.js I gave you also has a **client-side fallback** so it doesn't
break while the index is being built — but you still want the index for performance.

---

## Step 4 — Fix the Netlify build (chatbot + functions)

Right now your repo structure looks like this:

```
MindEase/                     ← repo root
└── mindease-prod/            ← actual React app
    ├── package.json
    ├── netlify/functions/chat.js
    └── src/...
```

But Netlify is building from the repo root by default. The fix:

1. **Put `netlify.toml` from this bundle at the REPO ROOT** (not inside mindease-prod)
2. Commit + push
3. Netlify → Site settings → Build & deploy → confirm `base directory` shows `mindease-prod`

This file also bundles the functions properly so `/.netlify/functions/chat` actually exists.

### Replace the broken chat function

Your old `netlify/functions/chat.js` expects `{ message: "..." }` but `Chat.js`
sends `{ messages: [...] }` (an array). Every chat request returns 400 silently.

Replace it with `netlify/functions/chat.js` from this bundle. The new version:
- Accepts both shapes (backwards compatible)
- Passes the full conversation history to Gemini for proper context
- Includes a MindEase system prompt so the bot stays on-topic
- Returns sensible error codes the UI already handles
- Adds safety filtering for sensitive content

### Verify GEMINI_API_KEY is on Netlify

You said it's there — confirm at:
Netlify → Site settings → Environment variables → `GEMINI_API_KEY` should exist.
This one is **server-side only** (no REACT_APP_ prefix) — that's correct, the function reads it.

---

## Step 5 — Replace 3 React files

Drop these into your repo, overwriting the existing files:

| Fix file | Replaces |
|---|---|
| `src/contexts/AuthContext.js` | `mindease-prod/src/contexts/AuthContext.js` |
| `src/components/AssessmentTest.js` | `mindease-prod/src/components/AssessmentTest.js` |
| `src/components/Dashboard.js` | `mindease-prod/src/components/Dashboard.js` |

### What each one fixes

**`AuthContext.js`**
- Only writes Firebase UIDs to Firestore (the original wrote `User_XXXXX`-style anon ids
  too, creating orphan records nobody could ever retrieve)
- Records a `logout` event in `loginActivities` and flips `isActive=false` so admin sees
  real session ends
- Hardens all Firestore side-effects with try/catch so a rules misconfiguration never
  breaks the sign-in/sign-up UI

**`AssessmentTest.js`**
- Uses `currentUser.uid` as the only source of truth for `userId` on saved docs
- **Surfaces the actual Firestore error code** in a toast — so next time something fails
  you'll see `permission-denied` or `failed-precondition` instead of a generic message
- Auto-creates the user's `/users/{uid}` doc on first assessment (so admin panel shows
  the user even if loginActivity hasn't fired)
- Warns the user inline if they're not signed in (local-only mode)

**`Dashboard.js`**
- Uses `currentUser.uid` (not the anon `userId`) so it loads the right user's history
- **Falls back gracefully** when the composite index isn't ready — fetches without
  `orderBy` and sorts client-side, so the dashboard never shows an empty state due to
  a build-pending index

---

## Step 6 — Trigger a clean deploy on Netlify

This is the step everyone forgets. **CRA (Create React App) reads env vars at BUILD
TIME, not runtime.** If you added env vars after your last deploy, none of them are
in your live bundle yet.

Netlify dashboard → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

This forces a full rebuild that picks up every `REACT_APP_*` variable.

---

## Step 7 — Sanity check after deploy

Open your live site in an Incognito window with DevTools Console open, then:

1. **Sign up with a brand new email** → in Firebase Console, you should immediately
   see a doc appear in `users/{uid}`
2. **Take any assessment** → you should see a doc appear in `assessments/`
   with `userId` = the Auth UID
3. **Refresh the page** → log back in → go to `/dashboard` → your assessment should
   be there
4. **Log out** → in `loginActivities`, a row with `eventType: "logout"` should appear
5. **Sign in as an admin email** (e.g. `jasica@kaur.com`) → go to `/admin` →
   you should see real users + assessments, not demo data
6. **Open Chat** → send "hi" → Gemini should reply within 2 seconds

If any of these fail, **the browser console has the actual error code** — paste it
back to me. The new code is instrumented to log everything.

---

## Why your old setup was failing — root-cause summary

| Symptom | Real cause | Fix |
|---|---|---|
| Assessments don't appear in Firestore | Default rules block all writes | Step 1 (rules) |
| Admin panel shows demo data | Same — `getDocs` returns `permission-denied`, code falls back to demo generator | Step 1 |
| Dashboard says "No assessments yet" even after taking one | (a) Saved with anon id, not Firebase UID, OR (b) composite index missing | Step 3 + new files |
| Chatbot replies "No response" or nothing | Function expects `message`, client sends `messages` → 400 every time | Step 4 |
| `/admin` route 404 after refresh | Missing SPA redirect in netlify config | Step 4 (netlify.toml has redirects) |
| Env vars added but still seeing demo mode | CRA bakes env at build, no rebuild triggered | Step 6 |

---

## Bonus — Firebase CLI deploy (optional but cleaner)

If you'd rather deploy rules+indexes via CLI than the web console:

```bash
npm install -g firebase-tools
cd MindEase            # repo root
firebase login
firebase init firestore # accept defaults — but use these files:
#   firestore.rules         → from this bundle
#   firestore.indexes.json  → from this bundle
firebase deploy --only firestore:rules,firestore:indexes
```

After that, the rules and indexes are version-controlled in your repo and any future
changes are one `firebase deploy` away.

---

## You're done. Push to GitHub, let Netlify auto-deploy, and your data will start flowing.
