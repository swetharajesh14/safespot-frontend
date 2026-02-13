import React, { useEffect, useRef } from "react";
import { Slot } from "expo-router";
import { startJourneyTracking } from "../tasks/locationTask";

export default function RootLayout() {
  const startedOnce = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        if (startedOnce.current) return;
        startedOnce.current = true;

        await startJourneyTracking();
        console.log("✅ Auto Journey tracking started");
      } catch (e: any) {
        console.log("⚠️ Tracking not started:", e?.message || e);
      }
    })();
  }, []);

  // ✅ IMPORTANT: must mount navigation immediately
  return <Slot />;
}