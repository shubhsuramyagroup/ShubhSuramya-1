import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import { checkAndSendBirthdays } from "./services/birthdayService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ====================================================================
// 🏠 Health & Status Dashboard Route
// ====================================================================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    message: "🌸 Shubh Suramya 24/7 Birthday Notifier Server is running!",
    timezone: "Asia/Kolkata (IST)",
    localTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    serverTimeUTC: new Date().toISOString(),
  });
});

// ====================================================================
// 🔒 Secure Webhook Trigger for External Cron (e.g. cron-job.org)
// ====================================================================
app.post("/api/cron/birthday-check", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  const secretKey = process.env.CRON_SECRET;

  if (!apiKey || apiKey !== secretKey) {
    console.warn("⚠️ API Trigger: Unauthorized birthday check attempt blocked.");
    return res.status(401).json({
      success: false,
      error: "Unauthorized. Invalid x-api-key provided in request headers.",
    });
  }

  console.log("⏰ API Trigger: Secure manual trigger request accepted.");
  const result = await checkAndSendBirthdays();

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
});

// Runs twice a day: 12:00 AM Midnight and 2:15 PM Indian Standard Time
cron.schedule(
  "30 2 * * *",
  () => {
    console.log("⏰ Local Cron (Midnight): Triggering scheduled birthday checks...");
    checkAndSendBirthdays();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "35 14 * * *",
  () => {
    console.log("⏰ Local Cron (2:35 PM): Triggering scheduled birthday checks...");
    checkAndSendBirthdays();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("⏰ Local Cron: Scheduler registered successfully for 12:00 AM and 2:35 PM (Asia/Kolkata).");

// Start Express Server
app.listen(PORT, () => {
  console.log(`🌸 Server: Listening on port ${PORT}...`);
  console.log(`🌸 Server: Current Local time in India: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
});
