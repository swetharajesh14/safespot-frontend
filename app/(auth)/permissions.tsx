import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Easing } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Permissions() {
  const [isVerifying, setIsVerifying] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();

    // Soft heartbeat
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Very slow, thin radar rotation
    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleEnable = async () => {
    setIsVerifying(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // High-accuracy check (Original location)
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        setTimeout(() => { router.replace('/(auth)/instructions'); }, 1000);
      } else {
        setIsVerifying(false);
      }
    } catch (error) {
      setIsVerifying(false);
      router.replace('/(auth)/instructions');
    }
  };

  return (
    <LinearGradient colors={['#FFFBF0', '#F6E6EE']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        <View style={styles.visualWrapper}>
          <Animated.View style={[styles.radarLine, { 
            transform: [{ rotate: radarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] 
          }]} />
          <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
            {isVerifying ? (
              <ActivityIndicator color="#7A294E" size="small" />
            ) : (
              <Ionicons name="navigate-outline" size={28} color="#7A294E" />
            )}
          </Animated.View>
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.title}>Stay Connected</Text>
          <Text style={styles.subtitle}>
            Allow SafeSpot to walk with you{'\n'}and keep you safe.
          </Text>
        </View>

        {/* UNIQUE NEW PHRASE */}
        <View style={styles.trustNote}>
          <Ionicons name="sparkles-outline" size={14} color="#7A294E" style={{ opacity: 0.5 }} />
          <Text style={styles.trustText}>Like a gentle breeze, watching over your steps.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleEnable}
            disabled={isVerifying}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {isVerifying ? "Connecting..." : "Share my journey"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/instructions')}>
            <Text style={styles.skipText}>Not now, maybe later</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 45 },
  visualWrapper: { justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
  radarLine: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(122, 41, 78, 0.05)',
    borderTopColor: 'rgba(122, 41, 78, 0.4)', // Very soft scan line
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  textGroup: { alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 24, fontWeight: '400', color: '#7A294E', letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: '#8A5A6A', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '300' },
  trustNote: { 
  flexDirection: 'row', 
  alignItems: 'center',      // Centers icon and text vertically
  justifyContent: 'center',   // Centers the whole block horizontally
  marginBottom: 60, 
  backgroundColor: 'rgba(255, 255, 255, 0.4)', // Optional: very light background to define space
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 10,
},
trustText: {
  fontSize: 13,
  color: '#A07A88',
  marginLeft: 8,
  fontStyle: 'italic',
  textAlign: 'center', // This is usually more "gentle" for short phrases
},
  footer: { width: '100%', alignItems: 'center' },
  button: { 
    backgroundColor: '#7A294E', 
    paddingVertical: 17, 
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '500' },
  skipText: { color: '#A07A88', fontSize: 14, fontWeight: '400' },
});