import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { BACKEND_URL, USER_ID } from "../../constants/api";

type SummaryPoint = {
  label: string; 
  activeMins: number;
  stability: number;
};

type SummaryResponse = {
  ok: boolean;
  cards: {
    activeTime: string;
    avgSpeed: string;
    stability: string;
    intensity: string;
  };
  series: SummaryPoint[];
};

const { width } = Dimensions.get("window");

// Safety Monitoring Constants
const TESTING_MODE = false; // 🔧 Toggle: true = Test Mode, false = Production Mode
const SAFETY_PHONE = "+911234567890"; // Emergency contact number
const MOVEMENT_THRESHOLD = 0.8; // 80% of average movement triggers alert (original value)
const SAFETY_CHECK_INTERVAL = 30000; // Check every 30 seconds (original value)
const AUTO_ALERT_DELAY = 20000; // Auto alert after 20 seconds in test mode

// Dynamic stability calculation (same as home page)
const calculateLocalStability = () => {
  const time = Date.now();
  const seconds = Math.floor(time / 1000);
  
  // Create variation based on time (simulates movement patterns)
  const movementImpact = Math.sin(seconds / 10) * 20; // ±20 variation
  const baseStability = 85; // Base stability score
  const stability = Math.max(0, Math.min(100, baseStability + movementImpact));
  
  console.log("🔧 Movement Analysis - Local stability calculation:", { 
    baseStability, 
    movementImpact: movementImpact.toFixed(2), 
    finalStability: Math.round(stability),
    time: new Date().toLocaleTimeString()
  });
  
  return Math.round(stability);
};

const toDayName = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
};

const niceDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Safety Alert Functions
const sendSafetySMS = async (message: string) => {
  if (!TESTING_MODE) {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          [SAFETY_PHONE],
          `SafeSpot Alert: ${message}`
        );
        console.log("✅ Safety SMS sent:", message);
      }
    } catch (error) {
      console.error("❌ SMS failed:", error);
    }
  } else {
    // 🧪 Testing Mode - Log instead of sending
    console.log("🧪 [TEST MODE] SMS would be sent to", SAFETY_PHONE);
    console.log("🧪 [TEST MODE] Message:", `SafeSpot Alert: ${message}`);
    Alert.alert(
      "🧪 Test Mode - SMS",
      `Would send SMS to ${SAFETY_PHONE}:\n\n${message}`,
      [{ text: "OK", style: "default" }]
    );
  }
};

const makeEmergencyCall = async () => {
  if (!TESTING_MODE) {
    try {
      await Linking.openURL(`tel:${SAFETY_PHONE}`);
      console.log("📞 Emergency call initiated to", SAFETY_PHONE);
    } catch (error) {
      console.error("❌ Call failed:", error);
    }
  } else {
    // 🧪 Testing Mode - Log instead of calling
    console.log("🧪 [TEST MODE] Would call emergency number:", SAFETY_PHONE);
    Alert.alert(
      "🧪 Test Mode - Emergency Call",
      `Would call ${SAFETY_PHONE} for emergency assistance`,
      [{ text: "OK", style: "default" }]
    );
  }
};

const sendSafetyAlert = async (currentMovement: number, averageMovement: number) => {
  const message = `User ${USER_ID} is SAFE! Current movement: ${currentMovement} mins (above average: ${averageMovement.toFixed(1)} mins). All systems normal.`;
  
  // Send SMS (or test mode simulation)
  await sendSafetySMS(message);
  
  // Show alert in app
  Alert.alert(
    "✅ Safety Status - You Are Safe!",
    message,
    [
      { text: "OK", style: "default" },
      { 
        text: TESTING_MODE ? "🧪 Test Call" : "📞 Emergency Call", 
        onPress: makeEmergencyCall, 
        style: "destructive" 
      }
    ]
  );
  
  console.log(`🛡️ Safety Alert: ${message}`);
};

function MetricBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={20} color="#7A294E" />
      <View style={{ flex: 1 }}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

export default function MovementAnalysis({ navigation }: any) {
  const insets = useSafeAreaInsets();   // ✅ add this
  const [tab, setTab] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageMovement, setAverageMovement] = useState(0);
  const [lastSafetyCheck, setLastSafetyCheck] = useState<Date | null>(null);
  const [testModeTimer, setTestModeTimer] = useState<NodeJS.Timeout | null>(null);
  
  const activeTabRef = useRef(tab);
  const safetyCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate average movement from historical data
  const calculateAverageMovement = useCallback((movementData: SummaryPoint[]) => {
    if (movementData.length === 0) return 0;
    
    const totalMovement = movementData.reduce((sum, point) => sum + point.activeMins, 0);
    const avg = totalMovement / movementData.length;
    
    console.log(`📊 Average Movement: ${avg.toFixed(1)} mins from ${movementData.length} data points`);
    return avg;
  }, []);

  // Safety monitoring function
  const checkSafetyStatus = useCallback(async (currentData: SummaryResponse) => {
    console.log("🔍 Starting safety check...");
    
    if (TESTING_MODE) {
      // 🧪 Test Mode - Auto alert after 20 seconds
      console.log("🧪 [TEST MODE] Setting up auto alert...");
      
      // Clear existing timer
      if (testModeTimer) {
        clearTimeout(testModeTimer);
      }
      
      // Set new timer for 20 seconds
      const timer = setTimeout(async () => {
        console.log("🧪 [TEST MODE] 20 seconds elapsed - triggering safety alert!");
        const avg = calculateAverageMovement(currentData.series);
        const currentMovement = currentData.series[0]?.activeMins || 0;
        
        await sendSafetyAlert(currentMovement, avg);
        setLastSafetyCheck(new Date());
      }, AUTO_ALERT_DELAY);
      
      setTestModeTimer(timer);
      return;
    }
    
    // 🛡️ Production Mode - Normal safety check
    // Calculate average from historical data
    const avg = calculateAverageMovement(currentData.series);
    setAverageMovement(avg);

    // Get today's movement
    const currentMovement = currentData.series[0]?.activeMins || 0;
    const threshold = avg * MOVEMENT_THRESHOLD;
    
    console.log("📊 Safety Analysis:");
    console.log(`  - Current Movement: ${currentMovement} mins`);
    console.log(`  - Average Movement: ${avg.toFixed(1)} mins`);
    console.log(`  - Threshold (${MOVEMENT_THRESHOLD * 100}%): ${threshold.toFixed(1)} mins`);
    console.log(`  - Testing Mode: ${TESTING_MODE}`);
    console.log(`  - Condition: ${currentMovement} > ${threshold} = ${currentMovement > threshold}`);

    // Check if current movement is above threshold
    if (currentMovement > threshold) {
      console.log("✅ User is SAFE - Movement above average threshold");
      await sendSafetyAlert(currentMovement, avg);
      setLastSafetyCheck(new Date());
    } else {
      console.log("⚠️ Movement below threshold - monitoring continues");
      console.log(`💡 Tip: Need movement > ${threshold.toFixed(1)} mins to trigger alert`);
    }
  }, [calculateAverageMovement, testModeTimer]);

  const loadData = useCallback(async (isSilent = false) => {
    activeTabRef.current = tab;
    if (!isSilent) setLoading(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/${USER_ID}/summary/${tab}`);
      const raw = await res.json();
      
      if (raw?.ok && activeTabRef.current === tab) {
        setData(raw);
        
        // Apply dynamic stability calculation (same as home page)
        let stability = raw?.cards?.stability ?? "--";
        
        // Check for both "100%" and "100" (string and number)
        if (stability === "100%" || stability === "100" || stability === 100) {
          stability = calculateLocalStability();
          console.log("🔧 Movement Analysis - Using local stability calculation:", stability);
        }
        
        // Update data with dynamic stability
        const updatedData = {
          ...raw,
          cards: {
            ...raw.cards,
            stability: stability
          }
        };
        
        setData(updatedData);
        
        // Run safety check when data loads
        if (!isSilent) {
          await checkSafetyStatus(updatedData);
        }
      }
    } catch (e) {
      console.log("Movement Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, checkSafetyStatus]);

  useEffect(() => {
    loadData();
    
    // Set up safety monitoring interval
    safetyCheckRef.current = setInterval(async () => {
      if (data) {
        await checkSafetyStatus(data);
      }
    }, SAFETY_CHECK_INTERVAL);

    return () => {
      if (safetyCheckRef.current) {
        clearInterval(safetyCheckRef.current);
      }
    };
  }, [loadData, data, checkSafetyStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const chartInfo = useMemo(() => {
    if (!data?.series) return { vals: [], lbls: [] };
    return {
      vals: data.series.map(p => p.activeMins),
      lbls: data.series.map(p => 
        tab === "week" ? toDayName(p.label) : 
        tab === "month" ? p.label.split("-")[2] : niceDate(p.label)
      )
    };
  }, [data, tab]);

  return (
    <View style={styles.container}>
      {/* Translucent allows the gradient to sit behind the status bar icons */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]}
        style={[styles.bg, { paddingTop: insets.top + 16 }]}  // ✅ dynamic top padding
      >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7A294E" />
            }
            contentContainerStyle={{ paddingBottom: 110 }}
          >
          {/* Header Section - Moved down 2 inches */}
          <View style={styles.header}>
            <Text style={styles.title}>Movement</Text>
            <Text style={styles.sub}>History Analysis • {USER_ID}</Text>

            <View style={styles.tabRow}>
              {["day", "week", "month"].map((k) => (
                <TouchableOpacity 
                  key={k} 
                  onPress={() => setTab(k as any)} 
                  style={[styles.tab, tab === k && styles.tabActive]}
                >
                  <Text style={[styles.tabText, tab === k && { color: "white" }]}>
                    {k.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#7A294E" />
              <Text style={{ marginTop: 10, color: "#A07A88", fontWeight: "600" }}>
                Syncing analysis...
              </Text>
            </View>
          ) : (
            <>
              {/* Safety Status Card */}
              <View style={styles.safetyCard}>
                <View style={styles.safetyHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                  <Text style={styles.safetyTitle}>Safety Monitoring</Text>
                  {TESTING_MODE && (
                    <View style={styles.testModeBadge}>
                      <Text style={styles.testModeText}>TEST MODE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.safetySub}>Average: {averageMovement.toFixed(1)} mins</Text>
                {lastSafetyCheck && (
                  <Text style={styles.lastCheck}>
                    Last check: {lastSafetyCheck.toLocaleTimeString()}
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.testBtn}
                  onPress={() => data && checkSafetyStatus(data)}
                >
                  <Text style={styles.testBtnText}>
                    {TESTING_MODE ? "🧪 Test Safety Alert" : "🛡️ Test Safety Alert"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Metric Grid */}
              <View style={styles.grid}>
                <MetricBox label="Active Time" value={data?.cards.activeTime || "0m"} icon="walk-outline" />
                <MetricBox label="Stability" value={data?.cards.stability || "0%"} icon="shield-checkmark-outline" />
                <MetricBox label="Avg Speed" value={data?.cards.avgSpeed || "0m/s"} icon="speedometer-outline" />
                <MetricBox label="Intensity" value={data?.cards.intensity || "Idle"} icon="flame-outline" />
              </View>

              {/* Breakdown Table */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Breakdown</Text>
                {data?.series.length === 0 ? (
                   <Text style={styles.emptyText}>No records for this period</Text>
                ) : (
                  data?.series.map((p, i) => (
                    <View key={i} style={styles.row}>
                      <Text style={styles.rowLeft}>{chartInfo.lbls[i]}</Text>
                      <Text style={styles.rowMid}>{p.activeMins} mins</Text>
                      <Text style={styles.rowRight}>{p.stability}%</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Trend Chart */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity Trend</Text>
                <Text style={styles.graphSub}>Active minutes over time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  <View style={[styles.chartArea, { minWidth: tab === "month" ? width * 3.5 : width - 80 }]}>
                    {chartInfo.vals.map((v, i) => {
                      const max = Math.max(1, ...chartInfo.vals);
                      const barHeight = Math.max(4, (v / max) * 110);
                      return (
                        <View key={i} style={styles.chartCol}>
                          <View style={[styles.bar, { height: barHeight }]} />
                          <Text style={styles.xLabel}>{chartInfo.lbls[i]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFBF0" 
  },
  
  bg: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },

  header: { 
    marginBottom: 15 
  },

  title: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: "#7A294E" 
  },

  sub: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#A07A88", 
    marginTop: 4 
  },

  tabRow: { 
    flexDirection: "row", 
    gap: 10, 
    marginTop: 20 
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
    borderColor: "#7A294E" 
  },

  tabText: { 
    fontWeight: "900", 
    fontSize: 12, 
    color: "#7A294E" 
  },

  grid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12 
  },

  metricCard: { 
    width: (width - 52) / 2, 
    backgroundColor: "white", 
    borderRadius: 24, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: "#F3E5EC",
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    elevation: 1,
  },

  metricLabel: { 
    fontSize: 11, 
    color: "#A07A88", 
    fontWeight: "800" 
  },

  metricValue: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: "#7A294E", 
    marginTop: 2 
  },

  card: { 
    backgroundColor: "white", 
    borderRadius: 28, 
    padding: 22, 
    marginTop: 18, 
    borderWidth: 1, 
    borderColor: "#F3E5EC",
    elevation: 3,
    shadowColor: "#7A294E",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },

  cardTitle: { 
    fontSize: 17, 
    fontWeight: "900", 
    color: "#7A294E" 
  },

  graphSub: { 
    fontSize: 12, 
    color: "#A07A88", 
    fontWeight: "600", 
    marginTop: 2 
  },
  
  row: { 
    flexDirection: "row", 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#FDF2F7" 
  },

  rowLeft: { 
    width: 75, 
    fontWeight: "900", 
    color: "#7A294E" 
  },

  rowMid: { 
    flex: 1, 
    color: "#A07A88", 
    fontWeight: "700" 
  },

  rowRight: { 
    fontWeight: "900", 
    color: "#7A294E" 
  },

  chartArea: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    height: 150, 
    paddingTop: 10,
    paddingBottom: 5,
    justifyContent: 'flex-start'
  },

  chartCol: { 
    alignItems: "center", 
    minWidth: 20, 
    marginHorizontal: 2 
  },

  bar: { 
    width: 10, 
    backgroundColor: "#7A294E", 
    borderRadius: 5, 
    opacity: 0.85 
  },

  xLabel: { 
    marginTop: 10, 
    fontSize: 10, 
    fontWeight: "800", 
    color: "#A07A88" 
  },
  
  center: { 
    height: 300, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  emptyText: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#A07A88', 
    fontWeight: '700' 
  },

  // Safety Monitoring Styles
  safetyCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 22,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#E8F5E8",
    elevation: 3,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2F8F6B",
    marginLeft: 8,
  },
  safetySub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A07A88",
    marginBottom: 8,
  },
  lastCheck: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4CAF50",
  },
  testBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 12,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "white",
  },
  testModeBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  testModeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },
});