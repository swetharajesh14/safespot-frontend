import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface ActivityLog {
  id: string;
  time: string;
  title: string;
  color: string;
}

export default function RealDataAnalysis() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [currentStatus, setCurrentStatus] = useState("Calibrating...");
  
  // Real-time calculated data
  const [liveAcceleration, setLiveAcceleration] = useState(0);
  const [maxForce, setMaxForce] = useState(0);
  const saveActivityToBackend = async (action: string, force: number) => {
  try {
    await fetch('http://YOUR_COMPUTER_IP:3000/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: "Swetha_01", // Unique ID for the user
        activityType: action,
        intensity: force,
        timestamp: new Date()
      }),
    });
    console.log("Data sent to MongoDB!");
  } catch (error) {
    console.error("Backend Error:", error);
  }
};

  useEffect(() => {
    // High frequency for real-time calculation (100ms)
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((data) => {
      // 1. Calculate Resultant Force: sqrt(x^2 + y^2 + z^2)
      const totalForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      
      // 2. Subtract Gravity (approx 1.0) to get actual user movement
      const userMovement = Math.abs(totalForce - 1);
      setLiveAcceleration(userMovement);

      // 3. Track the peak force for the session
      if (userMovement > maxForce) setMaxForce(userMovement);

      // 4. Logic for Action Detection
      let action = "Standing Still";
      let color = "#A07A88";

      if (userMovement > 1.8) {
        action = "Hard Bump / Sudden Move";
        color = "#FF5252";
      } else if (userMovement > 0.5) {
        action = "Walking / Moving";
        color = "#4CAF50";
      }

      // 5. Update Log if action changes
      if (action !== currentStatus && userMovement > 0.1) {
        setCurrentStatus(action);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setLogs(prev => [{
          id: Math.random().toString(),
          time: timeStr,
          title: action,
          color: color
        }, ...prev].slice(0, 10)); // Keep only last 10 logs
      }
    });

    return () => subscription.remove();
  }, [currentStatus, maxForce]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFBF0', '#FDF2F7']} style={styles.background}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#7A294E" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Real-Time Analysis</Text>
            <Text style={styles.headerSub}>Live Hardware Feed</Text>
          </View>

          {/* REAL DATA WIDGETS */}
          <View style={styles.dataGrid}>
            <View style={styles.dataCard}>
              <Text style={styles.dataLabel}>LIVE ACCEL</Text>
              <Text style={styles.dataValue}>{liveAcceleration.toFixed(3)}</Text>
              <Text style={styles.unitText}>m/s²</Text>
            </View>

            <View style={styles.dataCard}>
              <Text style={styles.dataLabel}>PEAK FORCE</Text>
              <Text style={styles.dataValue}>{maxForce.toFixed(2)}</Text>
              <Text style={styles.unitText}>G-Force</Text>
            </View>
          </View>

          {/* LIVE STATUS INTERPRETATION */}
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>DETECTION ENGINE</Text>
            <Text style={[styles.statusValue, { color: currentStatus.includes("Hard") ? "#FF5252" : "#7A294E" }]}>
              {currentStatus}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Real-Time Activity Log</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={[styles.indicator, { backgroundColor: log.color }]} />
              <View>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={styles.logTitle}>{log.title}</Text>
              </View>
            </View>
          ))}
          
          {logs.length === 0 && (
            <Text style={styles.emptyHint}>Move the phone to generate real data...</Text>
          )}

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, paddingHorizontal: 20 },
  backBtn: { marginTop: 50, marginBottom: 20 },
  header: { marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#7A294E' },
  headerSub: { fontSize: 14, color: '#A07A88', fontWeight: '600' },
  
  dataGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dataCard: { backgroundColor: 'white', width: '47%', padding: 20, borderRadius: 20, elevation: 4, alignItems: 'center' },
  dataLabel: { fontSize: 10, fontWeight: '900', color: '#A07A88' },
  dataValue: { fontSize: 22, fontWeight: 'bold', color: '#7A294E', marginVertical: 5 },
  unitText: { fontSize: 10, color: '#A07A88', fontWeight: 'bold' },

  statusBox: { backgroundColor: 'white', padding: 25, borderRadius: 25, elevation: 4, marginBottom: 30 },
  statusLabel: { fontSize: 10, fontWeight: '900', color: '#A07A88', textAlign: 'center' },
  statusValue: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 10 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#7A294E', marginBottom: 15 },
  logItem: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  indicator: { width: 4, height: 30, borderRadius: 2, marginRight: 15 },
  logTime: { fontSize: 11, fontWeight: 'bold', color: '#A07A88' },
  logTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptyHint: { textAlign: 'center', color: '#A07A88', marginTop: 40, fontStyle: 'italic' }
});