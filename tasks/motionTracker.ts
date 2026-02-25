import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import { sendSOS } from "../utils/sendSOS";
import { Alert } from "react-native";
import { BACKEND_URL, USER_ID } from "../constants/api";

const FORCE_ABNORMAL = false; // true for testing, false for real detection
const TESTING_MODE = false; // Toggle: true = Test Mode (no backend), false = Production Mode
const API_URL = BACKEND_URL;

// Get emergency contact from user's circle (first protector)
const getEmergencyContact = async () => {
  try {
    const res = await fetch(`${API_URL}/api/protectors/${USER_ID}`);
    if (!res.ok) return "+911234567890"; // Fallback
    
    const data = await res.json();
    const protectors = data || [];
    const firstProtector = protectors[0]; // Get first person from circle
    
    return firstProtector?.phone || "+911234567890"; // Use first protector or fallback
  } catch (e) {
    console.log("Failed to get emergency contact:", e);
    return "+911234567890"; // Fallback
  }
};

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

let isTracking = false; // ✅ Track if motion tracking is active

export const startMotionTracking = async () => {
  if (isTracking) return; // ✅ Don't start if already running
  
  isTracking = true;
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

      if (TESTING_MODE) {
        // Testing Mode - Skip backend call
        console.log(" [TEST MODE] Motion data would be sent to backend");
        console.log(" [TEST MODE] Payload:", JSON.stringify(payload, null, 2));
        
        // Simulate successful response
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(" [TEST MODE] Backend response simulated: 200");
        
        // Simulate abnormal detection for testing
        const simulatedResponse = { isAbnormal: FORCE_ABNORMAL };
        
        if ((simulatedResponse.isAbnormal) && !sosCooldown) {
          console.log(" [TEST MODE] Simulated abnormal movement detected");
          sosCooldown = true;
          
          Alert.alert(" Test Mode - Are you safe?", "Simulated abnormal movement detected.", [
            { text: "Yes", onPress: () => (sosCooldown = false) },
            {
              text: "No",
              style: "destructive",
              onPress: async () => {
                console.log(" [TEST MODE] User pressed NO - automatic SOS triggered");
                sosCooldown = false;
                
                // Test Mode - Automatic SMS and Call within 10 seconds
                setTimeout(async () => {
                  console.log(" [TEST MODE] Automatic SOS activated!");
                  console.log(" [TEST MODE] Using sendSOS function for real emergency contact...");
                  
                  const fallbackLat = locationData?.coords?.latitude || 0;
                  const fallbackLng = locationData?.coords?.longitude || 0;
                  
                  // Use real sendSOS function (it will use first protector from circle)
                  await sendSOS(fallbackLat, fallbackLng, "User selected NO - Immediate SOS", true);
                  
                  Alert.alert(
                    " Test Mode - Automatic SOS",
                    `User pressed NO - Automatic SOS sent!\n\n✅ SMS sent to first protector\n📞 Emergency call initiated to first protector`,
                    [{ text: "OK", style: "default" }]
                  );
                }, 10000); //10 seconds
              },
            },
          ]);

          // Test Mode - Auto SOS after 15 seconds if no response
          setTimeout(async () => {
            if (sosCooldown) {
              console.log(" [TEST MODE] No response - sending automatic SOS");
              console.log(" [TEST MODE] Would send SMS and make emergency call");
              
              // Simulate SMS
              console.log(" [TEST MODE] SMS would be sent to +911234567890");
              console.log(" [TEST MODE] Message: User Swetha_01 detected abnormal movement - Auto SOS triggered");
              
              // Simulate call
              console.log(" [TEST MODE] Would call +911234567890");
              
              Alert.alert(
                " Test Mode - Auto SOS Triggered",
                "No response received - Automatic SOS sent!\n\nSMS: User Swetha_01 detected abnormal movement\nCall: Would call +911234567890",
                [{ text: "OK", style: "default" }]
              );
              
              sosCooldown = false;
            }
          }, 15000); // 15 seconds
        }
        
        inFlight = false;
        return;
      }

      // Production Mode - Real backend call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      let res: Response;
      try {
        console.log(" Sending motion data to backend...");
        console.log(" Payload:", JSON.stringify(payload, null, 2));
        console.log(" Motion Data - Accel:", { x: lastAccel.x, y: lastAccel.y, z: lastAccel.z });
        console.log(" Motion Data - Gyro:", { x: lastGyro.x, y: lastGyro.y, z: lastGyro.z });
        console.log(" Motion Data - Location:", { lat: locationData.coords.latitude, lng: locationData.coords.longitude, speed: locationData.coords.speed });
        
        res = await fetch(`${API_URL}/api/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        console.log(" Backend response received:", res.status);
      } catch (fetchError: any) {
        console.log(" Fetch error:", fetchError?.message || fetchError);
        throw fetchError;
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
              console.log(" User pressed NO - sending automatic SOS");
              const fallbackLat = locationData?.coords?.latitude || 0;
              const fallbackLng = locationData?.coords?.longitude || 0;
              
              // Use sendSOS function which already handles emergency contacts correctly
              await sendSOS(fallbackLat, fallbackLng, "User selected NO", true);
              sosCooldown = false;
            },
          },
        ]);

        setTimeout(async () => {
          if (sosCooldown) {
            console.log(" No response - sending automatic SOS");
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
      console.log("Error details:", {
        name: e?.name,
        code: e?.code,
        stack: e?.stack,
        timestamp: new Date().toISOString()
      });

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
  isTracking = false; // ✅ Mark as stopped
  
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