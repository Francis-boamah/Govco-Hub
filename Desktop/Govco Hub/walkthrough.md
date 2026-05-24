# GOVCO Hub — Firebase Migration Walkthrough

The project has been migrated to a fully serverless backend architecture hosted on Firebase, using Cloud Firestore for structured data, Firebase Storage for product images, Firebase Authentication for user accounts, and a Cloud Function for secure email-based order dispatching.

---

## Restructured Project Layout

All client-side code has been moved to the `public/` directory, which is the default root for Firebase Hosting. Configuration and backend cloud function files are situated at the root level.

```
Govco Hub/
├── public/                         ← Firebase Hosting root (Web Assets)
│   ├── index.html                  (Updated with Firebase SDK imports)
│   ├── past.html                   (Updated with Firebase SDK imports)
│   ├── quiz.html                   (Updated with Firebase SDK imports)
│   ├── store.html                  (Updated with Firebase SDK imports)
│   ├── checkout.html               (Updated with Firebase SDK imports)
│   ├── auth.html                   (Rewritten with Firebase Auth + dynamic tabs)
│   ├── admin.html                  ← NEW: Admin panel dashboard
│   ├── css/
│   │   ├── admin.css               ← NEW: Styles for the admin interface
│   │   ├── auth.css                ← NEW: Styles for account page
│   │   ├── index.css
│   │   ├── past.css
│   │   ├── quiz.css
│   │   └── store.css
│   └── js/
│       ├── firebase-config.js      ← NEW: Initializes Firebase and exports APIs
│       ├── auth.js                 ← REWRITE: Syncs auth state and manages roles
│       ├── index.js                ← MODIFY: Renders products & news from Firestore
│       ├── past.js                 ← MODIFY: Opens OneDrive PDF links from Firestore
│       ├── store.js                ← MODIFY: Renders product catalog from Firestore
│       ├── checkout.js             ← REWRITE: Calls placeOrder Cloud Function
│       └── admin.js                ← NEW: CRUD and order management dashboard
├── functions/                      ← Firebase Cloud Functions
│   ├── package.json                (nodemailer, firebase-admin, firebase-functions)
│   └── index.js                    (placeOrder callable Cloud Function)
├── seed.js                         ← NEW: Seed database utility
├── firebase.json                   (Hosting, Firestore, & Storage configurations)
├── .firebaserc                     (Project defaults)
├── firestore.rules                 (Database security rules)
└── storage.rules                   (Storage bucket security rules)
```

---

## Implementation Details

### 1. Firebase Initialization & Modular Exports
- [firebase-config.js](file:///C:/Users/oakye/Desktop/Govco%20Hub/public/js/firebase-config.js) initializes the Firebase app and binds the modern Firebase v9+ modular APIs (e.g. `doc`, `getDoc`, `setDoc`, `query`, `where`) to the global `window.firebase` object.
- This approach allows all other client-side scripts to interact with Firestore and Authentication cleanly using modern modular syntax without the overhead of bundlers.

### 2. Authentication & Admin Security Guard
- [auth.js](file:///C:/Users/oakye/Desktop/Govco%20Hub/public/js/auth.js) manages sign-up and sign-in operations. On sign-up, a user profile is created under `users/{uid}` in Firestore.
- On auth state change, if the user profile contains `isAdmin: true`, an **Admin Panel** link is dynamically appended to the sidebar.
- [admin.html](file:///C:/Users/oakye/Desktop/Govco%20Hub/public/js/admin.html) and [admin.js](file:///C:/Users/oakye/Desktop/Govco%20Hub/public/js/admin.js) implement client-side authorization routing. If an unauthenticated or non-admin user attempts to access `admin.html`, they are instantly redirected back to `index.html`.

### 3. Products, News, & Past Questions
- News articles and products are dynamically fetched from the `news` and `products` Firestore collections.
- The past questions interface ([past.js](file:///C:/Users/oakye/Desktop/Govco%20Hub/public/js/past.js)) fetches available course metadata from Firestore `courses` collection. If a `pdfUrl` (OneDrive share link) is defined for a course, the download button is enabled. Clicking it directly opens the file in a new tab.

### 4. Cloud Function Order Dispatch
- [functions/index.js](file:///C:/Users/oakye/Desktop/Govco%20Hub/functions/index.js) implements the `placeOrder` callable cloud function.
- It validates the order data, pulls actual product pricing from Firestore to calculate the total securely, writes the order to the `orders` collection, writes item list to `orders/{orderId}/items`, and dispatches an email notification via Nodemailer using secure Gmail configuration settings.

---

## Deployment & Setup Guide

### 1. Project Initialization
First, install the Firebase CLI globally if you haven't already:
```bash
npm install -g firebase-tools
```
Log in to your Firebase account:
```bash
firebase login
```

### 2. Seeding the Database
To quickly populate your Firestore database with the pre-existing 100+ course codes, products, and default news, follow these steps:
1. Go to **Firebase Console** > **Project Settings** > **Service Accounts**.
2. Click **Generate new private key** to download `serviceAccountKey.json`.
3. Place `serviceAccountKey.json` directly in the root directory: `C:\Users\oakye\Desktop\Govco Hub\`.
4. Install dependencies and run the seed script:
```bash
npm install firebase-admin
node seed.js
```
5. Once complete, you may delete `serviceAccountKey.json` for safety.

### 3. Creating the Master Admin Account
1. Open the website and go to **Account** (`auth.html`).
2. Click **Sign Up** and register an account (e.g. `admin@govco.hub`).
3. Open the **Firebase Console** > **Firestore Database**.
4. Find the document matching your user's UID inside the `users` collection.
5. Edit the document and add the field: `isAdmin` (type: **boolean**, value: **true**).
6. Sign out and sign in again on the website. You will now see the **Admin Panel** link!

### 4. Deploying to Firebase
Set your Cloud Function credentials (Gmail and App Password) using Firebase Environment Variables:
```bash
firebase functions:config:set gmail.email="yourgmail@gmail.com" gmail.password="your-app-password"
```
Or define them as runtime secret environment variables in Cloud Console.

Deploy everything to Firebase:
```bash
firebase deploy
```
This command deploys your Hosting web files, Cloud Firestore database rules, Storage rules, and the `placeOrder` Cloud Function.
