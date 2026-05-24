# GOVCO Hub — Firebase Migration Tasks

## Firebase Config & Project Files
- [x] `firebase.json`
- [x] `.firebaserc`
- [x] `firestore.rules`
- [x] `storage.rules`

## Cloud Functions
- [x] `functions/package.json`
- [x] `functions/index.js` (placeOrder callable)

## JS — New & Rewritten Files
- [x] `js/firebase-config.js` (NEW)
- [x] `js/auth.js` (REWRITE — Firebase Auth)
- [x] `js/index.js` (MODIFY — Firestore news + products)
- [x] `js/past.js` (MODIFY — Firestore courses + OneDrive links)
- [x] `js/store.js` (MODIFY — Firestore products)
- [x] `js/checkout.js` (REWRITE — Cloud Function order)
- [x] `js/admin.js` (NEW — admin panel logic)

## Admin Panel
- [x] `admin.html` (NEW)
- [x] `css/admin.css` (NEW)

## HTML Updates (add Firebase SDK scripts, remove old script tags)
- [x] `index.html`
- [x] `past.html`
- [x] `store.html`
- [x] `checkout.html`
- [x] `quiz.html`
- [x] `auth.html` (full rewrite — remove inline script)
