import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

type Log = {
  _id: string;
  intensity?: string;
  isAbnormal?: boolean;
  speed?: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
};

const fmt = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
};

export default function MovementLogsScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history/${USER_ID}/latest?limit=50`);
      const data = await res.json();
      if (res.ok) setLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (e) {
      // keep UI alive even if fetch fails
      setLogs([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLogs();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <View style={styles.header}>
          <Text style={styles.title}>Movement Logs</Text>
          <Text style={styles.sub}>Latest activity detected · {USER_ID}</Text>
        </View>

        {loading ? (
          <View style={{ paddingTop: 40 }}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading logs...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {logs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="pulse-outline" size={22} color="#A07A88" />
                <Text style={styles.emptyText}>No logs yet</Text>
                <Text style={styles.emptySub}>
                  Start tracking and make sure app is POSTing to /api/history
                </Text>
              </View>
            ) : (
              logs.map((l) => {
                const abnormal = !!l.isAbnormal;
                return (
                  <View key={l._id} style={[styles.card, abnormal && styles.abnormalCard]}>
                    <View style={styles.row}>
                      <Text style={styles.time}>{fmt(l.timestamp)}</Text>

                      {abnormal ? (
                        <View style={styles.badgeRed}>
                          <Ionicons name="alert-circle" size={14} color="#C43B5A" />
                          <Text style={styles.badgeRedText}>Abnormal</Text>
                        </View>
                      ) : (
                        <View style={styles.badge}>
                          <Ionicons name="checkmark-circle" size={14} color="#7A294E" />
                          <Text style={styles.badgeText}>Normal</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.intensity}>{l.intensity || "Idle"}</Text>
                    <Text style={styles.meta}>Speed: {(l.speed ?? 0).toFixed(2)} m/s</Text>
                    <Text style={styles.meta}>
                      Lat/Lng: {l.latitude != null ? l.latitude.toFixed(5) : "--"},{" "}
                      {l.longitude != null ? l.longitude.toFixed(5) : "--"}
                    </Text>
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
              <Ionicons name="refresh-outline" size={18} color="#7A294E" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { marginTop: 6, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "900", color: "#7A294E" },
  sub: { fontSize: 13, fontWeight: "600", color: "#A07A88", marginTop: 4 },

  loadingText: {
    textAlign: "center",
    marginTop: 10,
    color: "#A07A88",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  abnormalCard: { borderColor: "#C43B5A", backgroundColor: "#FFF0F3" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 12, fontWeight: "900", color: "#7A294E" },

  badge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#FDF2F7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: "#7A294E" },

  badgeRed: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#FFE9EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeRedText: { fontSize: 12, fontWeight: "900", color: "#C43B5A" },

  intensity: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#7A294E" },
  meta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#A07A88" },

  emptyBox: {
    marginTop: 20,
    backgroundColor: "#FFF7FB",
    borderRadius: 18,
    padding: 14,
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

  refreshBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#F6E6EE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#7A294E",
  },
  refreshText: { fontSize: 13, fontWeight: "900", color: "#7A294E" },
});