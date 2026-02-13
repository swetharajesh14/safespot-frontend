import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Region } from "react-native-maps";
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
    try {
      setLoadingRoute(true);
      const res = await fetch(`${BACKEND_URL}/api/history/${USER_ID}/latest?limit=250`);
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        console.log("Route fetch failed:", json);
        return;
      }

      const coords: Coord[] = (json.logs || [])
        .filter((p: any) => p?.latitude != null && p?.longitude != null)
        .map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }))
        .reverse(); // older -> newer

      setRouteCoords(coords);
      setLastSync(new Date().toLocaleTimeString("en-IN"));
    } catch (e: any) {
      console.log("Route fetch error:", e?.message || e);
      // Don't spam alerts; just log.
    } finally {
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
    (async () => {
      try {
        // 1) Permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow location permission to use SafeZones Map.");
          setLoadingMap(false);
          return;
        }

        // 2) Get current location once (fast initial marker)
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setMyLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setLoadingMap(false);

        // 3) Watch live location
        watchSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => {
            setMyLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );

        // 4) Fetch route from backend immediately + refresh periodically
        await fetchRoute();
        const id = setInterval(fetchRoute, 8000);

        return () => clearInterval(id);
      } catch (e: any) {
        console.log("Map init error:", e?.message || e);
        setLoadingMap(false);
      }
    })();

    return () => {
      if (watchSub.current) watchSub.current.remove();
      watchSub.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingMap || !initialRegion) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7A294E" />
        <Text style={{ marginTop: 10, color: "#8A5A6A", fontWeight: "700" }}>
          Loading SafeZones map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#7A294E" />
      </TouchableOpacity>

      {/* Recenter */}
      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={22} color="#7A294E" />
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false} // we render our own marker to match your UI
        showsMyLocationButton={false}
      >
        {/* You */}
        {myLocation && (
          <Marker coordinate={myLocation} title="You">
            <View style={styles.dotContainer}>
              <View style={styles.myPing} />
              <View style={styles.myMarker} />
            </View>
          </Marker>
        )}

        {/* Route line */}
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#7A294E" />
        )}
      </MapView>

      {/* Status Card */}
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

  // Markers
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

  testBtn: {
    backgroundColor: "#7A294E",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  testBtnText: { color: "white", fontSize: 10, fontWeight: "bold" },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
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