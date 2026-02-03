import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

export const TASK_NAME = "SAFE_SPOT_BG_LOCATION_TASK";
const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

const getDateKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60_000,
    distanceInterval: 30,
    pausesUpdatesAutomatically: true,
    foregroundService: {
      notificationTitle: "SafeSpot is tracking",
      notificationBody: "Journey tracking is active",
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
let fgSubscription: Location.LocationSubscription | null = null;

export const startForegroundTracking = async () => {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") throw new Error("Foreground permission not granted");

  if (fgSubscription) return; // already running

  fgSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10_000,    // every 10 sec
      distanceInterval: 10,    // or every 10 meters
    },
    async (loc) => {
      try {
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
        console.log("FG send error:", e);
      }
    }
  );
};

export const stopForegroundTracking = async () => {
  if (fgSubscription) {
    fgSubscription.remove();
    fgSubscription = null;
  }
};

export const isForegroundTrackingOn = () => {
  return !!fgSubscription;
};
