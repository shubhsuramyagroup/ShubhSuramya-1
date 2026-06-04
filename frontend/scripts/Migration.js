/* 
  18th May 2026, Migration script to convert all DOB inside contacts collection into timestamp/date from string.
  Uses the service account JSON shubhsuramya.json for authentication.
  
  Usage:
    - Dry-Run (preview):  node scripts/Migration.js (or node scripts/Migration.js --dry-run)
    - Live Run (mutate): node scripts/Migration.js --run
*/

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name of ESM module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "shubhsuramya.json");

// Ensure service account exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: Service account JSON key not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Command-line flag parsing
const args = process.argv.slice(2);
const isDryRun = !args.includes("--run");

// Date parser helper supporting multiple formats
function parseDOB(dobStr) {
  if (typeof dobStr !== "string") return null;

  const trimmed = dobStr.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }

  // 1. Format: YYYY-MM-DD
  const yyyymmddRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const matchYYYY = trimmed.match(yyyymmddRegex);
  if (matchYYYY) {
    const year = parseInt(matchYYYY[1], 10);
    const month = parseInt(matchYYYY[2], 10) - 1; // 0-based month
    const day = parseInt(matchYYYY[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) return date;
  }

  // 2. Format: DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const matchDD = trimmed.match(ddmmyyyyRegex);
  if (matchDD) {
    const day = parseInt(matchDD[1], 10);
    const month = parseInt(matchDD[2], 10) - 1; // 0-based month
    const year = parseInt(matchDD[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) return date;
  }

  // 3. Fallback standard parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    // If it's a valid date, let's normalize it to a UTC date
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  }

  return null; // Could not parse
}

async function runMigration() {
  console.log("==================================================");
  console.log(`🚀 Firestore DOB Migration Script Started`);
  console.log(`🛡️  Mode: ${isDryRun ? "🟢 DRY-RUN (Simulating)" : "⚠️  LIVE RUN (Mutating DB)"}`);
  console.log("==================================================");

  try {
    const contactsRef = db.collection("contacts");
    const snapshot = await contactsRef.get();

    if (snapshot.empty) {
      console.log("ℹ️ No contact documents found in 'contacts' collection.");
      return;
    }

    console.log(`Fetched ${snapshot.size} contacts from database. Processing...`);
    console.log("--------------------------------------------------");

    let convertedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    let batchCount = 0;

    let batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const dobVal = data.dob;
      const fullName = data.fullName || "Unnamed Contact";

      // Case 1: dob is already a Timestamp (it will have toDate or _seconds or be an instance of Timestamp)
      if (dobVal && (dobVal instanceof admin.firestore.Timestamp || typeof dobVal.toDate === "function")) {
        console.log(`⏭️  [SKIPPED] ID: ${doc.id} ("${fullName}"): already a Timestamp (${dobVal.toDate().toISOString().split("T")[0]})`);
        skippedCount++;
        return;
      }

      // Case 2: dob is a string
      if (typeof dobVal === "string") {
        const parsedDate = parseDOB(dobVal);

        if (parsedDate) {
          const timestamp = admin.firestore.Timestamp.fromDate(parsedDate);
          const formattedOld = dobVal.trim();
          const formattedNew = parsedDate.toISOString().split("T")[0];

          if (isDryRun) {
            console.log(`📝 [DRY-RUN] ID: ${doc.id} ("${fullName}"): would convert "${formattedOld}" ➡️  Timestamp (${formattedNew})`);
          } else {
            batch.update(doc.ref, { dob: timestamp });
            console.log(`✅ [CONVERTED] ID: ${doc.id} ("${fullName}"): converted "${formattedOld}" ➡️  Timestamp (${formattedNew})`);
            batchCount++;
          }
          convertedCount++;
        } else {
          // If empty string, we can convert it to null (clean missing value) or keep as is.
          // Let's standardise empty strings or "null" to null.
          if (dobVal.trim() === "" || dobVal.trim().toLowerCase() === "null") {
            if (isDryRun) {
              console.log(`📝 [DRY-RUN] ID: ${doc.id} ("${fullName}"): empty/null string. Would set "${dobVal}" ➡️  null`);
            } else {
              batch.update(doc.ref, { dob: null });
              console.log(`✅ [CONVERTED] ID: ${doc.id} ("${fullName}"): empty/null string. Set "${dobVal}" ➡️  null`);
              batchCount++;
            }
            convertedCount++;
          } else {
            console.log(`❌ [INVALID] ID: ${doc.id} ("${fullName}"): Could not parse string value "${dobVal}"`);
            invalidCount++;
          }
        }
      } 
      // Case 3: dob is missing, null, or undefined (already correct or needs no conversion)
      else if (dobVal === null || dobVal === undefined) {
        console.log(`⏭️  [SKIPPED] ID: ${doc.id} ("${fullName}"): DOB is already null/undefined`);
        skippedCount++;
      } 
      // Case 4: Other types (e.g. invalid objects or arrays)
      else {
        console.log(`❌ [INVALID] ID: ${doc.id} ("${fullName}"): Unknown format/type for DOB:`, typeof dobVal);
        invalidCount++;
      }

      // Commit batches of 500 to stay within Firestore limits
      if (batchCount >= 500) {
        if (!isDryRun) {
          console.log(`📦 Reached 500 updates. Committing batch...`);
          batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    });

    // Commit any remaining writes
    if (batchCount > 0 && !isDryRun) {
      console.log(`📦 Committing remaining ${batchCount} updates...`);
      await batch.commit();
    }

    console.log("--------------------------------------------------");
    console.log("📊 MIGRATION SUMMARY");
    console.log("--------------------------------------------------");
    console.log(`Mode:           ${isDryRun ? "🟢 DRY-RUN" : "⚠️  LIVE RUN"}`);
    console.log(`Total Contacts: ${snapshot.size}`);
    console.log(`Converted:      ${convertedCount}`);
    console.log(`Skipped:        ${skippedCount}`);
    console.log(`Invalid:        ${invalidCount}`);
    console.log("==================================================");
    if (isDryRun && convertedCount > 0) {
      console.log("💡 Tip: To commit these changes, run the script with the --run flag:");
      console.log("   node scripts/Migration.js --run");
    }
    console.log("==================================================");

  } catch (error) {
    console.error("❌ Critical Error during migration:", error);
  }
}

runMigration().then(() => {
  process.exit(0);
});