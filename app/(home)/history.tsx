import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type HistoryLog = {
  _id: string;
  userId: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  intensity?: string;
  isAbnormal?: boolean;
  timestamp?: string;
};

const BACKEND_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

const fmt = (iso?: string) => {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
};

export default function HistoryScreen() {
  const router = useRouter();

  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("--");

  // ✅ Works on both RN (number) and Node typings (Timeout)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/history/${USER_ID}/latest?limit=50`
      );
      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Failed to load history logs");
        return;
      }

      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (e: any) {
      console.log("history fetch error", e);
      Alert.alert("Network error", e?.message || "Backend not reachable");
    }
  };

  const postTestLog = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          speed: 0.5,
          accelX: 5,
          accelY: 3,
          accelZ: 2,
          gyroX: 0,
          gyroY: 0,
          gyroZ: 0,
          latitude: 9.94,
          longitude: 78.12,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("POST failed", data?.error || data?.message || "error");
        return;
      }

      Alert.alert(
        "Posted ✅",
        `Intensity: ${data?.intensity ?? "--"}, Abnormal: ${data?.isAbnormal ?? "--"}`
      );

      await fetchLogs();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed");
    }
  };

  // ✅ Single effect only (no duplicates)
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      await fetchLogs();
      if (isMounted) setLoading(false);
    })();

    intervalRef.current = setInterval(fetchLogs, 5000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]}
        style={styles.bg}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#7A294E" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Movement Logs</Text>
            <Text style={styles.sub}>
              Live backend · {USER_ID} · Updated: {lastUpdated}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
            <Ionicons
              name="refresh"
              size={16}
              color="#7A294E"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshBtn} onPress={postTestLog}>
            <Ionicons
              name="add-circle-outline"
              size={16}
              color="#7A294E"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.refreshText}>Test Log</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.countText}>Total shown: {logs.length}</Text>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {loading ? (
            <View style={{ paddingTop: 20 }}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading logs...</Text>
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#A07A88" />
              <Text style={styles.emptyText}>No logs found.</Text>
              <Text style={styles.emptySub}>
                Start tracking and ensure the app is POSTing to /api/history.
              </Text>
            </View>
          ) : (
            logs.map((l) => (
              <View key={l._id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.time}>{fmt(l.timestamp)}</Text>

                  {l.isAbnormal ? (
                    <View style={styles.badgeDanger}>
                      <Ionicons
                        name="warning"
                        size={14}
                        color="#C43B5A"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.badgeDangerText}>ABNORMAL</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeOk}>
                      <Text style={styles.badgeOkText}>NORMAL</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.intensity}>
                  Intensity:{" "}
                  <Text style={{ fontWeight: "900" }}>
                    {l.intensity || "Idle"}
                  </Text>
                </Text>

                <Text style={styles.meta}>
                  Speed: {(l.speed ?? 0).toFixed(2)} m/s
                </Text>

                <Text style={styles.meta}>
                  Accel: {(l.accelX ?? 0).toFixed(2)}, {(l.accelY ?? 0).toFixed(2)}
                  , {(l.accelZ ?? 0).toFixed(2)}
                </Text>

                <Text style={styles.meta}>
                  Gyro: {(l.gyroX ?? 0).toFixed(2)}, {(l.gyroY ?? 0).toFixed(2)}
                  , {(l.gyroZ ?? 0).toFixed(2)}
                </Text>

                {l.latitude != null && l.longitude != null && (
                  <Text style={styles.meta}>
                    Location: {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingTop: 50, paddingHorizontal: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  title: { fontSize: 26, fontWeight: "900", color: "#7A294E" },
  sub: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#A07A88" },

  btnRow: { flexDirection: "row", marginTop: 10 },
  refreshBtn: {
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7A294E",
    backgroundColor: "#FDF2F7",
  },
  refreshText: { fontSize: 12, fontWeight: "900", color: "#7A294E" },

  countText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: "#7A294E",
    opacity: 0.85,
  },

  loadingText: {
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
    color: "#A07A88",
  },

  emptyBox: {
    marginTop: 18,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: "center",
  },
  emptyText: { marginTop: 8, fontSize: 13, fontWeight: "900", color: "#7A294E" },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#A07A88",
    textAlign: "center",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: { fontSize: 12, fontWeight: "800", color: "#A07A88" },

  badgeOk: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F6E6EE",
  },
  badgeOkText: { fontSize: 11, fontWeight: "900", color: "#7A294E" },

  badgeDanger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFE9EE",
  },
  badgeDangerText: { fontSize: 11, fontWeight: "900", color: "#C43B5A" },

  intensity: { marginTop: 8, fontSize: 13, fontWeight: "800", color: "#7A294E" },
  meta: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#A07A88" },
});