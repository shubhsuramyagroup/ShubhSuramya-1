# 🌸 Shubh Suramya - Twilio WhatsApp & Render Deployment Guide

This guide walks you through setting up Twilio WhatsApp integration (for both free developer sandbox testing and official production use) and deploying your birthday notifier backend to Render.

---

## 📱 PART 1: Twilio WhatsApp Setup

### Option A: Free Developer Sandbox (Immediate Testing)
Twilio provides a free sandbox environment to test WhatsApp messaging immediately without waiting for Meta approval.

1. **Sign Up / Log In to Twilio**:
   - Go to [Twilio.com](https://www.twilio.com) and create a free account.
2. **Retrieve API Keys**:
   - Navigate to the **Twilio Console Dashboard**.
   - Copy the following variables and paste them in your `server/.env` file:
     * **Account SID** ➡️ `TWILIO_ACCOUNT_SID`
     * **Auth Token** ➡️ `TWILIO_AUTH_TOKEN`
3. **Configure the Sandbox**:
   - In the left sidebar, navigate to: **Messaging** ➡️ **Try it out** ➡️ **Send a WhatsApp Message**.
   - You will see a phone number (usually `+1 415 523 8886`) and a join code (e.g., `join code-word`).
   - Copy this phone number and set it as `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` in `.env`.
4. **Link Your Device (Opt-In)**:
   - To receive sandbox messages, you must send the join code (e.g. `join code-word`) to the sandbox phone number from your personal WhatsApp account.
   - Once linked, you can trigger the birthday check locally, and you will receive the simulated message as a real WhatsApp message!

---

### Option B: Twilio WhatsApp Production (For Real Customers)
To send messages to any customer automatically without them needing to scan or send sandbox codes, you must register a production sender.

1. **Complete Business Verification**:
   - Ensure your Meta Business Manager account is verified.
2. **Add a WhatsApp Sender Number**:
   - In your Twilio console, navigate to **Messaging** ➡️ **Senders** ➡️ **WhatsApp Senders**.
   - Click **Submit a WhatsApp Sender** and fill in your official business phone number.
3. **Create approved templates**:
   - Meta requires business-initiated WhatsApp messages to use pre-approved templates.
   - Go to **Messaging** ➡️ **Templates** in the Twilio console and submit your birthday greeting:
     ```text
     🎂 Happy Birthday, {{1}}! 🎉

     Shubh Suramya wishes you a wonderful day filled with joy, prosperity, and love. May all your dreams come true this year! ✨

     Warmest Regards,
     Team Shubh Suramya 🌸
     ```
   - Update your `TWILIO_WHATSAPP_FROM` environment variable to `whatsapp:+your_verified_number`.

---

## 🚀 PART 2: Deploying to Render.com

Render is a fantastic cloud platform. To host your server 24/7 for free:

1. **Push Server to Github**:
   - Push your code to your repository (`ShubhSuramya`).
2. **Create Render Web Service**:
   - Log into [Render.com](https://render.com) and click **New +** ➡️ **Web Service**.
   - Connect your GitHub repository.
3. **Configure Service Settings**:
   - **Name**: `shubhsuramya-birthday-notifier`
   - **Region**: Select a region close to India (e.g., `Singapore`).
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. **Set Environment Variables**:
   Click **Advanced** ➡️ **Add Environment Variable** and configure:
   - `PORT` ➡️ `10000`
   - `CRON_SECRET` ➡️ *(Create a secure secret string, e.g. `my-shubh-suramya-secret`)*
   - `TWILIO_ACCOUNT_SID` ➡️ *(Your real Account SID)*
   - `TWILIO_AUTH_TOKEN` ➡️ *(Your real Auth Token)*
   - `TWILIO_WHATSAPP_FROM` ➡️ *(Your sandbox or production whatsapp number)*
   - `FIREBASE_SERVICE_ACCOUNT_JSON` ➡️ *(Open the `shubhsuramya.json` credentials file, copy the **entire** JSON block, and paste it here as a single-line string. This eliminates the need to upload credentials to your git repository!)*

---

## ⏰ PART 3: 24/7 Free Cron Trigger (Bypassing Render Free Sleep)

Render's free tier goes to sleep after 15 minutes of inactivity. If the server sleeps, a standard internal cron job will not fire! 

We solve this elegantly using a completely free external ping trigger:

1. **Go to Cron-Job.org**:
   - Register a free account at [cron-job.org](https://cron-job.org).
2. **Create a New Cron Job**:
   - **Title**: `Shubh Suramya Birthday Trigger`
   - **URL**: `https://shubhsuramya-birthday-notifier.onrender.com/api/cron/birthday-check` *(Replace with your actual Render URL)*
   - **Request Method**: `POST`
   - **Schedule**: Custom ➡️ Configure it to run twice daily (e.g., at 12:00 AM and 12:00 PM Indian Standard Time).
3. **Set Request Headers**:
   - In the **Headers** tab, add a custom header:
     * **Key**: `x-api-key`
     * **Value**: *(The exact `CRON_SECRET` you set in Render's environment variables)*
4. **Save and Activate**:
   - When the scheduled times arrive, Cron-Job.org sends an HTTP POST request. This request wakes up your Render server, performs the Firestore check, delivers the WhatsApp greetings via Twilio, and returns a successful JSON receipt!
