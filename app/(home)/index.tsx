import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';

const { width } = Dimensions.get('window');
const API_URL = 'https://safespot-backend-vx2w.onrender.com';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0' },
  background: { flex: 1, paddingHorizontal: 25 },
  topSpacer: { height: 80 },

  headerTextWrapper: { alignItems: 'flex-start' },
  greetingText: { fontSize: 32, fontWeight: '700', color: '#7A294E' },
  subGreeting: { fontSize: 14, color: '#A07A88', marginTop: 4 },

  monitoringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusLabel: { fontSize: 9, fontWeight: '900', color: '#A07A88', letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#7A294E' },

  gridContainer: { width: '100%' },
  gridCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 20,
    elevation: 3,
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#7A294E', marginBottom: 15 },

  circleRow: { flexDirection: 'row', alignItems: 'center' },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F6E6EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#7A294E',
  },
  circlePhoto: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white' },
  emptyState: { alignItems: 'center', paddingVertical: 20 },

  menuGrid: { width: '100%', marginTop: 5 },
  menuButton: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    width: '100%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: { fontSize: 16, fontWeight: '700', color: '#7A294E' },
});

interface Protector {
  id: string;
  name: string;
  photo: string;
}

export default function SafeSpotIndex() {
  const router = useRouter();
  const [protectors, setProtectors] = useState<Protector[]>([]);
  const BACKEND_URL = API_URL;

  const fetchProtectors = async () => {
    try {
      console.log('Fetching for Swetha_01...');
      const response = await fetch(`${BACKEND_URL}/api/protectors/Swetha_01`);

      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data.length, 'contacts found');

        const formattedData = data.map((p: any) => ({
          id: p._id ? p._id.toString() : Math.random().toString(),
          name: p.name,
          photo: p.photo || 'https://via.placeholder.com/150',
        }));

        setProtectors(formattedData);
      } else {
        console.log('Server responded with error:', response.status);
      }
    } catch (error) {
      console.log('Fetch failed. Check internet or Render URL.');
    }
  };

  const handleAddProtector = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow contact access.');
      return;
    }

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const contactData = {
          userId: 'Swetha_01',
          name: contact.firstName || 'Protector',
          photo: contact.image?.uri || 'https://via.placeholder.com/150',
          phone: contact.phoneNumbers?.[0]?.number || '0000000000',
        };

        console.log('Sending contact to backend...');
        const response = await fetch(`${BACKEND_URL}/api/protectors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData),
        });

        if (response.ok) {
          Alert.alert('Success', 'Protector added to your circle!');
          fetchProtectors();
        } else {
          Alert.alert('Error', 'Server failed to save contact.');
        }
      }
    } catch (error) {
      console.log('Add failed:', error);
      Alert.alert('Error', 'Could not add contact.');
    }
  };

  useEffect(() => {
    fetchProtectors();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FFFBF0', '#FDF2F7', '#F6E6EE']} style={styles.background}>
        <View style={styles.topSpacer} />

        {/* ✅ FIXED HEADER (single block, no duplicates) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <View style={styles.headerTextWrapper}>
            <Text style={styles.greetingText}>SafeSpot</Text>
            <Text style={styles.subGreeting}>You're always safe in SafeSpot</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/(dock)/journey')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.8)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="map-outline" size={22} color="#7A294E" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(dock)/profile')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.8)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-outline" size={22} color="#7A294E" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.monitoringCard} onPress={() => router.push('/history')}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="stats-chart" size={24} color="#7A294E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
            <Text style={styles.statusValue}>View Movement Logs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7A294E" />
        </TouchableOpacity>

        <View style={styles.gridContainer}>
          <View style={[styles.gridCard, { width: width - 50 }]}>
            <Text style={styles.cardTitle}>My Circle</Text>

            <View style={styles.circleRow}>
              <TouchableOpacity style={styles.plusBtn} onPress={handleAddProtector}>
                <Ionicons name="add" size={22} color="#7A294E" />
              </TouchableOpacity>

              {protectors.length > 0 ? (
                protectors.map((p) => (
                  <TouchableOpacity key={p.id} style={{ marginLeft: -12 }}>
                    <Image source={{ uri: p.photo }} style={styles.circlePhoto} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#A07A88" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/map')}>
              <View style={styles.iconCircle}>
                <Ionicons name="map" size={32} color="#7A294E" />
              </View>
              <Text style={styles.menuText}>SafeZones & Live Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
