import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount = null;

try {
  // Option 1: Load stringified JSON credential from environment variable (ideal for Render/Heroku)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("🔥 Firebase: Loaded credentials from environment variable.");
  } 
  // Option 2: Fall back to local credentials file path
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const credPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(credPath)) {
      const fileContent = fs.readFileSync(credPath, "utf8");
      serviceAccount = JSON.parse(fileContent);
      console.log(`🔥 Firebase: Loaded credentials from local file: ${credPath}`);
    } else {
      console.warn(`⚠️ Firebase: Credentials file not found at ${credPath}`);
    }
  }
} catch (error) {
  console.error("❌ Firebase: Error parsing service account credentials:", error.message);
}

if (!serviceAccount) {
  console.error("❌ Firebase: Failed to load service account. Firestore connection will not be active.");
  process.exit(1);
}

// Prevent double-initialization in development
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { db };
export default admin;
