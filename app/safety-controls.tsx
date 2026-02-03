import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SafetyControlsScreen() {

  const router = useRouter();

  const [nightSafety, setNightSafety] = useState(true);
  const [silentSOS, setSilentSOS] = useState(false);
  const [lowBatteryMode, setLowBatteryMode] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FFFBF0', '#FDF2F7', '#F6E6EE']} style={styles.bg}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#7A294E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Controls</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Safety Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Safety Controls</Text>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>Night Safety Mode</Text>
                  <Text style={styles.rowSub}>Boost tracking + alerts after evening</Text>
                </View>
              </View>
              <Switch value={nightSafety} onValueChange={setNightSafety} />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="volume-mute-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>Silent SOS</Text>
                  <Text style={styles.rowSub}>Send SOS without sound</Text>
                </View>
              </View>
              <Switch value={silentSOS} onValueChange={setSilentSOS} />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="options-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>SOS Sensitivity</Text>
                  <Text style={styles.rowSub}>Low / Medium / High</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#7A294E" />
            </TouchableOpacity>
          </View>

          {/* Power & Data */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Power & Data</Text>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="battery-half-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>Low Battery Safety Mode</Text>
                  <Text style={styles.rowSub}>Keep tracking alive, reduce UI</Text>
                </View>
              </View>
              <Switch value={lowBatteryMode} onValueChange={setLowBatteryMode} />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="cloud-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>Sync Frequency</Text>
                  <Text style={styles.rowSub}>Every 10 sec / 30 sec / 1 min</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#7A294E" />
            </TouchableOpacity>
          </View>

          {/* App */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>App</Text>

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>Privacy Policy</Text>
                  <Text style={styles.rowSub}>How your data is handled</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#7A294E" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={18} color="#7A294E" />
                <View>
                  <Text style={styles.rowTitle}>About SafeSpot</Text>
                  <Text style={styles.rowSub}>Version, credits, and support</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#7A294E" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0' },
  bg: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },

  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#7A294E' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginTop: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#7A294E', marginBottom: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, paddingRight: 14 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: '#7A294E' },
  rowSub: { fontSize: 12, color: '#A07A88', marginTop: 2, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F3E5EC' },
});
