import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import { sendWhatsApp, makeCall } from "../utils/sos";

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

// put your emergency number (with country code)
const EMERGENCY_PHONE = "91XXXXXXXXXX";

let accelSub: any = null;
let gyroSub: any = null;
let lastAccel = { x: 0, y: 0, z: 0 };
let lastGyro = { x: 0, y: 0, z: 0 };
let timer: any = null;
let sosCooldown = false;

export const startMotionTracking = async () => {
  // permissions
  await Location.requestForegroundPermissionsAsync();

  Accelerometer.setUpdateInterval(500);
  Gyroscope.setUpdateInterval(500);

  accelSub = Accelerometer.addListener((d) => (lastAccel = d));
  gyroSub = Gyroscope.addListener((d) => (lastGyro = d));

  timer = setInterval(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

      const data = await res.json();

      if (data?.isAbnormal === true && !sosCooldown) {
        sosCooldown = true;

        const msg =
          `SOS! Abnormal movement detected.\n` +
          `Intensity: ${data.intensity}\n` +
          `Location: https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;

        // WhatsApp + call
        await sendWhatsApp(EMERGENCY_PHONE, msg);
        await makeCall(EMERGENCY_PHONE);

        // cooldown 2 minutes to avoid spam
        setTimeout(() => (sosCooldown = false), 2 * 60 * 1000);
      }
    } catch (e) {
      // keep silent to avoid crash loop
      console.log("motion tick error", e);
    }
  }, 2000); // every 2 sec
};

export const stopMotionTracking = async () => {
  if (timer) clearInterval(timer);
  timer = null;

  if (accelSub) accelSub.remove();
  if (gyroSub) gyroSub.remove();
  accelSub = null;
  gyroSub = null;
};