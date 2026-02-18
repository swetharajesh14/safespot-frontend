// TextBee SMS Gateway Setup Guide
// =====================================

/*
🎯 TEXTBEE SETUP INSTRUCTIONS:

1. 📱 Download TextBee App:
   - Go to https://textbee.dev/
   - Download the Android app
   - Install on your Android device

2. 🔑 Create Account:
   - Sign up for FREE account at https://textbee.dev/
   - No credit card required
   - 50 messages/day FREE

3. ⚙️ Get API Credentials:
   - Login to TextBee dashboard
   - Go to API section
   - Copy your API Key
   - Note your Device ID

4. 🚀 Configure SafeSpot:
   - Replace YOUR_TEXTBEE_API_KEY with your actual API key
   - Replace YOUR_DEVICE_ID with your device ID
   - Done! Automatic SMS will work

📊 FREE PLAN BENEFITS:
- 50 SMS per day (1,500/month)
- 300 SMS per month total
- Up to 50 recipients in bulk
- No credit card required
- Complete automation
- No user interaction needed

🔄 FALLBACK METHODS:
If TextBee fails, SafeSpot will try:
- Background Service SMS
- Free SMS Gateways
- WhatsApp (free)
- Email to SMS gateways
- Manual SMS composer (last resort)

✅ PERFECT FOR SAFESPOT:
- Completely FREE
- Fully automatic
- No user interaction
- Reliable delivery
- Easy setup
*/

export const TEXTBEE_CONFIG = {
  // ✅ CONFIGURED WITH YOUR ACTUAL CREDENTIALS
  API_KEY: "9142821a-1958-4505-98fc-eafda13c3594", // Your API Key
  DEVICE_ID: "69941fca433c30448a92e9b3", // Your Device ID
  API_URL: "https://api.textbee.dev/api/v1/send-sms",
  
  // 📊 Usage limits (FREE plan)
  DAILY_LIMIT: 50,
  MONTHLY_LIMIT: 300,
  BULK_LIMIT: 50,
  
  // ⚙️ Configuration
  TIMEOUT: 10000, // 10 seconds timeout
  RETRY_ATTEMPTS: 3,
};

export const isTextBeeConfigured = (): boolean => {
  return (
    TEXTBEE_CONFIG.API_KEY !== "YOUR_TEXTBEE_API_KEY" &&
    TEXTBEE_CONFIG.DEVICE_ID !== "YOUR_DEVICE_ID"
  );
};

export const getTextBeeSetupInstructions = (): string => {
  return `
🎉 TEXTBEE IS CONFIGURED!

✅ API Key: 9142821a-1958-4505-98fc-eafda13c3594
✅ Device ID: 69941fca433c30448a92e9b3

🚀 Ready to send 50 FREE SMS/day, fully automatic!
  `;
};
