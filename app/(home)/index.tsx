// app/(home)/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";

import { startMotionTracking } from "../../tasks/motionTracker";
import { BACKEND_URL, USER_ID } from "../../constants/api";

const { width } = Dimensions.get("window");

type Protector = {
  _id: string;
  name: string;
  photo: string;
  phone: string;
};

type Profile = {
  userId: string;
  name: string;
  photo?: string;
};

type SummaryPoint = {
  label: string;
  activeMins: number;
  avgSpeed: number;
  stability: number;
  totalLogs: number;
  abnormalLogs: number;
};

type SummaryResponse = {
  ok: boolean;
  range: "day" | "week" | "month";
  dateKey?: string;
  cards: {
    activeTime: string;
    avgSpeed: string;
    stability: string;
    intensity: string;
  };
  series: SummaryPoint[];
};

export default function SafeSpotIndex() {
  const nav = useRouter();

  const [protectors, setProtectors] = useState<Protector[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [protectedOn, setProtectedOn] = useState(true);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ✅ start tracking
  useEffect(() => {
    startMotionTracking();
  }, []);

  // -------------------------
  // Profile (DB)
  // -------------------------
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/${USER_ID}`);
      if (!res.ok) return;

      const data = await res.json();
      setProfile({
        userId: data.userId || USER_ID,
        name: data.name || "User",
        photo: data.photo,
      });
    } catch (e) {
      console.log("Fetch profile failed:", e);
    }
  };

  // -------------------------
  // Protectors
  // -------------------------
  const fetchProtectors = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/protectors/${USER_ID}`);
      if (!res.ok) return;

      const data = await res.json();

      const formatted = data.map((p: any) => ({
        _id: String(p._id),
        name: p.name,
        photo: p.photo || "https://via.placeholder.com/150",
        phone: p.phone,
      }));

      setProtectors(formatted);
    } catch (e) {
      console.log("Fetch protectors failed:", e);
    }
  };

  const deleteProtector = async (protectorId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/protectors/${protectorId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Delete failed", data?.message || "Server error");
        return;
      }

      setProtectors((prev) => prev.filter((p) => p._id !== protectorId));
      Alert.alert("Removed", "Protector removed successfully");
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Network error");
    }
  };

  const handleAddProtector = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow contact access.");
      return;
    }

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const payload = {
        userId: USER_ID,
        name: contact.firstName || "Protector",
        photo: contact.image?.uri || "https://via.placeholder.com/150",
        phone: contact.phoneNumbers?.[0]?.number || "0000000000",
      };

      const res = await fetch(`${BACKEND_URL}/api/protectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert("Success", "Protector added to your circle!");
        fetchProtectors();
      } else {
        Alert.alert("Error", "Server failed to save contact.");
      }
    } catch (e) {
      console.log("Add protector failed:", e);
      Alert.alert("Error", "Could not add contact.");
    }
  };

  // -------------------------
  // Journey Summary (Today + Stability) - from Journey page data
  // -------------------------
  const fetchJourneySummary = async () => {
    const url = `${BACKEND_URL}/api/journey/${USER_ID}/today`;
    const res = await fetch(url);
    const raw = await res.json();
    
    if (!res.ok) {
      console.log("Journey summary error:", raw?.message || "Failed to load journey");
      return null;
    }

    // Journey API returns: { summary: {activeTime, distance, sessions, zones}, events: [] }
    return {
      ok: true,
      range: "day" as const,
      cards: {
        activeTime: raw?.summary?.activeTime ?? "--",
        stability: raw?.summary?.zones ?? "--",
        avgSpeed: "--",
        intensity: "--",
      },
      series: []
    };
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const s = await fetchJourneySummary();
      setSummary(s);
    } catch (e) {
      console.log("Home journey summary error:", e);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProtectors();
    loadSummary();

    const id = setInterval(() => loadSummary(), 12000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchProtectors(), loadSummary()]);
    } finally {
      setRefreshing(false);
    }
  };

  const todayText = useMemo(() => summary?.cards?.activeTime ?? "--", [summary]);
  const stabilityText = useMemo(() => summary?.cards?.stability ?? "--", [summary]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }} // ✅ NO custom bottom bar space
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.topSpacer} />

          {/* Header: Welcome + profile icon on top right */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.hTitle}>Welcome</Text>
              <Text style={styles.hSub}>You&apos;re Safe, {profile?.name ?? "..."}</Text>
            </View>

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => nav.push("/(dock)/profile")}
            >
              {profile?.photo ? (
                <Image source={{ uri: profile.photo }} style={styles.profileImg} />
              ) : (
                <Ionicons name="person-outline" size={22} color="#7A294E" />
              )}
            </TouchableOpacity>
          </View>

          {/* Protected Card */}
          <View style={styles.card}>
            <View style={styles.protectRow}>
              <View style={styles.protectLeft}>
                <View style={styles.greenIconWrap}>
                  <Ionicons name="shield-checkmark" size={18} color="#2F8F6B" />
                </View>

                <View>
                  <Text style={styles.protectTitle}>Protected</Text>
                  <Text style={styles.protectSub}>Shield {protectedOn ? "ON" : "OFF"}</Text>
                </View>
              </View>

              <Switch
                value={protectedOn}
                onValueChange={setProtectedOn}
                trackColor={{ false: "#E8D9E0", true: "#9BCBB6" }}
                thumbColor={protectedOn ? "#2F8F6B" : "#B59AA7"}
              />
            </View>
          </View>

          {/* My Circle */}
          <View style={styles.card}>
            <View style={styles.circleHeader}>
              <Text style={styles.sectionTitle}>My Circle</Text>
              <Ionicons name="chevron-forward" size={20} color="#A07A88" />
            </View>

            <View style={styles.circleBody}>
              <View style={styles.avatarsRow}>
                {protectors.length > 0 ? (
                  protectors.slice(0, 3).map((p, idx) => (
                    <TouchableOpacity
                      key={p._id}
                      style={[styles.avatarWrap, idx !== 0 ? { marginLeft: -10 } : null]}
                      onLongPress={() => {
                        Alert.alert("Remove protector?", `${p.name}\n${p.phone}`, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => deleteProtector(p._id) },
                        ]);
                      }}
                    >
                      <Image source={{ uri: p.photo }} style={styles.avatar} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyCircle}>
                    <Ionicons name="people-outline" size={18} color="#A07A88" />
                    <Text style={styles.emptyCircleText}>No protectors</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.addPill} onPress={handleAddProtector}>
                <Text style={styles.addPillText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today / Stability (BIGGER like My Circle) */}
          <View style={[styles.card, styles.bigStatsCard]}>
            {summaryLoading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading today stats...</Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statHalf}>
                  <View style={styles.smallGreenIcon}>
                    <Ionicons name="leaf-outline" size={16} color="#2F8F6B" />
                  </View>
                  <Text style={styles.statTextBig}>Today: {todayText}</Text>
                </View>

                <View style={styles.vDivider} />

                <View style={styles.statHalf}>
                  <View style={styles.smallGreenIcon}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#2F8F6B" />
                  </View>
                  <Text style={styles.statTextBig}>Stability: {stabilityText}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFBF0" },
  bg: { flex: 1, paddingHorizontal: 18 },
  topSpacer: { height: 50 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  hTitle: { fontSize: 28, fontWeight: "900", color: "#7A294E" },
  hSub: { marginTop: 4, fontSize: 13, fontWeight: "700", color: "#A07A88" },

  // Profile icon on top-right
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    marginBottom: 14,
    width: width - 36,
    alignSelf: "center",
  },

  // Protected
  protectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protectLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  greenIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF6F0",
    alignItems: "center",
    justifyContent: "center",
  },
  protectTitle: { fontSize: 16, fontWeight: "900", color: "#2F8F6B" },
  protectSub: { marginTop: 2, fontSize: 12, fontWeight: "800", color: "#A07A88" },

  // My Circle
  circleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#7A294E" },

  circleBody: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatarsRow: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  avatarWrap: { borderRadius: 22, overflow: "hidden" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#F3EDF1",
  },
  emptyCircle: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyCircleText: { fontWeight: "800", color: "#A07A88" },

  addPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F6E6EE",
  },
  addPillText: { fontWeight: "900", color: "#7A294E" },

  // Stats - same height as My Circle
  bigStatsCard: {
    paddingVertical: 18, // ✅ bigger height to match My Circle
    minHeight: 80, // ✅ ensure same minimum height as other cards
  },
  loadingInline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 10 },
  loadingText: { fontWeight: "800", color: "#A07A88" },

  statsRow: { flexDirection: "row", alignItems: "center" },
  statHalf: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" },
  vDivider: { width: 1, height: 26, backgroundColor: "#EFE3EA" },
  smallGreenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EAF6F0",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ bigger text exactly for Today + Stability
  statTextBig: { fontSize: 14.5, fontWeight: "900", color: "#7A294E" },
});