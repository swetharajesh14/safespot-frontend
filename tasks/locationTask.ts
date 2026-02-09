import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

export const TASK_NAME = "SAFE_SPOT_BG_LOCATION_TASK";
const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

const getDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
};
const fmtTime = (d: string | number | Date) =>
  new Date(d).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
// ✅ Define task ONCE
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  try {
    if (error) {
      console.log("BG Task error:", error);
      return;
    }

    const locations = (data as any)?.locations as Location.LocationObject[] | undefined;
    if (!locations || locations.length === 0) return;

    const loc = locations[0];
    const { latitude, longitude, speed, accuracy } = loc.coords;

    await fetch(`${API_URL}/api/journey/point`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        dateKey: getDateKey(),
        ts: new Date(loc.timestamp).toISOString(),
        lat: latitude,
        lng: longitude,
        speed: speed ?? 0,
        accuracy: accuracy ?? 0,
      }),
    });
  } catch (e) {
    console.log("BG send error:", e);
  }
});

export const startJourneyTracking = async () => {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") throw new Error("Foreground permission not granted");

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") throw new Error("Background permission not granted");

  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) return;

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10,
    foregroundService: {
      notificationTitle: "SafeSpot Tracking",
      notificationBody: "Tracking your journey",
    },
  });
};
export const stopJourneyTracking = async () => {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (!started) return;
  await Location.stopLocationUpdatesAsync(TASK_NAME);
};

export const isJourneyTrackingOn = async () => {
  return await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
};
