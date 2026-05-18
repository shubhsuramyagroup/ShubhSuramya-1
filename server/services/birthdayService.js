import { db } from "../config/firebase.js";
import { sendWhatsApp } from "./twilioService.js";

/**
 * Gets the current date components in Indian Standard Time (IST, GMT+5:30)
 * to ensure that birthdays are computed according to Indian local time.
 * 
 * @returns {{day: number, month: number}}
 */
function getISTDateComponents() {
  const utcNow = new Date();
  
  // IST is UTC + 5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(utcNow.getTime() + istOffsetMs);
  
  return {
    day: istTime.getUTCDate(),
    month: istTime.getUTCMonth() + 1, // 1-indexed
  };
}

/**
 * Checks Firestore contacts for today's birthdays in IST,
 * and sends WhatsApp greetings to matching customers.
 * 
 * @returns {Promise<{success: boolean, checkedCount: number, sentCount: number, details: Array<object>}>}
 */
export async function checkAndSendBirthdays() {
  const { day: todayDay, month: todayMonth } = getISTDateComponents();
  console.log(`🎂 Birthday Engine: Starting check for ${String(todayDay).padStart(2, "0")}-${String(todayMonth).padStart(2, "0")} (IST)...`);

  try {
    const contactsRef = db.collection("contacts");
    const snapshot = await contactsRef.get();

    if (snapshot.empty) {
      console.log("🎂 Birthday Engine: No contacts found in collection.");
      return { success: true, checkedCount: 0, sentCount: 0, details: [] };
    }

    let checkedCount = 0;
    let sentCount = 0;
    const details = [];

    const contacts = [];
    snapshot.forEach(doc => {
      contacts.push({ id: doc.id, ...doc.data() });
    });

    for (const contact of contacts) {
      checkedCount++;
      const { fullName, phone, dob } = contact;

      if (!dob) continue;

      // Extract date of birth from Firestore Timestamp
      let dobDate = null;
      if (typeof dob.toDate === "function") {
        dobDate = dob.toDate();
      } else if (dob.seconds) {
        dobDate = new Date(dob.seconds * 1000);
      } else if (dob instanceof Date) {
        dobDate = dob;
      } else {
        // Fallback for legacy raw string format if any remains
        dobDate = new Date(dob);
      }

      if (!dobDate || isNaN(dobDate.getTime())) {
        console.warn(`⚠️ Birthday Engine: Contact ID ${contact.id} has an invalid DOB format:`, dob);
        continue;
      }

      // Use UTC getters because our migration script standardized dob to UTC midnight
      const dobDay = dobDate.getUTCDate();
      const dobMonth = dobDate.getUTCMonth() + 1;

      if (dobDay === todayDay && dobMonth === todayMonth) {
        console.log(`🎉 Birthday Match found: "${fullName}" (DOB: ${dobDay}-${dobMonth}, Phone: ${phone || "N/A"})`);

        if (!phone || phone.trim() === "") {
          console.warn(`⚠️ Birthday Engine: Skipping "${fullName}" because their phone number is missing.`);
          details.push({ id: contact.id, name: fullName, success: false, reason: "Missing phone number" });
          continue;
        }

        // Custom template design
        const messageBody = `🎂 Happy Birthday, *${fullName.trim()}*! 🎉\n\nShubh Suramya wishes you a wonderful day filled with joy, prosperity, and love. May all your dreams come true this year! ✨\n\nWarmest Regards,\nTeam Shubh Suramya 🌸`;

        const result = await sendWhatsApp(phone.trim(), messageBody);
        
        if (result.success) {
          sentCount++;
          details.push({ id: contact.id, name: fullName, success: true, phone });
        } else {
          details.push({ id: contact.id, name: fullName, success: false, reason: result.error });
        }
      }
    }

    console.log(`📊 Birthday Run Summary: Checked ${checkedCount} contacts, found & processed ${sentCount} matches.`);
    return { success: true, checkedCount, sentCount, details };

  } catch (error) {
    console.error("❌ Birthday Engine: Error during daily cron check:", error);
    return { success: false, error: error.message };
  }
}
