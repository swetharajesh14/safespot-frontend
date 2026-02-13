import SmsAndroid from "react-native-get-sms-android";
import { Linking, Alert } from "react-native";
import { fetchProtectors } from "./protectors";

export const sendSOS = async (
  latitude: number,
  longitude: number,
  reason = "SOS"
) => {
  try {
    const protectors = await fetchProtectors();
    if (!protectors || protectors.length === 0) return;

    const message =
      `🚨 EMERGENCY ALERT 🚨\n\n` +
      `${reason}\n\n` +
      `📍 Location:\nhttps://maps.google.com/?q=${latitude},${longitude}`;

    // 1) SMS to all protectors
    for (const p of protectors) {
      if (!p?.phone) continue;
      SmsAndroid.autoSend(
        p.phone,
        message,
        (fail: any) => console.log("SMS failed:", fail),
        (success: any) => console.log("SMS sent:", success)
      );
    }

    // 2) Auto call first protector (after 2 sec)
    const firstPhone = protectors[0]?.phone;
    if (firstPhone) {
      setTimeout(async () => {
        const url = `tel:${firstPhone}`;
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert("Call failed", "Phone cannot place calls on this device.");
          return;
        }
        await Linking.openURL(url);
      }, 2000);
    }
  } catch (e) {
    console.log("sendSOS error:", e);
  }
};