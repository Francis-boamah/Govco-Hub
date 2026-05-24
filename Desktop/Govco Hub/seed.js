/**
 * seed.js
 * Database Seeder for GOVCO Hub.
 * Run this script to populate Firestore collections with default products, news, and courses.
 * 
 * Instructions:
 * 1. Download serviceAccountKey.json from Firebase Console (Project Settings > Service Accounts).
 * 2. Save it in the project root directory as "serviceAccountKey.json".
 * 3. Run: npm install firebase-admin
 * 4. Run: node seed.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found in the root directory!");
  console.log("Please download the service account file from Firebase Console and place it here.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 1. Static Products Data
const products = [
  { name: "Classic Navy Dress", category: "dress", price: 45.00, meta: "Size S-M", imageUrl: null },
  { name: "Floral Midi Dress", category: "dress", price: 55.00, meta: "Size M-L", imageUrl: null },
  { name: "Leather Wallet", category: "accessories", price: 20.00, meta: "Brown leather", imageUrl: null },
  { name: "Canvas Belt", category: "accessories", price: 12.00, meta: "One size", imageUrl: null },
  { name: "Desk Lamp", category: "electricals", price: 30.00, meta: "LED, USB", imageUrl: null },
  { name: "Portable Fan", category: "electricals", price: 25.00, meta: "Battery / USB", imageUrl: null }
];

// 2. Static News Data
const news = [
  { title: "Library extended hours this semester", body: "The library will be open until midnight on weekdays to support students preparing for exams.", imageUrl: null },
  { title: "New shuttle schedule between halls", body: "Additional shuttles have been scheduled for peak hours (7:30 AM - 9:30 AM).", imageUrl: null },
  { title: "Student tech fair next Friday", body: "Join us at the main quad to see student tech projects, interactive demos, and food stalls.", imageUrl: null }
];

// 3. Courses tree data from questions.js
const courseTree = {
  "100": {
    "1": ["TEJS/TEUP/TEEG 208-2023", "PHYS101", "CHEM101", "BIO101", "COMP101", "STAT101", "ENG101", "GS101"],
    "2": ["MATH102", "PHYS102", "CHEM102", "BIO102", "COMP102", "STAT102", "ENG102", "GS102"]
  },
  "200": {
    "1": {
      "JHS": ["JHS201", "JHS202", "JHS203", "JHS204", "JHS205", "JHS206", "JHS207", "JHS208"],
      "primary": ["PRI201", "PRI202", "PRI203", "PRI204", "PRI205", "PRI206", "PRI207", "PRI208"],
      "early": ["EG201", "EG202", "EG203", "EG204", "EG205", "EG206", "EG207", "EG208"]
    },
    "2": {
      "JHS": ["JHS251", "JHS252", "JHS253", "JHS254", "JHS255", "JHS256", "JHS257", "JHS258"],
      "primary": ["PRI251", "PRI252", "PRI253", "PRI254", "PRI255", "PRI256", "PRI257", "PRI258"],
      "early": ["EG251", "EG252", "EG253", "EG254", "EG255", "EG256", "EG257", "EG258"]
    }
  },
  "300": {
    "1": {
      "JHS": ["JHS301", "JHS302", "JHS303", "JHS304", "JHS305", "JHS306", "JHS307", "JHS308"],
      "primary": ["PRI301", "PRI302", "PRI303", "PRI304", "PRI305", "PRI306", "PRI307", "PRI308"],
      "early": ["EG301", "EG302", "EG303", "EG304", "EG305", "EG306", "EG307", "EG308"]
    },
    "2": {
      "JHS": ["JHS351", "JHS352", "JHS353", "JHS354", "JHS355", "JHS356", "JHS357", "JHS358"],
      "primary": ["PRI351", "PRI352", "PRI353", "PRI354", "PRI355", "PRI356", "PRI357", "PRI358"],
      "early": ["EG351", "EG352", "EG353", "EG354", "EG355", "EG356", "EG357", "EG358"]
    }
  },
  "400": {
    "1": {
      "JHS": ["JHS401", "JHS402", "JHS403", "JHS404", "JHS405", "JHS406", "JHS407", "JHS408"],
      "primary": ["PRI401", "PRI402", "PRI403", "PRI404", "PRI405", "PRI406", "PRI407", "PRI408"],
      "early": ["EG401", "EG402", "EG403", "EG404", "EG405", "EG406", "EG407", "EG408"]
    },
    "2": {
      "JHS": ["JHS451", "JHS452", "JHS453", "JHS454", "JHS455", "JHS456", "JHS457", "JHS458"],
      "primary": ["PRI451", "PRI452", "PRI453", "PRI454", "PRI455", "PRI456", "PRI457", "PRI458"],
      "early": ["EG451", "EG452", "EG453", "EG454", "EG455", "EG456", "EG457", "EG458"]
    }
  }
};

async function seed() {
  console.log("Starting Firestore Seeder...");

  // 1. Seed Products
  console.log("Seeding products...");
  for (const product of products) {
    const docRef = await db.collection("products").add({
      ...product,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`- Product added: ${product.name} (ID: ${docRef.id})`);
  }

  // 2. Seed News
  console.log("Seeding news board announcements...");
  for (const item of news) {
    const docRef = await db.collection("news").add({
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`- News article added: ${item.title} (ID: ${docRef.id})`);
  }

  // 3. Seed Courses
  console.log("Seeding course structures...");
  let courseCount = 0;
  
  for (const level in courseTree) {
    const semMap = courseTree[level];
    for (const semester in semMap) {
      const data = semMap[semester];
      
      if (Array.isArray(data)) {
        // Level 100 has no category
        for (const code of data) {
          await db.collection("courses").add({
            code,
            level,
            semester,
            category: null,
            pdfUrl: "", // Admin can fill this via panel later
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          courseCount++;
        }
      } else {
        // Levels 200, 300, 400 have category maps
        for (const category in data) {
          const codes = data[category];
          for (const code of codes) {
            await db.collection("courses").add({
              code,
              level,
              semester,
              category,
              pdfUrl: "", // Admin can fill this via panel later
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            courseCount++;
          }
        }
      }
    }
  }
  
  console.log(`- Seeded ${courseCount} course records!`);
  console.log("\nDatabase seeding completed successfully!");
}

seed().catch(err => {
  console.error("Error during database seeding:", err);
});
