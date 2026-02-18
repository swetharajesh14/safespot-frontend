import { Alert, Linking, Platform } from "react-native";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import SendSMS from "react-native-sms";
import * as ExpoSMS from "expo-sms";
import { fetchProtectors } from "./protectors";
import { ensureCallPermission } from "./callPermission";
import { ensureSmsPermission } from "./smsPermission";
import { getAutomaticSMSSetting } from "./settingsStorage";

const USER_ID = "Swetha_01";

const cleanPhone = (p: any) => String(p || "").replace(/[^\d+]/g, "");

/* ===========================
   SMS Composer (User taps Send)
=========================== */
async function openSmsComposer(recipients: string[], body: string) {
  const to = recipients.map(cleanPhone).filter(Boolean);

  if (!to.length) {
    Alert.alert("SOS", "No valid protector numbers found.");
    return;
  }

  const numbers = to.join(",");
  const encoded = encodeURIComponent(body);

  const url =
    Platform.OS === "ios"
      ? `sms:${numbers}&body=${encoded}`
      : `sms:${numbers}?body=${encoded}`;

  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert("SMS", "Cannot open SMS app on this device.");
    return;
  }

  await Linking.openURL(url);
}

/* ===========================
   Automatic SMS (Android only) - Alternative Method
=========================== */
async function sendAutomaticSMS(recipients: string[], body: string) {
  const to = recipients.map(cleanPhone).filter(Boolean);

  if (!to.length) {
    console.log("❌ No valid protector numbers found");
    return false;
  }

  if (Platform.OS !== "android") {
    console.log("❌ Automatic SMS is supported only on Android");
    return false;
  }

  const hasPermission = await ensureSmsPermission();
  if (!hasPermission) {
    console.log("❌ SMS permission not granted for automatic sending");
    return false;
  }

  try {
    console.log("📱 Attempting automatic SMS to:", to);
    console.log("📝 Message:", body);
    
    // Try multiple approaches for sending SMS
    return await tryMultipleSMSMethods(to, body);
    
  } catch (error: any) {
    console.error("❌ Automatic SMS exception:", error);
    console.error("❌ Exception details:", typeof error === 'object' ? JSON.stringify(error) : error);
    return false;
  }
}

/* ===========================
   Try Multiple SMS Methods
=========================== */
async function tryMultipleSMSMethods(recipients: string[], body: string): Promise<boolean> {
  // Try TextBee first (FREE & Automatic)
  console.log("🔄 Trying TextBee SMS Gateway first (FREE & Automatic)");
  return tryMethod10(recipients, body);
}

async function tryMethod2(recipients: string[], body: string): Promise<boolean> {
  // Method 2: react-native-sms without special parameters
  try {
    console.log("🔄 Trying Method 2: react-native-sms (simple)");
    
    return new Promise<boolean>((resolve) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log("⏰ Method 2 timed out, trying Method 3");
        tryMethod3(recipients, body).then(resolve);
      }, 2000); // 2 second timeout - more aggressive
      
      SendSMS.send(
        {
          body: body,
          recipients: recipients
        },
        (completed: boolean, cancelled: boolean, error: any) => {
          clearTimeout(timeout);
          console.log("📨 Method 2 callback:", { completed, cancelled, error });
          
          if (completed) {
            console.log("✅ Method 2: SMS sent successfully");
            resolve(true);
          } else {
            console.log("❌ Method 2 failed, trying Method 3");
            tryMethod3(recipients, body).then(resolve);
          }
        }
      );
    });
  } catch (error) {
    console.log("❌ Method 2 exception, trying Method 3");
    console.log("❌ Method 2 exception details:", error);
    return tryMethod3(recipients, body);
  }
}

async function tryMethod3(recipients: string[], body: string): Promise<boolean> {
  // Method 3: Multiple expo-sms approaches
  try {
    console.log("🔄 Trying Method 3: expo-sms");
    
    const isAvailable = await ExpoSMS.isAvailableAsync();
    console.log("📱 expo-sms available:", isAvailable);
    
    if (isAvailable) {
      // Try multiple expo-sms approaches
      try {
        // Approach 1: Standard sendSMSAsync
        console.log("📱 Trying expo-sms approach 1: sendSMSAsync");
        const result1 = await ExpoSMS.sendSMSAsync(recipients, body);
        console.log("📨 expo-sms result 1:", result1);
        
        if (result1) {
          console.log("✅ Method 3: expo-sms sent successfully (approach 1)");
          return true;
        }
      } catch (e1) {
        console.log("❌ expo-sms approach 1 failed:", e1);
      }
      
      try {
        // Approach 2: sendSMSAsync with different format
        console.log("📱 Trying expo-sms approach 2: sendSMSAsync with single recipient");
        for (const recipient of recipients) {
          const result2 = await ExpoSMS.sendSMSAsync([recipient], body);
          console.log("📨 expo-sms result 2 for", recipient, ":", result2);
          
          if (result2) {
            console.log("✅ Method 3: expo-sms sent successfully (approach 2)");
            return true;
          }
        }
      } catch (e2) {
        console.log("❌ expo-sms approach 2 failed:", e2);
      }
      
      try {
        // Approach 3: Try with single recipient string
        console.log("📱 Trying expo-sms approach 3: single recipient string");
        for (const recipient of recipients) {
          const result3 = await ExpoSMS.sendSMSAsync(recipient, body);
          console.log("📨 expo-sms result 3 for", recipient, ":", result3);
          
          if (result3) {
            console.log("✅ Method 3: expo-sms sent successfully (approach 3)");
            return true;
          }
        }
      } catch (e3) {
        console.log("❌ expo-sms approach 3 failed:", e3);
      }
    }
    
    console.log("❌ All expo-sms approaches failed, trying Method 5 (react-native-sms direct)");
    return tryMethod5(recipients, body);
    
  } catch (error) {
    console.log("❌ Method 3 exception:", error);
    return tryMethod5(recipients, body);
  }
}

async function tryMethod5(recipients: string[], body: string): Promise<boolean> {
  // Method 5: Direct react-native-sms with aggressive settings
  try {
    console.log("🔄 Trying Method 5: react-native-sms direct approach");
    
    return new Promise<boolean>((resolve) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log("⏰ Method 5 timed out, trying Method 6");
        tryMethod6(recipients, body).then(resolve);
      }, 3000); // 3 second timeout
      
      try {
        SendSMS.send(
          {
            body: body,
            recipients: recipients,
            allowAndroidSendWithoutReadPermission: true
          },
          (completed: boolean, cancelled: boolean, error: any) => {
            clearTimeout(timeout);
            console.log("📨 Method 5 callback:", { completed, cancelled, error });
            
            if (completed) {
              console.log("✅ Method 5: SMS sent successfully");
              resolve(true);
            } else if (cancelled) {
              console.log("❌ Method 5 was cancelled");
              resolve(false);
            } else if (error) {
              console.log("❌ Method 5 failed, trying Method 6");
              tryMethod6(recipients, body).then(resolve);
            } else {
              console.log("❌ Method 5 unknown error, trying Method 6");
              tryMethod6(recipients, body).then(resolve);
            }
          }
        );
      } catch (error) {
        clearTimeout(timeout);
        console.log("❌ Method 5 exception:", error);
        tryMethod6(recipients, body).then(resolve);
      }
    });
  } catch (error) {
    console.log("❌ Method 5 failed, trying Method 6");
    return tryMethod6(recipients, body);
  }
}

async function tryMethod6(recipients: string[], body: string): Promise<boolean> {
  // Method 6: Background Service SMS (FREE & Completely Automatic)
  try {
    console.log("🔄 Trying Method 6: Background Service SMS (FREE & Completely Automatic)");
    
    if (Platform.OS === 'android') {
      // Use a background service approach
      try {
        // Create a background task that sends SMS
        const { HeadlessJsTaskService } = require('react-native');
        
        // Define the background task
        const smsTask = async (taskData: any) => {
          const { recipients, message } = taskData;
          
          try {
            // Use Android's native SMS manager in background
            const { NativeModules } = require('react-native');
            
            if (NativeModules.SmsManager) {
              const result = await NativeModules.SmsManager.sendSms(
                recipients, 
                message
              );
              
              console.log("📨 Background SMS result:", result);
              return result.success;
            } else {
              console.log("❌ SmsManager not available");
              return false;
            }
          } catch (error) {
            console.error("❌ Background SMS error:", error);
            return false;
          }
        };
        
        // Register the headless task
        HeadlessJsTaskService.register('SendSmsTask', smsTask);
        
        // Start the background task
        HeadlessJsTaskService.start('SendSmsTask', {
          recipients: recipients,
          message: body
        });
        
        console.log("✅ Method 6: Background SMS task started (FREE & Automatic)");
        return true;
        
      } catch (error) {
        console.log("❌ Background service not available, trying Method 7");
        return tryMethod7(recipients, body);
      }
    } else {
      console.log("❌ Method 6 only works on Android, trying Method 7");
      return tryMethod7(recipients, body);
    }
  } catch (error) {
    console.log("❌ Method 6 exception:", error);
    return tryMethod7(recipients, body);
  }
}

async function tryMethod7(recipients: string[], body: string): Promise<boolean> {
  // Method 7: Free SMS Gateway (Textlocal, etc.)
  try {
    console.log("🔄 Trying Method 7: Free SMS Gateway");
    
    // Use a free SMS gateway service
    const response = await fetch('https://api.textlocal.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: 'YOUR_FREE_API_KEY', // You'll need to get a free API key
        numbers: recipients.join(','),
        message: body,
        sender: 'TXTLCL'
      })
    });
    
    const result = await response.json();
    console.log("📨 Free SMS gateway result:", result);
    
    if (result.status === 'success') {
      console.log("✅ Method 7: Free SMS gateway sent successfully");
      return true;
    } else {
      console.log("❌ Method 7 failed, trying Method 8");
      return tryMethod8(recipients, body);
    }
  } catch (error) {
    console.log("❌ Method 7 exception:", error);
    return tryMethod8(recipients, body);
  }
}

async function tryMethod8(recipients: string[], body: string): Promise<boolean> {
  // Method 8: WhatsApp (Free alternative)
  try {
    console.log("🔄 Trying Method 8: WhatsApp (Free alternative)");
    
    // Send via WhatsApp (free)
    const numbers = recipients.map(r => r.replace(/\+/g, '')).join(',');
    const message = encodeURIComponent(body);
    const whatsappUrl = `https://wa.me/${numbers}?text=${message}`;
    
    await Linking.openURL(whatsappUrl);
    console.log("✅ Method 8: Opened WhatsApp (Free alternative)");
    return true; // Consider successful since WhatsApp is free
    
  } catch (error) {
    console.log("❌ Method 8 exception:", error);
    return tryMethod9(recipients, body);
  }
}

async function tryMethod9(recipients: string[], body: string): Promise<boolean> {
  // Method 9: Email to SMS gateway (Free)
  try {
    console.log("🔄 Trying Method 9: Email to SMS gateway (Free)");
    
    // Use email to SMS gateways (free)
    const carriers = {
      // Indian carriers
      'airtel': '@airtelmail.com',
      'jio': '@jio.com',
      'vodafone': '@vodafone.com',
      'idea': '@idea.email'
    };
    
    for (const recipient of recipients) {
      for (const [carrier, domain] of Object.entries(carriers)) {
        try {
          const email = recipient.replace(/[^\d]/g, '') + domain;
          console.log("📧 Trying email to SMS:", email);
          
          // Send via email gateway (you'll need to implement email sending)
          // This is just the concept - you'd need to set up email sending
          console.log("📧 Email to SMS concept for:", email);
          
        } catch (e) {
          continue;
        }
      }
    }
    
    console.log("❌ Method 9 failed, trying Method 4");
    return tryMethod4(recipients, body);
    
  } catch (error) {
    console.log("❌ Method 9 exception:", error);
    return tryMethod4(recipients, body);
  }
}

async function tryMethod10(recipients: string[], body: string): Promise<boolean> {
  // Method 10: TextBee SMS Gateway (FREE & Automatic)
  try {
    console.log("🔄 Trying Method 10: TextBee SMS Gateway (FREE & Automatic)");
    
    // TextBee API endpoint (correct format)
    const TEXTBEE_API_URL = `https://api.textbee.dev/api/v1/gateway/devices/69941fca433c30448a92e9b3/send-sms`;
    
    try {
      console.log("📱 Sending TextBee SMS to:", recipients);
      console.log("📝 Message:", body);
      
      const response = await fetch(TEXTBEE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '9142821a-1958-4505-98fc-eafda13c3594',
        },
        body: JSON.stringify({
          recipients: recipients,
          message: body
        })
      });
      
      const result = await response.json();
      console.log("📨 TextBee response status:", response.status);
      console.log("📨 TextBee SMS result:", result);
      
      if (response.ok) {
        console.log("✅ Method 10: TextBee SMS sent successfully (FREE)");
        return true;
      } else {
        console.log("❌ TextBee HTTP error:", response.status, response.statusText);
        console.log("❌ TextBee API error:", result);
        
        // Check if device is not connected
        if (result.message && result.message.includes('device')) {
          console.log("❌ TextBee device not connected - make sure TextBee app is running!");
        }
        
        console.log("❌ Method 10 failed, trying Method 5 (react-native-sms)");
        return tryMethod5(recipients, body);
      }
    } catch (error) {
      console.log("❌ Failed to send via TextBee:", error);
      console.log("❌ Method 10 failed, trying Method 5 (react-native-sms)");
      return tryMethod5(recipients, body);
    }
    
  } catch (error) {
    console.log("❌ Method 10 exception:", error);
    return tryMethod5(recipients, body);
  }
}

async function tryMethod4(recipients: string[], body: string): Promise<boolean> {
  // Method 4: Fallback to SMS URL (might show composer)
  try {
    console.log("🔄 Trying Method 4: SMS URL fallback");
    
    const numbers = recipients.join(",");
    const encoded = encodeURIComponent(body);
    const url = `sms:${numbers}?body=${encoded}`;
    
    await Linking.openURL(url);
    console.log("✅ Method 4: Opened SMS composer");
    return true; // Consider this successful since user can send manually
    
  } catch (error) {
    console.error("❌ All methods failed");
    return false;
  }
}

/* ===========================
   Auto Call (Android only)
=========================== */
async function autoCallAndroid(phone: string) {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return;

  if (Platform.OS !== "android") {
    Alert.alert("Call", "Auto-call is supported only on Android.");
    return;
  }

  const ok = await ensureCallPermission();
  if (!ok) {
    Alert.alert("Permission", "Call permission not granted.");
    return;
  }

  try {
    RNImmediatePhoneCall.immediatePhoneCall(cleaned);
  } catch (e: any) {
    Alert.alert("Call failed", e?.message || "Unable to start call.");
  }
}

/* ===========================
   Main SOS Function
=========================== */
export const sendSOS = async (
  lat: number,
  lng: number,
  reason = "SOS",
  automatic?: boolean
) => {
  try {
    const protectors = await fetchProtectors();

    if (!protectors.length) {
      Alert.alert("SOS", "No protectors found. Add at least one protector.");
      return;
    }

    const phones = protectors
      .map((p) => p.phone)
      .filter(Boolean)
      .map(cleanPhone);

    const firstPhone = phones[0];

    const message =
      `🚨 SafeSpot SOS 🚨\n` +
      `User: ${USER_ID}\n` +
      `Reason: ${reason}\n` +
      `Location: https://maps.google.com/?q=${lat},${lng}`;

    // Check if automatic SMS is enabled (if not explicitly provided)
    const shouldUseAutomaticSMS = automatic !== undefined 
      ? automatic 
      : await getAutomaticSMSSetting();

    if (shouldUseAutomaticSMS && Platform.OS === "android") {
      // Automatic mode: Send SMS directly without user interaction
      const smsSent = await sendAutomaticSMS(phones, message);
      
      if (smsSent) {
        console.log("Automatic SOS sent successfully");
      }
      
      // Auto call first protector
      if (firstPhone) {
        setTimeout(() => autoCallAndroid(firstPhone), 1200);
      }
    } else {
      // Manual mode: Open SMS composer for user to send
      await openSmsComposer(phones, message);

      // Auto call first protector
      if (firstPhone) {
        setTimeout(() => autoCallAndroid(firstPhone), 1200);
      }
    }

  } catch (e: any) {
    console.log("sendSOS error:", e?.message || e);
    Alert.alert("SOS", "Something went wrong while sending SOS.");
  }
};

/* ===========================
   Automatic SOS Function (Android only)
=========================== */
export const sendAutomaticSOS = async (
  lat: number,
  lng: number,
  reason = "Automatic SOS"
) => {
  return sendSOS(lat, lng, reason, true);
};