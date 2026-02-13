import { Alert, Platform } from "react-native";
import { fetchProtectors } from "./protectors";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

export const sendSOS = async (lat: number, lng: number, reason = "SOS") => {
  try {
    // 1) Backend sends SMS to all protectors (Fast2SMS)
    await fetch(`${API_URL}/api/sos/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, lat, lng, intensity: reason }),
    });

    // 2) Auto-call first protector (no user tap)
    const protectors = await fetchProtectors();
    const firstPhoneRaw = protectors[0]?.phone;

    if (!firstPhoneRaw) {
      Alert.alert("SOS", "No protector phone found to call.");
      return;
    }

    // clean: remove spaces; keep +91 allowed
    const firstPhone = String(firstPhoneRaw).replace(/\s+/g, "");

    // Important: Android only (this lib is Android)
    if (Platform.OS !== "android") {
      Alert.alert("SOS", "Auto-call supported only on Android in this build.");
      return;
    }

    // Small delay so user sees alert + SMS request completes
    setTimeout(() => {
      try {
        RNImmediatePhoneCall.immediatePhoneCall(firstPhone);
      } catch (e: any) {
        Alert.alert("Call failed", e?.message || "Unable to start call.");
      }
    }, 800);
  } catch (e: any) {
    console.log("sendSOS error:", e?.message || e);
    Alert.alert("SOS error", e?.message || "Failed to trigger SOS.");
  }
};