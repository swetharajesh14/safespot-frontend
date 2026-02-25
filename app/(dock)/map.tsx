import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  Alert,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

type Coord = { latitude: number; longitude: number };

export default function MapScreen() {
  const webRef = useRef<WebView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const [loc, setLoc] = useState<Coord | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) HTML for Leaflet map (dark tiles + dot + updateLocation function)
  const html = useMemo(() => {
    const lat = loc?.latitude ?? 9.9252;
    const lng = loc?.longitude ?? 78.1198;

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html, body, #map { height:100%; margin:0; padding:0; background:#111; }
    .leaflet-control-attribution { display:none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const startLat = ${lat};
    const startLng = ${lng};

    const map = L.map('map', { zoomControl: false }).setView([startLat, startLng], 16);

    // Dark tiles (if blocked in your network, tell me - I'll give alternate)
    L.tileLayer('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    const dot = L.circleMarker([startLat, startLng], {
      radius: 8,
      color: '#4da3ff',
      weight: 3,
      fillColor: '#4da3ff',
      fillOpacity: 0.9
    }).addTo(map);

    // Called from React Native via injectedJavaScript
    window.updateLocation = function(lat, lng) {
      dot.setLatLng([lat, lng]);
      map.panTo([lat, lng], { animate: true, duration: 0.4 });
    };
  </script>
</body>
</html>`;
  }, [loc]);

  // 2) Get first location + start live tracking
  useEffect(() => {
    let alive = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Location permission is required to show the map.");
        setLoading(false);
        return;
      }

      const first = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === "android" ? Location.Accuracy.High : Location.Accuracy.Highest,
      });

      if (!alive) return;

      const firstLoc: Coord = {
        latitude: first.coords.latitude,
        longitude: first.coords.longitude,
      };

      setLoc(firstLoc);
      setLoading(false);

      // Start watching movement
      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy:
            Platform.OS === "android"
              ? Location.Accuracy.High
              : Location.Accuracy.Highest,
          timeInterval: 2000,      // every 2s
          distanceInterval: 2,     // or every 2 meters
        },
        (pos) => {
          const next: Coord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };

          setLoc(next);

          // Push new location into Leaflet (update dot + pan)
          const js = `window.updateLocation(${next.latitude}, ${next.longitude}); true;`;
          webRef.current?.injectJavaScript(js);
        }
      );
    })();

    return () => {
      alive = false;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#aaa" }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: "#111" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
});