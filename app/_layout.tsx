import React, { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { startJourneyTracking } from "../tasks/locationTask";

export default function RootLayout() {
  const startedOnce = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        if (startedOnce.current) return;
        startedOnce.current = true;

        // ✅ Auto-start tracking when app is opened
        await startJourneyTracking();
        console.log("✅ Auto Journey tracking started");
      } catch (e: any) {
        console.log("⚠️ Tracking not started:", e?.message || e);
        // Don’t alert here (annoying). We can show status in Settings later.
      }
    })();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(dock)" />
      <Stack.Screen name="(home)" />
    </Stack>
  );
}
