import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BACKEND_URL, USER_ID } from "../../constants/api";

type SummaryPoint = {
  label: string; // YYYY-MM-DD
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
  dateKeys?: string[];
  year?: number;
  month?: number;
  cards: {
    activeTime: string;
    avgSpeed: string;
    stability: string;
    intensity: string;
  };
  series: SummaryPoint[];
};

const { width } = Dimensions.get("window");

const toDayName = (yyyy_mm_dd: string) => {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-IN", { weekday: "short" });
};

const niceDate = (yyyy_mm_dd: string) => {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// simple bar chart (no extra libs)
function MiniBarChart({ data, height = 110 }: { data: number[]; height?: number }) {
  const max = Math.max(1, ...data);
  const barW = Math.max(3, Math.floor((width - 80) / Math.max(7, data.length)) - 2);

  return (
    <View style={[styles.chartWrap, { height }]}>
      {data.map((v, i) => {
        const h = Math.max(4, Math.round((v / max) * (height - 18)));
        return <View key={i} style={[styles.bar, { height: h, width: barW }]} />;
      })}
    </View>
  );
}

export default function MovementAnalysis() {
  const [tab, setTab] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async (which: "day" | "week" | "month") => {
    const url =
      which === "month"
        ? `${BACKEND_URL}/api/history/${USER_ID}/summary/month`
        : `${BACKEND_URL}/api/history/${USER_ID}/summary/${which}`;

    const res = await fetch(url);
    const raw = await res.json();

    if (!res.ok || !raw?.ok) {
      throw new Error(raw?.message || "Summary fetch failed");
    }

    return raw as SummaryResponse;
  };

  const load = async (which = tab) => {
    setLoading(true);
    try {
      const s = await fetchSummary(which);
      setData(s);
    } catch (e) {
      console.log("Movement summary error:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    const id = setInterval(() => load(tab), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const s = await fetchSummary(tab);
      setData(s);
    } catch (e) {
      console.log("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const avgSeries = useMemo(() => {
    if (!data?.series?.length) return [];
    return data.series.map((p) => p.activeMins);
  }, [data]);

  const labels = useMemo(() => {
    if (!data?.series?.length) return [];
    if (tab === "week") return data.series.map((p) => toDayName(p.label));
    if (tab === "month") return data.series.map((p) => p.label.split("-")[2]); // 01..31
    return data.series.map((p) => niceDate(p.label));
  }, [data, tab]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        <View style={styles.header}>
          <Text style={styles.title}>Movement Analysis</Text>
          <Text style={styles.sub}>Day · Week · Month summary (IST) · {USER_ID}</Text>

          <View style={styles.tabRow}>
            {(["day", "week", "month"] as const).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setTab(k)}
                style={[styles.tab, tab === k && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>
                  {k.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={{ paddingTop: 30 }}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading summary...</Text>
          </View>
        ) : !data ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No data</Text>
            <Text style={styles.emptySub}>Check backend is reachable and logs exist.</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Cards */}
            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Active Time</Text>
                <Text style={styles.cardValue}>{data.cards.activeTime}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Stability</Text>
                <Text style={styles.cardValue}>{data.cards.stability}</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Avg Speed</Text>
                <Text style={styles.cardValue}>{data.cards.avgSpeed}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Intensity</Text>
                <Text style={styles.cardValue}>{data.cards.intensity}</Text>
              </View>
            </View>

            {/* Table */}
            <View style={styles.tableCard}>
              <Text style={styles.tableTitle}>
                {tab === "day" ? "Today" : tab === "week" ? "Last 7 days" : "This month"} breakdown
              </Text>

              {data.series.map((p, idx) => (
                <View key={p.label} style={[styles.row, idx === 0 && { marginTop: 10 }]}>
                  <Text style={[styles.rowLeft, tab === "month" && { width: 40 }]}>{labels[idx]}</Text>
                  <Text style={styles.rowMid}>{p.activeMins} mins</Text>
                  <Text style={styles.rowRight}>{p.stability}%</Text>
                </View>
              ))}
            </View>

            {/* Avg Graph */}
            <View style={styles.tableCard}>
              <Text style={styles.tableTitle}>Average Activity Graph</Text>
              <Text style={styles.graphSub}>Bars = active minutes</Text>

              <MiniBarChart data={avgSeries} />

              <View style={styles.xLabels}>
                {labels.slice(0, 8).map((l, i) => (
                  <Text key={i} style={styles.xLabel}>
                    {l}
                  </Text>
                ))}
                {labels.length > 8 && <Text style={styles.xLabel}>…</Text>}
              </View>
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },

  header: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", color: "#7A294E" },
  sub: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#A07A88" },

  tabRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7A294E",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  tabActive: { backgroundColor: "#7A294E" },
  tabText: { fontWeight: "900", fontSize: 12, color: "#7A294E" },
  tabTextActive: { color: "white" },

  loadingText: { textAlign: "center", marginTop: 10, fontWeight: "700", color: "#A07A88" },

  cardsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  cardLabel: { fontSize: 11, fontWeight: "900", color: "#A07A88" },
  cardValue: { marginTop: 8, fontSize: 16, fontWeight: "900", color: "#7A294E" },

  tableCard: {
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  tableTitle: { fontSize: 14, fontWeight: "900", color: "#7A294E" },

  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F6E6EE" },
  rowLeft: { width: 70, fontWeight: "900", color: "#7A294E" },
  rowMid: { flex: 1, fontWeight: "800", color: "#A07A88" },
  rowRight: { width: 70, textAlign: "right", fontWeight: "900", color: "#7A294E" },

  graphSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#A07A88" },

  chartWrap: {
    marginTop: 12,
    width: width - 60,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingVertical: 10,
  },
  bar: {
  borderRadius: 8,
  backgroundColor: "#7A294E",
  opacity: 0.85,
},

  xLabels: { flexDirection: "row", gap: 10, marginTop: 6 },
  xLabel: { fontSize: 10, fontWeight: "800", color: "#A07A88" },

  emptyBox: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontWeight: "900", color: "#7A294E" },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#A07A88", textAlign: "center" },

});