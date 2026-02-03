import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';
const { width } = Dimensions.get('window');
const BACKEND_URL = 'https://safespot-backend-vx2w.onrender.com/api';
const USER_ID = 'Swetha_01';

// BACKGROUND TASK DEFINITION
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    console.log("🛰️ Background Sync Attempted");
  }
});

export default function HistoryDashboard() {
  const router = useRouter();

  // 1. ALL HOOKS
  const [timeRange, setTimeRange] = useState('Day');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. DATA FETCHING LOGIC
  const fetchAnalytics = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/analytics/${USER_ID}`);
      const result = await response.json();
      if (result) {
        setData(result);
      }
    } catch (e) {
      console.log("Sync error");
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  // 3. LIFECYCLE EFFECT
  useEffect(() => {
    fetchAnalytics();

    const subscription = Accelerometer.addListener(async (accelData) => {
      const magnitude = Math.sqrt(accelData.x ** 2 + accelData.y ** 2 + accelData.z ** 2);
      if (magnitude > 1.8) {
        const gyro = await new Promise<{ x: number, y: number, z: number }>(res => {
          const sub = Gyroscope.addListener(g => {
            sub.remove();
            res(g);
          });
        });

        try {
          await fetch(`${BACKEND_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: USER_ID,
              accelX: accelData.x,
              gyroX: gyro.x,
              speed: 0.5,
            }),
          });
          console.log("💥 Live Data Synced");
        } catch (e) {
          console.log("Live Sync Failed");
        }
      }
    });

    Accelerometer.setUpdateInterval(1000);
    const interval = setInterval(fetchAnalytics, 10000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7A294E" />
        <Text style={{ marginTop: 10, color: '#A07A88' }}>Connecting to SafeSpot...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#7A294E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movement Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CLOUD SYNC INDICATOR */}
      <View style={styles.syncIndicator}>
        <View style={[styles.syncDot, { backgroundColor: isSyncing ? '#7A294E' : '#E5C1CD' }]} />
        <Text style={styles.syncText}>
          {isSyncing ? 'Syncing with MongoDB...' : 'Cloud Connection Active'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* TIME RANGE TABS */}
        <View style={styles.tabContainer}>
          {['Day', 'Week', 'Month'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, timeRange === tab && styles.activeTab]}
              onPress={() => setTimeRange(tab)}
            >
              <Text style={[styles.tabText, timeRange === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2x2 METRICS GRID */}
        <View style={styles.grid}>
          <MetricCard icon="time-outline" label="Active Time" value={data?.activeTime || '0 mins'} color="#7A294E" />
          <MetricCard icon="pulse-outline" label="Stability" value={`${data?.stabilityScore || 0}%`} color="#7A294E" />
          <MetricCard icon="speedometer-outline" label="Avg Speed" value={`${data?.avgSpeed || 1.2} m/s`} color="#7A294E" />
          <MetricCard icon="flash-outline" label="Intensity" value={data?.intensityStatus || 'Moderate'} color="#A07A88" />
        </View>

        {/* 24-HOUR ACTIVITY HEATMAP */}
        <View style={styles.heatmapCard}>
          <Text style={styles.sectionTitle}>24-Hour Activity Heatmap</Text>
          <View style={styles.heatRow}>
            {(data?.heatmap || Array(24).fill(0)).map((intensity: number, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.heatBar, 
                  { 
                    height: Math.max(5, Math.min(intensity * 3, 60)), 
                    backgroundColor: intensity > 10 ? '#7A294E' : '#F6E6EE',
                    opacity: intensity > 0 ? 1 : 0.4 
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.timeLabelRow}>
            <Text style={styles.timeLabel}>12AM</Text>
            <Text style={styles.timeLabel}>6AM</Text>
            <Text style={styles.timeLabel}>12PM</Text>
            <Text style={styles.timeLabel}>6PM</Text>
          </View>
        </View>

        {/* ABNORMAL MOVEMENT TIMELINE */}
        <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionTitle}>Abnormal Movement Timeline</Text>
        </View>
        
        <View style={styles.timelineContainer}>
          {data?.timeline?.length > 0 ? (
            data.timeline.map((item: any, index: number) => (
              <TimelineItem key={index} time={item.time} title={item.title} type={item.type} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#E5C1CD" />
              <Text style={styles.noDataText}>No abnormal movements detected today.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Sub-component for Metric Cards
function MetricCard({ icon, label, value, color }: any) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: '#FDF2F7' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

// Sub-component for Timeline Item
function TimelineItem({ time, title, type }: { time: string, title: string, type: string }) {
  const isHigh = type === 'High';
  return (
    <View style={styles.tlItem}>
      <View style={[styles.tlIconCircle, { backgroundColor: isHigh ? '#FDF2F7' : '#F6E6EE' }]}>
        <Ionicons 
          name={isHigh ? "alert-outline" : "walk-outline"} 
          size={18} 
          color={isHigh ? "#7A294E" : "#A07A88"} 
        />
      </View>
      <View style={styles.tlContent}>
        <Text style={styles.tlTitle}>{title}</Text>
        <Text style={styles.tlTime}>{time}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: isHigh ? '#7A294E' : '#FDF2F7' }]}>
        <Text style={[styles.badgeText, { color: isHigh ? '#FFF' : '#7A294E' }]}>{type}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    backgroundColor: '#FFF' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#7A294E' },
  syncIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  syncDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  syncText: { fontSize: 12, color: '#A07A88', fontWeight: '500' },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F6E6EE', borderRadius: 12, padding: 4, marginBottom: 25 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#7A294E', shadowOpacity: 0.1, shadowRadius: 5 },
  tabText: { color: '#A07A88', fontSize: 13, fontWeight: '500' },
  activeTabText: { color: '#7A294E', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 12, color: '#A07A88', fontWeight: '500' },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#7A294E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#7A294E', marginTop: 10, marginBottom: 15 },
  heatmapCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 25, elevation: 3 },
  heatRow: { flexDirection: 'row', alignItems: 'flex-end', height: 60, justifyContent: 'space-between' },
  heatBar: { width: 7, borderRadius: 4 },
  timeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timeLabel: { fontSize: 10, color: '#A07A88', fontWeight: '600' },
  timelineHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineContainer: { marginTop: 5 },
  tlItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12, 
    elevation: 2 
  },
  tlIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tlContent: { flex: 1 },
  tlTitle: { fontSize: 14, fontWeight: '600', color: '#7A294E' },
  tlTime: { fontSize: 12, color: '#A07A88', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  noDataText: { color: '#A07A88', fontSize: 13, marginTop: 10 }
});