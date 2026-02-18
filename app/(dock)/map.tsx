import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, Region, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BACKEND_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

type Coord = { latitude: number; longitude: number };

export default function RealTimeMap() {
  const [myLocation, setMyLocation] = useState<Coord | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [lastSync, setLastSync] = useState<string>("--");

  const mapRef = useRef<MapView>(null);
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<any>(null);

  const initialRegion: Region | null = useMemo(() => {
    if (!myLocation) return null;
    return {
      latitude: myLocation.latitude,
      longitude: myLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [myLocation]);

  const fetchRoute = async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);

    try {
      setLoadingRoute(true);

      const res = await fetch(`${BACKEND_URL}/api/history/${USER_ID}/latest?limit=50`, {
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        console.log("Route fetch failed:", { status: res.status, json });
        return;
      }

      const coords: Coord[] = (json.logs || [])
        .filter((p: any) => p?.latitude != null && p?.longitude != null)
        .map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }))
        .reverse();

      setRouteCoords(coords);
      setLastSync(new Date().toLocaleTimeString("en-IN"));
    } catch (e: any) {
      console.log("Route fetch error:", e?.message || e);
    } finally {
      clearTimeout(t);
      setLoadingRoute(false);
    }
  };

  const recenter = () => {
    if (!myLocation) return;
    mapRef.current?.animateToRegion(
      {
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600
    );
  };

  const fitToRoute = () => {
    if (routeCoords.length < 2) {
      Alert.alert("No route yet", "Start tracking so we can draw your path.");
      return;
    }
    mapRef.current?.fitToCoordinates(routeCoords, {
      edgePadding: { top: 120, right: 80, bottom: 220, left: 80 },
      animated: true,
    });
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow location permission to use the Map.");
          setLoadingMap(false);
          return;
        }

        // Fast: last known
        const last = await Location.getLastKnownPositionAsync();
        if (!cancelled && last?.coords) {
          setMyLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
          setLoadingMap(false);
        }

        // Current: Balanced is faster than High
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setMyLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
          setLoadingMap(false);
        }

        // Watch: reduce load
        watchSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
          (loc) => {
            if (cancelled) return;
            setMyLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        );

        await fetchRoute();
        intervalRef.current = setInterval(fetchRoute, 15000);
      } catch (e: any) {
        console.log("Map init error:", e?.message || e);
        setLoadingMap(false);
      }
    };

    init();

    return () => {
      cancelled = true;

      if (watchSub.current) watchSub.current.remove();
      watchSub.current = null;

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, []);

  if (loadingMap || !initialRegion) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7A294E" />
        <Text style={styles.loadingText}>Loading SafeZones map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#7A294E" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={22} color="#7A294E" />
      </TouchableOpacity>

      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {/* OpenStreetMap tiles (no Google billing) */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={-1}
        />

        {myLocation && (
          <Marker coordinate={myLocation} title="You">
            <View style={styles.dotContainer}>
              <View style={styles.myPing} />
              <View style={styles.myMarker} />
            </View>
          </Marker>
        )}

        {routeCoords.length > 1 && <Polyline coordinates={routeCoords} strokeWidth={4} />}
      </MapView>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.statusTitle}>Shield Active</Text>
            <Text style={styles.statusText}>
              {loadingRoute
                ? "Syncing route..."
                : routeCoords.length > 1
                ? `Route ready · Points: ${routeCoords.length} · Updated: ${lastSync}`
                : `Waiting for route logs... · Updated: ${lastSync}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.testBtn, loadingRoute && { opacity: 0.7 }]}
            onPress={fitToRoute}
            disabled={loadingRoute}
          >
            <Text style={styles.testBtnText}>{loadingRoute ? "LOADING..." : "VIEW ROUTE"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={fetchRoute}>
            <Ionicons name="refresh" size={16} color="#7A294E" />
            <Text style={styles.smallBtnText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn} onPress={recenter}>
            <Ionicons name="navigate" size={16} color="#7A294E" />
            <Text style={styles.smallBtnText}>Recenter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFBF0",
  },
  loadingText: { marginTop: 10, color: "#8A5A6A", fontWeight: "700" },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
  },
  recenterBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
  },

  dotContainer: { justifyContent: "center", alignItems: "center", width: 44, height: 44 },
  myMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#007AFF",
    borderWidth: 3,
    borderColor: "white",
  },
  myPing: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 122, 255, 0.18)",
  },

  statusCard: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 25,
    elevation: 10,
  },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusTitle: { fontWeight: "bold", fontSize: 18, color: "#7A294E" },
  statusText: { color: "#8A5A6A", marginTop: 2, fontSize: 13, fontWeight: "600" },

  testBtn: { backgroundColor: "#7A294E", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  testBtnText: { color: "white", fontSize: 10, fontWeight: "bold" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    backgroundColor: "#FFFBF0",
    flex: 1,
    justifyContent: "center",
  },
  smallBtnText: { fontSize: 12, fontWeight: "800", color: "#7A294E" },
});