import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const BACKEND_URL = 'https://safespot-backend-vx2w.onrender.com/api/protectors';
const USER_ID = 'Swetha_01'; // Matches your History records

interface Guardian {
  _id?: string; // MongoDB ID
  userId: string;
  name: string;
  phone: string;
  angle?: number;
}

export default function ContactsScreen() {
  const router = useRouter();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 1. FETCH FROM BACKEND (MongoDB)
  const fetchGuardians = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/${USER_ID}`);
      const data = await response.json();
      // Assign angles for the radar UI
      const positionedData = data.map((g: any, index: number) => ({
        ...g,
        angle: (index * 72) - 90
      }));
      setGuardians(positionedData);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 2. ADD TO BACKEND
  const addGuardian = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const newG = {
          userId: USER_ID,
          name: contact.name,
          phone: contact.phoneNumbers[0].number || "No Number",
        };

        try {
          const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newG),
          });
          if (response.ok) {
            fetchGuardians(); // Refresh from DB
          }
        } catch (e) {
          Alert.alert("Error", "Could not save to server.");
        }
      }
    }
  };

  // 3. REMOVE FROM BACKEND
  const removeGuardian = (id: string) => {
    Alert.alert("Remove Guardian", "Remove this person from your Safety Circle?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Remove", 
        style: "destructive", 
        onPress: async () => {
          try {
            const response = await fetch(`${BACKEND_URL}/${id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              fetchGuardians(); // Refresh list
            }
          } catch (e) {
            Alert.alert("Error", "Delete failed.");
          }
        }
      }
    ]);
  };

  const renderGuardian = (g: Guardian) => {
    const radius = CIRCLE_SIZE / 2.2;
    const angle = g.angle || 0;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);

    return (
      <View key={g._id} style={[styles.guardianPos, { transform: [{ translateX: x }, { translateY: y }] }]}>
        <TouchableOpacity style={styles.guardianNode} onPress={() => Alert.alert(g.name, g.phone)}>
          <Ionicons name="person" size={20} color="#7A294E" />
          <Animated.View style={[styles.heartbeat, { opacity: pulseAnim }]} />
          <TouchableOpacity 
            style={styles.removeIcon} 
            onPress={() => removeGuardian(g._id!)}
          >
            <Ionicons name="close-circle" size={18} color="#FF5252" />
          </TouchableOpacity>
        </TouchableOpacity>
        <Text style={styles.guardianName} numberOfLines={1}>{g.name}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFF3D6', '#F6E6EE']} style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#7A294E" />
      </TouchableOpacity>

      <Text style={styles.title}>Safety Circle</Text>
      <Text style={styles.subtitle}>Trusted Guardians synced with MongoDB</Text>

      <View style={styles.radarContainer}>
        <View style={styles.ring} />
        <View style={styles.userCore}>
          <LinearGradient colors={['#7A294E', '#5A1E39']} style={styles.coreGradient}>
            <Ionicons name="pulse" size={32} color="white" />
          </LinearGradient>
        </View>
        
        {loading ? (
          <ActivityIndicator color="#7A294E" style={{ position: 'absolute' }} />
        ) : (
          guardians.map(renderGuardian)
        )}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addGuardian}>
        <LinearGradient colors={['#7A294E', '#5A1E39']} style={styles.addGradient}>
          <Ionicons name="person-add" size={24} color="white" />
          <Text style={styles.addBtnText}>Add Guardian</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60 },
  backButton: { position: 'absolute', top: 50, left: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#7A294E' },
  subtitle: { fontSize: 14, color: '#8A5A6A', marginTop: 5 },
  radarContainer: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  ring: { position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE, borderWidth: 1, borderColor: 'rgba(122, 41, 78, 0.1)' },
  userCore: { width: 70, height: 70, borderRadius: 35, zIndex: 10 },
  coreGradient: { flex: 1, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  guardianPos: { position: 'absolute', alignItems: 'center' },
  guardianNode: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  heartbeat: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  removeIcon: { position: 'absolute', top: -8, left: -8, backgroundColor: 'white', borderRadius: 10 },
  guardianName: { fontSize: 11, fontWeight: '600', color: '#7A294E', marginTop: 4, width: 70, textAlign: 'center' },
  addBtn: { marginTop: 'auto', marginBottom: 60, width: '60%' },
  addGradient: { paddingVertical: 15, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 }
});