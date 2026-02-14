import { Alert, Linking, Platform } from "react-native";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import { fetchProtectors } from "./protectors";
import { ensureCallPermission } from "./callPermission";

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
  reason = "SOS"
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

    // 1️⃣ Open SMS app (user taps Send)
    await openSmsComposer(phones, message);

    // 2️⃣ Auto call first protector
    if (firstPhone) {
      setTimeout(() => autoCallAndroid(firstPhone), 1200);
    }

  } catch (e: any) {
    console.log("sendSOS error:", e?.message || e);
    Alert.alert("SOS", "Something went wrong while sending SOS.");
  }
};