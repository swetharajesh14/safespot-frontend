import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import { sendSOS } from "../utils/sendSOS";
import { Alert } from "react-native";
import { BACKEND_URL, USER_ID } from "../constants/api";

const FORCE_ABNORMAL = false; // true for testing, false for real detection
const API_URL = BACKEND_URL;

let accelSub: any = null;
let gyroSub: any = null;
let lastAccel = { x: 0, y: 0, z: 0 };
let lastGyro = { x: 0, y: 0, z: 0 };
let timer: any = null;

let sosCooldown = false;

// ✅ Network stability controls
let inFlight = false;        // prevents overlapping requests
let failureCount = 0;        // used for backoff
let pauseUntil = 0;          // timestamp until we pause sending again

export const startMotionTracking = async () => {
  await Location.requestForegroundPermissionsAsync();

  // You can keep 500ms if needed, but 1000ms is lighter on battery:
  Accelerometer.setUpdateInterval(500);
  Gyroscope.setUpdateInterval(500);

  accelSub = Accelerometer.addListener((d) => (lastAccel = d));
  gyroSub = Gyroscope.addListener((d) => (lastGyro = d));

  timer = setInterval(async () => {
    const now = Date.now();
    if (inFlight) return;            // ✅ do not overlap requests
    if (now < pauseUntil) return;    // ✅ backoff after failures

    let locationData: any = null;

    try {
      // 1) Get location
      locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 2) Prepare payload
      const payload = {
        userId: USER_ID,
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        speed: locationData.coords.speed ?? 0,
        accelX: lastAccel.x,
        accelY: lastAccel.y,
        accelZ: lastAccel.z,
        gyroX: lastGyro.x,
        gyroY: lastGyro.y,
        gyroZ: lastGyro.z,
      };

      // 3) Send to backend (AbortController cancels properly)
      inFlight = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s

      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        console.log("API error:", res.status);

        // backoff if server returns errors
        failureCount += 1;
        pauseUntil = Date.now() + Math.min(60000, failureCount * 5000); // max 60s
        return;
      }

      // success => reset backoff
      failureCount = 0;
      pauseUntil = 0;

      // Parse JSON safely
      const data = await res.json().catch(() => ({}));

      // 4) Abnormal check (server result)
      if ((FORCE_ABNORMAL || data?.isAbnormal === true) && !sosCooldown) {
        sosCooldown = true;

        Alert.alert("Are you safe?", "Abnormal movement detected.", [
          { text: "Yes", onPress: () => (sosCooldown = false) },
          {
            text: "No",
            style: "destructive",
            onPress: async () => {
              console.log("🚨 User pressed NO - sending automatic SOS");
              const fallbackLat = locationData?.coords?.latitude || 0;
              const fallbackLng = locationData?.coords?.longitude || 0;
              await sendSOS(fallbackLat, fallbackLng, "User selected NO", true);
              sosCooldown = false;
            },
          },
        ]);

        setTimeout(async () => {
          if (sosCooldown) {
            console.log("🚨 No response - sending automatic SOS");
            const fallbackLat = locationData?.coords?.latitude || 0;
            const fallbackLng = locationData?.coords?.longitude || 0;
            await sendSOS(fallbackLat, fallbackLng, "No response - auto SOS", true);
            sosCooldown = false;
          }
        }, 15000);
      }
    } catch (e: any) {
      console.log("motion tick error", e?.message || e);

      // If network/location fails, increase backoff (prevents spam)
      failureCount += 1;
      pauseUntil = Date.now() + Math.min(60000, failureCount * 5000);

      // Local motion analysis fallback (if location/fetch failed)
      try {
        const accelMagnitude = Math.sqrt(
          Math.pow(lastAccel.x, 2) + Math.pow(lastAccel.y, 2) + Math.pow(lastAccel.z, 2)
        );

        const gyroMagnitude = Math.sqrt(
          Math.pow(lastGyro.x, 2) + Math.pow(lastGyro.y, 2) + Math.pow(lastGyro.z, 2)
        );

        const isAbnormalMotion = accelMagnitude > 15 || gyroMagnitude > 8;

        if ((FORCE_ABNORMAL || isAbnormalMotion) && !sosCooldown) {
          console.log("🚨 Local abnormal motion detected:", { accelMagnitude, gyroMagnitude });
          sosCooldown = true;

          Alert.alert("Are you safe?", "Abnormal movement detected.", [
            { text: "Yes", onPress: () => (sosCooldown = false) },
            {
              text: "No",
              style: "destructive",
              onPress: async () => {
                console.log("🚨 User pressed NO - sending automatic SOS");
                await sendSOS(0, 0, "User selected NO", true);
                sosCooldown = false;
              },
            },
          ]);

          setTimeout(async () => {
            if (sosCooldown) {
              console.log("🚨 No response - sending automatic SOS");
              await sendSOS(0, 0, "No response - auto SOS", true);
              sosCooldown = false;
            }
          }, 15000);
        }
      } catch (localError) {
        console.log("Local analysis error:", localError);
      }
    } finally {
      inFlight = false;
    }
  }, 8000);
};

export const stopMotionTracking = () => {
  if (timer) clearInterval(timer);
  timer = null;

  if (accelSub) accelSub.remove();
  if (gyroSub) gyroSub.remove();

  accelSub = null;
  gyroSub = null;

  // reset state
  sosCooldown = false;
  inFlight = false;
  failureCount = 0;
  pauseUntil = 0;
};