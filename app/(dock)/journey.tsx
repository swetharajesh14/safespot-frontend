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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type JourneyEvent = {
  time: string;
  title: string;
  subtitle: string;
  type: "start" | "move" | "idle" | "flag" | "end";
};

type JourneySummary = {
  activeTime: string;
  distance: string;
  sessions: string;
  zones: string;
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

      setSummary({
        activeTime: data?.summary?.activeTime ?? "0m",
        distance: data?.summary?.distance ?? "0.0 km",
        sessions: data?.summary?.sessions ?? "0",
        zones: data?.summary?.zones ?? "No data yet",
      });
      
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
      {/* Set translucent to true so gradient goes to the top, but text stays below icons */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Today · Summary</Text>
                <Text style={styles.cardSub}>Fetched from your backend</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={14} color="#7A294E" />
                <Text style={styles.badgeText}>{summary.zones}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Ionicons
                name={status.status === "MOVING" ? "walk" : status.status === "IDLE" ? "pause" : "stop-circle"}
                size={16}
                color="#7A294E"
              />
              <Text style={styles.statusText}>
                {status.status}
                {status.lastTs ? ` · Last: ${new Date(status.lastTs).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}` : ""}
              </Text>
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

          {/* Timeline Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            <Text style={styles.cardSub}>Key moments detected today</Text>

            {loading ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator color="#7A294E" />
                <Text style={styles.loadingText}>Loading journey...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={24} color="#A07A88" />
                <Text style={styles.emptyText}>No journey events yet.</Text>
                <Text style={styles.emptySub}>
                  Once we start background tracking, your daily timeline will appear here.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                {events.map((e, idx) => {
                  const meta = dot(e.type);
                  const isLast = idx === events.length - 1;

                  return (
                    <View key={`${e.time}-${idx}`} style={styles.eventRow}>
                      <View style={styles.timelineCol}>
                        <View style={[styles.dot, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon} size={14} color={meta.color} />
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
                Journey is private. Next step: background tracking + saving real events daily.
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
  
  bg: { 
    flex: 1, 
    paddingHorizontal: 18, 
    // This dynamically calculates space for the Status Bar + a generous 2-inch feel (approx 60-80px total)
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 50 : 90, 
    paddingBottom: 20 
  },

  header: { marginBottom: 15 },
  title: { fontSize: 32, fontWeight: "900", color: "#7A294E" },
  sub: { fontSize: 13, fontWeight: "600", color: "#A07A88", marginTop: 4 },

  card: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    marginTop: 15,
    elevation: 3,
    shadowColor: "#7A294E",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },

  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#7A294E" },
  cardSub: { fontSize: 12, fontWeight: "600", color: "#A07A88", marginTop: 2 },

  statusRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    marginTop: 12,
    backgroundColor: "#FDF2F7",
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: { fontSize: 12, fontWeight: "800", color: "#7A294E", textTransform: 'uppercase' },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7FB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3E5EC'
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#7A294E" },

  metricRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  metricBox: {
    flex: 1,
    backgroundColor: "#FFF7FB",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: 'center'
  },
  metricValue: { fontSize: 16, fontWeight: "900", color: "#7A294E" },
  metricLabel: { fontSize: 11, fontWeight: "700", color: "#A07A88", marginTop: 4 },

  primaryBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#F6E6EE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#7A294E",
  },
  primaryBtnText: { fontSize: 14, fontWeight: "900", color: "#7A294E" },

  loadingText: { textAlign: "center", marginTop: 12, color: "#A07A88", fontWeight: "700" },

  emptyBox: {
    marginTop: 20,
    backgroundColor: "#FFF7FB",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: "center",
  },
  emptyText: { marginTop: 10, fontSize: 14, fontWeight: "900", color: "#7A294E" },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: "600", color: "#A07A88", textAlign: "center", lineHeight: 18 },

  eventRow: { flexDirection: "row", gap: 15, paddingVertical: 12 },
  timelineCol: { width: 30, alignItems: "center" },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", elevation: 1 },
  line: { width: 2, flex: 1, backgroundColor: "#F3E5EC", marginTop: 5, borderRadius: 2 },
  eventContent: { flex: 1, paddingTop: 2 },
  eventTime: { fontSize: 11, fontWeight: "800", color: "#A07A88" },
  eventTitle: { fontSize: 15, fontWeight: "900", color: "#7A294E", marginTop: 2 },
  eventSub: { fontSize: 12, fontWeight: "600", color: "#A07A88", marginTop: 4, lineHeight: 18 },

  noteBox: {
    marginTop: 20,
    backgroundColor: "#FDF2F7",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  noteText: { flex: 1, fontSize: 11, fontWeight: "600", color: "#7A294E", lineHeight: 16 },
});