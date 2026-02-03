import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function KinProfile() {
  const { id } = useLocalSearchParams(); // Gets the person's ID

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFFBF0', '#F6E6EE']} style={styles.background}>
        
        {/* Navigation Header */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#7A294E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Kin Details</Text>
          <View style={{ width: 28 }} /> 
        </View>

        {/* Profile Card */}
        <View style={styles.mainCard}>
          <View style={styles.imageFrame}>
            <Image source={{ uri: `https://i.pravatar.cc/150?u=${id}` }} style={styles.profileImg} />
            <View style={styles.onlineBadge} />
          </View>
          
          <Text style={styles.name}>Emma Watson</Text>
          <Text style={styles.role}>Emergency Contact</Text>

          {/* Vitals Row */}
          <View style={styles.vitalsRow}>
            <View style={styles.vitalPill}>
              <Ionicons name="battery-full" size={16} color="#4CAF50" />
              <Text style={styles.vitalText}>84%</Text>
            </View>
            <View style={styles.vitalPill}>
              <Ionicons name="wifi" size={16} color="#7A294E" />
              <Text style={styles.vitalText}>Strong</Text>
            </View>
          </View>
        </View>

        {/* Action Center */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={24} color="#7A294E" />
            <Text style={styles.actionLabel}>Voice Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(home)/map')}>
            <Ionicons name="navigate-outline" size={24} color="#7A294E" />
            <Text style={styles.actionLabel}>Locate</Text>
          </TouchableOpacity>
        </View>

        {/* Current Echo (Recent Activity) */}
        <View style={styles.echoCard}>
          <Text style={styles.echoHeader}>Current Echo</Text>
          <View style={styles.echoItem}>
            <View style={styles.echoDot} />
            <Text style={styles.echoText}>Entered "Home Zone" at 12:45 PM</Text>
          </View>
        </View>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, paddingHorizontal: 25 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  navTitle: { fontSize: 18, fontWeight: '600', color: '#7A294E' },
  mainCard: { alignItems: 'center', marginTop: 40, backgroundColor: 'white', borderRadius: 40, padding: 30, elevation: 5 },
  imageFrame: { width: 110, height: 110, borderRadius: 55, padding: 4, backgroundColor: '#F6E6EE', marginBottom: 15 },
  profileImg: { width: '100%', height: '100%', borderRadius: 55 },
  onlineBadge: { position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', borderWidth: 3, borderColor: 'white' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#7A294E' },
  role: { fontSize: 14, color: '#A07A88', marginTop: 4 },
  vitalsRow: { flexDirection: 'row', marginTop: 20 },
  vitalPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F0F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginHorizontal: 5 },
  vitalText: { marginLeft: 6, color: '#7A294E', fontWeight: '600', fontSize: 13 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  actionButton: { width: '48%', backgroundColor: 'white', height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  actionLabel: { marginTop: 8, color: '#7A294E', fontWeight: '500' },
  echoCard: { marginTop: 25, backgroundColor: 'white', borderRadius: 30, padding: 25, elevation: 3 },
  echoHeader: { fontSize: 16, fontWeight: 'bold', color: '#7A294E', marginBottom: 15 },
  echoItem: { flexDirection: 'row', alignItems: 'center' },
  echoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4A5B9', marginRight: 12 },
  echoText: { color: '#8A5A6A', fontSize: 14 }
});