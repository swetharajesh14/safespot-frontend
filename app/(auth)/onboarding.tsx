import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  // Animation refs for floating blobs
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle floating movement for background shapes
    const createFloat = (anim: Animated.Value, toValue: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    };

    createFloat(blob1Anim, 30, 4000).start();
    createFloat(blob2Anim, -40, 5000).start();

    // Fade in the main content slowly
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. Breathing Background Base */}
      <LinearGradient colors={["#FFFBF0", "#F6E6EE"]} style={StyleSheet.absoluteFill} />

      {/* 2. Soft Floating Aura Blobs */}
      <Animated.View style={[styles.blob, styles.blobLeft, { transform: [{ translateY: blob1Anim }] }]} />
      <Animated.View style={[styles.blob, styles.blobRight, { transform: [{ translateY: blob2Anim }] }]} />

      {/* 3. Main Content Layer */}
      <Animated.View style={[styles.content, { opacity: contentFade }]}>
        
        {/* Unique "Hands" Iconography */}
        <View style={styles.guardianWrapper}>
          <MaterialCommunityIcons name="hands-pray" size={80} color="rgba(122, 41, 78, 0.3)" />
          <View style={styles.innerPulse}>
             <Ionicons name="shield-checkmark" size={30} color="#7A294E" />
          </View>
        </View>

        <Text style={styles.titleText}>SafeSpot</Text>
        
        <View style={styles.divider} />

        <Text style={styles.description}>
          A quiet presence.{"\n"}A gentle shield.{"\n"}Always with you.
        </Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push("/(auth)/permissions")}
          style={styles.buttonContainer}
        >
          <LinearGradient
            colors={["#7A294E", "#9A4D6E"]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gentleButton}
          >
            <Text style={styles.btnText}>Begin Journey</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="white" />
          </LinearGradient>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  blob: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    opacity: 0.4,
  },
  blobLeft: {
    backgroundColor: '#FFE4D6',
    top: height * 0.1,
    left: -width * 0.2,
  },
  blobRight: {
    backgroundColor: '#E6D6FF',
    bottom: height * 0.2,
    right: -width * 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guardianWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  innerPulse: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#7A294E',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  titleText: {
    fontSize: 40,
    fontWeight: '300', // Thin font for a gentle look
    color: '#7A294E',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#7A294E',
    marginVertical: 20,
    opacity: 0.3,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#8A5A6A',
    lineHeight: 28,
    fontWeight: '300',
    fontStyle: 'italic',
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    shadowColor: '#7A294E',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  gentleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 40,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    letterSpacing: 2,
  }
});