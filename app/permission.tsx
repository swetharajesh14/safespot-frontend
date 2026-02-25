import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function PermissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'denied' | 'granted'>('checking');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      setPermissionStatus('checking');

      // Check foreground permission
      const fgStatus = await Location.getForegroundPermissionsAsync();
      
      if (fgStatus.status !== 'granted') {
        setPermissionStatus('denied');
        return;
      }

      // Check background permission
      const bgStatus = await Location.getBackgroundPermissionsAsync();
      
      if (bgStatus.status !== 'granted') {
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');
    } catch (error) {
      console.log('Permission check error:', error);
      setPermissionStatus('denied');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);

      // Request foreground permission
      const fgStatus = await Location.requestForegroundPermissionsAsync();
      if (fgStatus.status !== 'granted') {
        setPermissionStatus('denied');
        setLoading(false);
        return;
      }

      // Request background permission
      const bgStatus = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus.status !== 'granted') {
        setPermissionStatus('denied');
        setLoading(false);
        return;
      }

      // Both permissions granted - navigate to home
      setPermissionStatus('granted');
      setTimeout(() => {
        router.replace('/(dock)/home');
      }, 1000);
    } catch (error) {
      console.log('Permission request error:', error);
      setPermissionStatus('denied');
      setLoading(false);
    }
  };

  const openSettings = () => {
    // Open app settings for user to manually enable permissions
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFBF0', '#FDF2F7', '#F6E6EE']} style={styles.background}>
        
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7A294E" />
              <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
          ) : permissionStatus === 'denied' ? (
            <View style={styles.permissionContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={60} color="#A07A88" />
              </View>
              
              <Text style={styles.title}>Location Permission Required</Text>
              <Text style={styles.subtitle}>
                SafeSpot needs location access to keep you safe and track your journey
              </Text>
              
              <View style={styles.reasonContainer}>
                <View style={styles.reasonItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#2F8F6B" />
                  <Text style={styles.reasonText}>Safety monitoring</Text>
                </View>
                <View style={styles.reasonItem}>
                  <Ionicons name="map" size={20} color="#2F8F6B" />
                  <Text style={styles.reasonText}>Journey tracking</Text>
                </View>
                <View style={styles.reasonItem}>
                  <Ionicons name="people" size={20} color="#2F8F6B" />
                  <Text style={styles.reasonText}>Emergency alerts</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.grantButton} onPress={requestPermissions}>
                <Text style={styles.grantButtonText}>Grant Permission</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                <Ionicons name="settings-outline" size={18} color="#A07A88" />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#2F8F6B" />
              </View>
              
              <Text style={styles.title}>Permissions Granted!</Text>
              <Text style={styles.subtitle}>
                SafeSpot is ready to keep you safe
              </Text>
              
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={16} color="#2F8F6B" />
                <Text style={styles.checkmarkText}>Location access enabled</Text>
              </View>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={16} color="#2F8F6B" />
                <Text style={styles.checkmarkText}>Background tracking active</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 30 
  },
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#A07A88',
  },

  permissionContainer: {
    alignItems: 'center',
    maxWidth: 350,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7A294E',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A07A88',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },

  reasonContainer: {
    marginBottom: 30,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reasonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#7A294E',
  },

  grantButton: {
    backgroundColor: '#7A294E',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  grantButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  settingsButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#A07A88',
  },

  successContainer: {
    alignItems: 'center',
    maxWidth: 350,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkmarkText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2F8F6B',
  },
});
