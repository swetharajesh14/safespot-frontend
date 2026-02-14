import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import { sendSOS } from "../utils/sendSOS";
import { Alert } from "react-native";
import * as SMS from "expo-sms";

const FORCE_ABNORMAL = false; // ✅ true for testing, false for real detection

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

let accelSub: any = null;
let gyroSub: any = null;
let lastAccel = { x: 0, y: 0, z: 0 };
let lastGyro = { x: 0, y: 0, z: 0 };
let timer: any = null;
let sosCooldown = false;

export const startMotionTracking = async () => {
  await Location.requestForegroundPermissionsAsync();

  Accelerometer.setUpdateInterval(500);
  Gyroscope.setUpdateInterval(500);

  accelSub = Accelerometer.addListener((d) => (lastAccel = d));
  gyroSub = Gyroscope.addListener((d) => (lastGyro = d));

  timer = setInterval(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const payload = {
        userId: USER_ID,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        speed: loc.coords.speed ?? 0,
        accelX: lastAccel.x,
        accelY: lastAccel.y,
        accelZ: lastAccel.z,
        gyroX: lastGyro.x,
        gyroY: lastGyro.y,
        gyroZ: lastGyro.z,
      };

      const res = await fetch(`${API_URL}/api/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
let data: any = {};
try {
  data = text ? JSON.parse(text) : {};
} catch {
  console.log("history response not JSON:", text);
}

if ((FORCE_ABNORMAL || data?.isAbnormal === true) && !sosCooldown) {
  sosCooldown = true;

  Alert.alert(
    "Are you safe?",
    "Abnormal movement detected.",
    [
      { text: "Yes", onPress: () => (sosCooldown = false) },
      {
        text: "No",
        style: "destructive",
        onPress: async () => {
          await sendSOS(payload.latitude, payload.longitude, "User selected NO");
          sosCooldown = false;
        },
      },
    ]
  );

  setTimeout(async () => {
    if (sosCooldown) {
      await sendSOS(payload.latitude, payload.longitude, "No response - auto SOS");
      sosCooldown = false;
    }
  }, 15000);
} 
    } catch (e) {
      console.log("motion tick error", e);
    }
  }, 2000);
};

export const stopMotionTracking = () => {
  if (timer) clearInterval(timer);
  timer = null;

  if (accelSub) accelSub.remove();
  if (gyroSub) gyroSub.remove();

  accelSub = null;
  gyroSub = null;
};