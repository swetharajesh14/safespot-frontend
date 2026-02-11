import SmsAndroid from "react-native-get-sms-android";
import { Linking } from "react-native";
import { fetchProtectors } from "./protectors";

export const sendSOS = async (
  latitude: number,
  longitude: number
) => {
  try {
    const protectors = await fetchProtectors();
    if (!protectors || protectors.length === 0) return;

    const message =
      `🚨 EMERGENCY ALERT 🚨\n\n` +
      `Abnormal movement detected.\n\n` +
      `📍 Location:\nhttps://maps.google.com/?q=${latitude},${longitude}`;

    // ✅ 1. Send SMS to all protectors
    for (const p of protectors) {
      SmsAndroid.autoSend(
        p.phone,
        message,
        (fail: any) => console.log("SMS failed:", fail),
        (success: any) => console.log("SMS sent:", success)
      );
    }

    // ✅ 2. Call FIRST protector automatically
    const firstPhone = protectors[0].phone;
    await Linking.openURL(`tel:${firstPhone}`);

  } catch (e) {
    console.log("sendSOS error:", e);
  }
};