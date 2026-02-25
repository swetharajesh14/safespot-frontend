import React, { useEffect, useRef, useState } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { startJourneyTracking } from "../tasks/locationTask";

export default function RootLayout() {
  const startedOnce = useRef(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (startedOnce.current) return;
        startedOnce.current = true;

        // Check permissions first
        const fgStatus = await Location.getForegroundPermissionsAsync();
        const bgStatus = await Location.getBackgroundPermissionsAsync();

        if (fgStatus.status !== "granted" || bgStatus.status !== "granted") {
          // Navigate to permission page
          console.log("⚠️ Location permissions not granted, showing permission page");
          return;
        }

        // Permissions granted, start tracking
        await startJourneyTracking();
        console.log("✅ Auto Journey tracking started");
        setPermissionChecked(true);
      } catch (e: any) {
        console.log("⚠️ Tracking not started:", e?.message || e);
      }
    })();
  }, []);

  // Show permission page if permissions not granted, otherwise show normal app
  if (!permissionChecked) {
    return (
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}