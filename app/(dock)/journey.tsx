import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type JourneyEvent = {
  time: string; // "09:10 AM"
  title: string;
  subtitle: string;
  type: "start" | "move" | "idle" | "flag" | "end";
};

type JourneySummary = {
  activeTime: string; // "3h 42m" or "0m"
  distance: string; // "5.8 km"
  sessions: string; // "2"
  zones: string; // "Mostly Safe"
};
type JourneyStatus = {
  status: "MOVING" | "IDLE" | "STOPPED";
  lastTs: string | null;
  lastLat?: number;
  lastLng?: number;
};
const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

export default function JourneyScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<JourneySummary>({
    activeTime: "0m",
    distance: "0.0 km",
    sessions: "0",
    zones: "No data yet",
  });

  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [status, setStatus] = useState<JourneyStatus>({ status: "STOPPED", lastTs: null });


  const todayDateKey = useMemo(() => {
    // local date YYYY-MM-DD
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const fetchTodayStatus = async () => {
  try {
    const res = await fetch(`${API_URL}/api/journey/${USER_ID}/today/status`);
    const data = await res.json();

    if (res.ok) {
      setStatus(data);
    }
  } catch (e) {
    console.log("Status fetch error:", e);
  }
};

  const fetchTodayJourney = async () => {
    try {
      const res = await fetch(`${API_URL}/api/journey/${USER_ID}/today`);
      const data = await res.json();
      
      if (!res.ok) {
        Alert.alert("Error", data?.message || "Failed to load journey");
        return;
      }

      // Backend returns:
      // { userId, date, summary: {activeTime, distance, sessions, zones}, events: [] }
      setSummary({
        activeTime: data?.summary?.activeTime ?? "0m",
        distance: data?.summary?.distance ?? "0.0 km",
        sessions: data?.summary?.sessions ?? "0",
        zones: data?.summary?.zones ?? "No data yet",
      });
      
      // Normalize events
      const apiEvents: JourneyEvent[] = Array.isArray(data?.events)
        ? data.events.map((e: any) => ({
            time: e.time ?? "--:--",
            title: e.title ?? "Event",
            subtitle: e.subtitle ?? "",
            type: (e.type as JourneyEvent["type"]) ?? "move",
          }))
        : [];

      setEvents(apiEvents);
      await fetchTodayStatus();
    } catch (err) {
      console.log("Journey fetch error:", err);
      Alert.alert("Network error", "Could not load journey. Check internet/backend.");
    }
  };
  useEffect(() => {
  (async () => {
    setLoading(true);
    await fetchTodayJourney();
    setLoading(false);
  })();
}, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayJourney();
    setRefreshing(false);
  };

  const dot = (type: JourneyEvent["type"]) => {
    switch (type) {
      case "start":
        return { icon: "play" as const, bg: "#FDF2F7", color: "#7A294E" };
      case "move":
        return { icon: "walk" as const, bg: "#FDF2F7", color: "#7A294E" };
      case "idle":
        return { icon: "pause" as const, bg: "#FDF2F7", color: "#7A294E" };
      case "flag":
        return { icon: "alert-circle" as const, bg: "#FFE9EE", color: "#C43B5A" };
      case "end":
        return { icon: "flag" as const, bg: "#FDF2F7", color: "#7A294E" };
      default:
        return { icon: "ellipse" as const, bg: "#FDF2F7", color: "#7A294E" };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Journey</Text>
            <Text style={styles.sub}>Daily timeline · {todayDateKey}</Text>
          </View>

          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardTitle}>Today · Summary</Text>
                <Text style={styles.cardSub}>Fetched from your backend</Text>
              </View>
              <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={status.status === "MOVING" ? "walk" : status.status === "IDLE" ? "pause" : "stop-circle"}
                  size={16}
                  color="#7A294E"
                />
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#7A294E" }}>
                  {status.status}
                  {status.lastTs ? ` · Last: ${new Date(status.lastTs).toLocaleTimeString("en-IN")}` : ""}
                </Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={16} color="#7A294E" />
                <Text style={styles.badgeText}>{summary.zones}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{summary.activeTime}</Text>
                <Text style={styles.metricLabel}>Active</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{summary.distance}</Text>
                <Text style={styles.metricLabel}>Distance</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{summary.sessions}</Text>
                <Text style={styles.metricLabel}>Sessions</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={18} color="#7A294E" />
              <Text style={styles.primaryBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            <Text style={styles.cardSub}>Key moments detected today</Text>

            {loading ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator />
                <Text style={{ textAlign: "center", marginTop: 10, color: "#A07A88", fontWeight: "700" }}>
                  Loading journey...
                </Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={20} color="#A07A88" />
                <Text style={styles.emptyText}>No journey events yet.</Text>
                <Text style={styles.emptySub}>
                  Once we start background tracking, your daily timeline will appear here.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                {events.map((e, idx) => {
                  const meta = dot(e.type);
                  const isLast = idx === events.length - 1;

                  return (
                    <View key={`${e.time}-${idx}`} style={styles.eventRow}>
                      <View style={styles.timelineCol}>
                        <View style={[styles.dot, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon} size={16} color={meta.color} />
                        </View>
                        {!isLast && <View style={styles.line} />}
                      </View>

                      <View style={styles.eventContent}>
                        <Text style={styles.eventTime}>{e.time}</Text>
                        <Text style={styles.eventTitle}>{e.title}</Text>
                        <Text style={styles.eventSub}>{e.subtitle}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={18} color="#7A294E" />
              <Text style={styles.noteText}>
                Journey is private. It shows your day as a timeline. Next step: background tracking + saving real events daily.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBF0" },
  bg: { flex: 1, paddingHorizontal: 18, paddingTop: 16 },

  header: { marginTop: 6, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "900", color: "#7A294E" },
  sub: { fontSize: 13, fontWeight: "600", color: "#A07A88", marginTop: 4 },

  card: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 18,
    marginTop: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#7A294E" },
  cardSub: { fontSize: 12, fontWeight: "600", color: "#A07A88", marginTop: 4 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF2F7",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: "#7A294E" },

  metricRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  metricBox: {
    flex: 1,
    backgroundColor: "#FFF7FB",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  metricValue: { fontSize: 16, fontWeight: "900", color: "#7A294E" },
  metricLabel: { fontSize: 11, fontWeight: "700", color: "#A07A88", marginTop: 3 },

  primaryBtn: {
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
  primaryBtnText: { fontSize: 13, fontWeight: "900", color: "#7A294E" },

  emptyBox: {
    marginTop: 14,
    backgroundColor: "#FFF7FB",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: "center",
  },
  emptyText: { marginTop: 8, fontSize: 13, fontWeight: "900", color: "#7A294E" },
  emptySub: { marginTop: 4, fontSize: 12, fontWeight: "600", color: "#A07A88", textAlign: "center" },

  eventRow: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  timelineCol: { width: 26, alignItems: "center" },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  line: { width: 2, flex: 1, backgroundColor: "#F3E5EC", marginTop: 6, borderRadius: 2 },
  eventContent: { flex: 1, paddingTop: 1 },
  eventTime: { fontSize: 11, fontWeight: "800", color: "#A07A88" },
  eventTitle: { fontSize: 14, fontWeight: "900", color: "#7A294E", marginTop: 2 },
  eventSub: { fontSize: 12, fontWeight: "600", color: "#A07A88", marginTop: 3 },

  noteBox: {
    marginTop: 14,
    backgroundColor: "#FDF2F7",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#7A294E", lineHeight: 16 },
});
