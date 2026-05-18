import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

// Check if credentials are placeholders or missing
const isTwilioConfigured = 
  TWILIO_ACCOUNT_SID && 
  TWILIO_ACCOUNT_SID !== "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" && 
  TWILIO_AUTH_TOKEN && 
  TWILIO_AUTH_TOKEN !== "your_twilio_auth_token_here";

let client = null;

if (isTwilioConfigured) {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("📱 Twilio: Service initialized successfully.");
  } catch (error) {
    console.error("❌ Twilio: Failed to initialize client:", error.message);
  }
} else {
  console.warn("⚠️ Twilio: Using PLACEHOLDER credentials. Messages will be logged to terminal console only.");
}

/**
 * Sends a WhatsApp message using Twilio's API.
 * Falls back to console logs if Twilio is not configured.
 * 
 * @param {string} to - Recipient phone number (e.g. "+919876543210")
 * @param {string} body - The message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendWhatsApp(to, body) {
  if (!to) {
    return { success: false, error: "Recipient phone number is missing." };
  }

  // Format recipient number for Twilio WhatsApp (must start with 'whatsapp:')
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const formattedFrom = TWILIO_WHATSAPP_FROM.startsWith("whatsapp:") ? TWILIO_WHATSAPP_FROM : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

  if (!isTwilioConfigured || !client) {
    console.log("\n--------------------------------------------------");
    console.log(`📡 [TWILIO SIMULATION] Message to ${formattedTo}:`);
    console.log(`From: ${formattedFrom}`);
    console.log(`Body:\n${body}`);
    console.log("--------------------------------------------------\n");
    return { success: true, messageId: "SIMULATED_MSG_ID" };
  }

  try {
    const message = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: body,
    });
    console.log(`✅ Twilio: Message sent to ${to}. Message SID: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error(`❌ Twilio: Failed to send message to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
