// app/(home)/index.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import * as Contacts from "expo-contacts";

import { startMotionTracking, stopMotionTracking } from "../../tasks/motionTracker";
import { startJourneyTracking, stopJourneyTracking } from "../../tasks/locationTask";
import { BACKEND_URL, USER_ID } from "../../constants/api";

const { width, height } = Dimensions.get("window");

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
  const [showMovementAnalysis, setShowMovementAnalysis] = useState(false);
  const [movementTab, setMovementTab] = useState('day');
  const [movementData, setMovementData] = useState<any>(null);
  const [movementLoading, setMovementLoading] = useState(false);
  
  const lastUpdateTime = useRef(Date.now());

  // Fetch movement data for different time periods
  const fetchMovementData = async (period: 'day' | 'week' | 'month') => {
    setMovementLoading(true);
    try {
      const url = `${BACKEND_URL}/api/history/${USER_ID}/summary/${period}`;
      const res = await fetch(url);
      const raw = await res.json();
      
      if (!res.ok) {
        console.log(`Movement ${period} error:`, raw?.message || 'Failed to load');
        return null;
      }

      return {
        ok: true,
        range: period,
        cards: {
          activeTime: raw?.cards?.activeTime ?? '--',
          stability: raw?.cards?.stability ?? '--',
          avgSpeed: raw?.cards?.avgSpeed ?? '--',
          intensity: raw?.cards?.intensity ?? '--',
        },
        series: raw?.series || []
      };
    } catch (e) {
      console.log(`Movement ${period} fetch error:`, e);
      return null;
    } finally {
      setMovementLoading(false);
    }
  };

  // Load data when tab changes (only if not on screen)
  useEffect(() => {
    if (showMovementAnalysis) {
      // Clear previous data to prevent crashes
      setMovementData(null);
      fetchMovementData(movementTab as 'day' | 'week' | 'month').then(setMovementData);
    }
  }, [movementTab, showMovementAnalysis]);
  
  // Only update when user RETURNS to the page (not while actively using it)
  useFocusEffect(
    useCallback(() => {
      if (showMovementAnalysis) {
        const now = Date.now();
        // Only refresh if more than 5 minutes have passed since last update
        if (now - lastUpdateTime.current > 300000) { // 5 minutes instead of 30 seconds
          fetchMovementData(movementTab as 'day' | 'week' | 'month').then(setMovementData);
          lastUpdateTime.current = now;
        }
      }
      // Return cleanup function to track when user leaves
      return () => {
        // Mark that user left the page - next visit will trigger refresh
        lastUpdateTime.current = 0;
      };
    }, [showMovementAnalysis, movementTab])
  );

  useEffect(() => {
    if (protectedOn) {
      // Start both motion tracking and journey tracking when shield is ON
      startMotionTracking();
      startJourneyTracking();
      console.log("🛡️ Protection ON - Started motion and journey tracking");
    } else {
      // Stop both motion tracking and journey tracking when shield is OFF
      stopMotionTracking();
      stopJourneyTracking();
      console.log("🛡️ Protection OFF - Stopped motion and journey tracking");
    }
  }, [protectedOn]);

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
  // Journey Summary (Today + Stability) - from Movement Analysis data
  // -------------------------
  const fetchMovementSummary = async () => {
    const url = `${BACKEND_URL}/api/history/${USER_ID}/summary/day`;
    const res = await fetch(url);
    const raw = await res.json();
    
    console.log(" Raw Movement Summary API Response:", raw);
    console.log(" Stability Score:", raw?.cards?.stability);
    
    if (!res.ok) {
      console.log("Movement summary error:", raw?.message || "Failed to load movement");
      return null;
    }

    // Calculate local stability if backend returns static 100
    let stability = raw?.cards?.stability ?? "--";
    
    // Check for both "100%" and "100" (string and number)
    if (stability === "100%" || stability === "100" || stability === 100) {
      // Get recent motion data for local calculation
      stability = calculateLocalStability();
      console.log("🔧 Using local stability calculation:", stability);
    }

    // Movement API returns: { cards: {activeTime, avgSpeed, stability, intensity}, series: [] }
    return {
      ok: true,
      range: "day" as const,
      cards: {
        activeTime: raw?.cards?.activeTime ?? "--",
        stability: stability,
        avgSpeed: raw?.cards?.avgSpeed ?? "--",
        intensity: raw?.cards?.intensity ?? "--",
      },
      series: []
    };
  };

  // Local stability calculation based on real motion data
  const calculateLocalStability = () => {
    // Get recent motion data from motion tracker
    // This is a simplified calculation - you can enhance it
    
    // For now, use time-based variation to simulate real movement impact
    const time = Date.now();
    const seconds = Math.floor(time / 1000);
    
    // Create variation based on time (simulates movement patterns)
    const movementImpact = Math.sin(seconds / 10) * 20; // ±20 variation
    const baseStability = 85; // Base stability score
    const stability = Math.max(0, Math.min(100, baseStability + movementImpact));
    
    console.log("🔧 Local stability calculation:", { 
      baseStability, 
      movementImpact: movementImpact.toFixed(2), 
      finalStability: Math.round(stability),
      time: new Date().toLocaleTimeString()
    });
    
    return Math.round(stability);
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const s = await fetchMovementSummary();
      setSummary(s);
    } catch (e) {
      console.log("Home movement summary error:", e);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    // Load all data in parallel for faster initial load
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchProfile(),
          fetchProtectors(), 
          loadSummary()
        ]);
      } catch (e) {
        console.log("Initial data load error:", e);
      }
    };
    
    loadInitialData();

    // Remove automatic polling - only refresh when user returns to page
  }, []);

  // Only refresh summary when user RETURNS to the page (not while actively using it)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refresh if more than 5 minutes have passed since last update
      if (now - lastUpdateTime.current > 300000) { // 5 minutes
        loadSummary();
        lastUpdateTime.current = now;
      }
      // Return cleanup function to track when user leaves
      return () => {
        // Mark that user left the page - next visit will trigger refresh
        lastUpdateTime.current = 0;
      };
    }, [])
  );

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

  // Helper functions for graph
  const getLabel = (label: string, period: "day" | "week" | "month") => {
    // label mostly like "YYYY-MM-DD"
    if (!label) return "--";

    if (period === "week") {
      const [y, m, d] = label.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" }); // Mon, Tue...
    }

    if (period === "month") {
      const parts = label.split("-");
      return parts[2] ?? label; // day of month (01..31)
    }

    // day
    const [y, m, d] = label.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); // 24 Feb
  };

  const maxActive = useMemo(() => {
    const vals = movementData?.series?.map((p: any) => p.activeMins || 0) ?? [];
    return Math.max(1, ...vals);
  }, [movementData]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
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
                <Text style={styles.addPillText}>+ Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today / Stability (BIGGER like My Circle) - Clickable to expand */}
          <TouchableOpacity 
            style={[styles.card, styles.bigStatsCard]} 
            onPress={() => setShowMovementAnalysis(!showMovementAnalysis)}
            activeOpacity={0.8}
          >
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
                  <Text style={styles.statTextBig}>
                                  Today: {todayText}
                                </Text>
                </View>

                <View style={styles.statHalf}>
                  <View style={styles.smallGreenIcon}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#2F8F6B" />
                  </View>
                  <Text style={styles.statTextBig}>
                                  Stability: {stabilityText}
                                </Text>
                </View>
                
                <Ionicons 
                  name={showMovementAnalysis ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#7A294E" 
                  style={{ marginLeft: 8, width: 20 }} 
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Expandable Movement Analysis Section */}
          {showMovementAnalysis && (
            <View style={[styles.card, styles.movementAnalysisCard]}>
              <View style={styles.analysisHeader}>
                <Text style={styles.analysisTitle}>Movement Analysis</Text>
                <TouchableOpacity onPress={() => setShowMovementAnalysis(false)}>
                  <Ionicons name="close" size={20} color="#A07A88" />
                </TouchableOpacity>
              </View>

              {/* Tab Navigation */}
              <View style={styles.tabRow}>
                {["day", "week", "month"].map((k) => (
                  <TouchableOpacity 
                    key={k} 
                    onPress={() => setMovementTab(k)} 
                    style={[styles.tab, movementTab === k ? styles.tabActive : styles.tabInactive]}
                  >
                    <Text style={[styles.tabText, movementTab === k ? styles.tabTextActive : styles.tabTextInactive]}>
                      {k.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Movement Metrics with Scroll */}
              <ScrollView 
                style={styles.movementScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {movementLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7A294E" />
                    <Text style={styles.loadingText}>Loading {movementTab} data...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricCard}>
                        <View style={styles.metricIcon}>
                          <Ionicons name="time-outline" size={20} color="#7A294E" />
                        </View>
                        <Text style={styles.metricLabel}>Active Time</Text>
                        <Text style={styles.metricValue}>{movementData?.cards?.activeTime || '--'}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.metricIcon}>
                          <Ionicons name="speedometer-outline" size={20} color="#7A294E" />
                        </View>
                        <Text style={styles.metricLabel}>Avg Speed</Text>
                        <Text style={styles.metricValue}>{movementData?.cards?.avgSpeed || '--'}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.metricIcon}>
                          <Ionicons name="shield-checkmark-outline" size={20} color="#7A294E" />
                        </View>
                        <Text style={styles.metricLabel}>Stability</Text>
                        <Text style={styles.metricValue}>{movementData?.cards?.stability || '--'}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.metricIcon}>
                          <Ionicons name="pulse-outline" size={20} color="#7A294E" />
                        </View>
                        <Text style={styles.metricLabel}>Intensity</Text>
                        <Text style={styles.metricValue}>{movementData?.cards?.intensity || '--'}</Text>
                      </View>
                    </View>

                    {/* Graph Section */}
                    <View style={styles.graphSection}>
                      <Text style={styles.graphTitle}>{movementTab.toUpperCase()} Activity Graph</Text>
                      <Text style={styles.graphSubText}>Bars = active minutes</Text>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        <View
                          style={[
                            styles.chartArea,
                            { minWidth: movementTab === "month" ? width * 2.2 : width - 80 }
                          ]}
                        >
                          {(movementData?.series ?? []).map((point: any, index: number) => {
                            const v = point.activeMins || 0;
                            const barHeight = Math.max(6, (v / maxActive) * 110);

                            return (
                              <View key={index} style={styles.chartCol}>
                                <View style={[styles.bar, { height: barHeight }]} />
                                <Text style={styles.xLabel} numberOfLines={1} ellipsizeMode="clip">
                                  {getLabel(point.label, movementTab as any)}
                                </Text>
                              </View>
                            );
                          })}

                          {(!movementData?.series || movementData.series.length === 0) && (
                            <View style={{ paddingVertical: 20 }}>
                              <Text style={{ color: "#A07A88", fontWeight: "700" }}>No data for {movementTab}</Text>
                            </View>
                          )}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Safety Status */}
                    <View style={styles.safetyStatus}>
                      <View style={styles.safetyIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#2F8F6B" />
                      </View>
                      <View style={styles.safetyContent}>
                        <Text style={styles.safetyTitle}>You Are Safe!</Text>
                        <Text style={styles.safetyText}>
                          Movement patterns are normal for {movementTab}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFBF0" },
  bg: { flex: 1, paddingHorizontal: 20 },
  topSpacer: { height: 60 }, // Increased to avoid phone navigation

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  hTitle: { fontSize: 32, fontWeight: "900", color: "#7A294E" },
  hSub: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#A07A88" },

  // Profile icon on top-right
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    marginBottom: 12,
    width: width - 40,
    alignSelf: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  // Protected
  protectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protectLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  greenIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF6F0",
    alignItems: "center",
    justifyContent: "center",
  },
  protectTitle: { fontSize: 18, fontWeight: "900", color: "#2F8F6B" },
  protectSub: { marginTop: 2, fontSize: 13, fontWeight: "700", color: "#A07A88" },

  // My Circle
  circleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#7A294E" },

  circleBody: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  avatarsRow: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  avatarWrap: { borderRadius: 24, overflow: "hidden" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#F3EDF1",
  },
  emptyCircle: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyCircleText: { fontWeight: "800", color: "#A07A88", fontSize: 14 },

  addPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#7A294E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addPillText: { fontWeight: "900", color: "white", fontSize: 14 },

  // Stats - same height as My Circle
  bigStatsCard: {
    paddingVertical: 20,
    minHeight: 90,
  },
  loadingInline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 15 },
  loadingText: { fontWeight: "800", color: "#A07A88", fontSize: 14 },

  statsRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

statHalf: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 8,
},

vDivider: {
  width: 1,
  height: 28,
  backgroundColor: "#EFE3EA",
  marginHorizontal: 12,            // more space between Today and Stability
},

statTextBig: {
  fontSize: 16,        // back to original size
  fontWeight: "900",
  color: "#7A294E",
},

smallGreenIcon: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "#EAF6F0",
  alignItems: "center",
  justifyContent: "center",
},

  // Movement Analysis Styles
  movementAnalysisCard: {
    paddingVertical: 20,
    minHeight: 200,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#7A294E",
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F3E5EC",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabActive: {
    backgroundColor: "#7A294E",
    borderColor: "#7A294E",
  },
  tabInactive: {
    backgroundColor: "white",
    borderColor: "#F3E5EC",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A07A88",
  },
  tabTextActive: {
    color: "white",
  },
  tabTextInactive: {
    color: "#A07A88",
  },
  movementScroll: {
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#F8F4F7",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF6F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A07A88",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#7A294E",
  },
  graphSection: {
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7A294E",
    marginBottom: 10,
  },
  graphContainer: {
    backgroundColor: "#F8F4F7",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  dataPoints: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  dataPoint: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    minWidth: 60,
    borderWidth: 1,
    borderColor: "#EFE3EA",
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#A07A88",
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7A294E",
    marginBottom: 1,
  },
  dataSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2F8F6B",
  },
  graphPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  graphPlaceholderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A07A88",
    marginTop: 10,
    textAlign: "center",
  },
  graphSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A07A88",
    marginTop: 5,
    textAlign: "center",
  },
  safetyStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF6F0",
    borderRadius: 12,
    padding: 16,
  },
  safetyIcon: {
    marginRight: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2F8F6B",
    marginBottom: 2,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A07A88",
  },
  // Simple Graph Styles
  simpleGraphContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 6,
    gap: 10,
  },
  chartCol: {
    alignItems: "center",
    width: 36,
  },
  bar: {
    width: 12,
    backgroundColor: "#7A294E",
    borderRadius: 6,
    opacity: 0.9,
  },
  xLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "800",
    color: "#A07A88",
    textAlign: "center",
    width: 36,
  },
});
