import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Instructions() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(20)).current;
  const card1Anim = useRef(new Animated.Value(30)).current;
  const card2Anim = useRef(new Animated.Value(40)).current;
  const card3Anim = useRef(new Animated.Value(50)).current;
  const imageFloat = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 1. Entrance Parallel
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      // Constant "Breathing" animation for the image
      Animated.loop(
        Animated.sequence([
          Animated.timing(imageFloat, { toValue: -15, duration: 2500, useNativeDriver: true }),
          Animated.timing(imageFloat, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      )
    ]).start();

    // 2. STAGGERED REVEAL (The Innovative Transition)
    // We use a spring with "bounciness" for a more organic feel
    const createSpring = (val: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.spring(val, {
          toValue: 0,
          speed: 2,
          bounciness: 12,
          useNativeDriver: true
        })
      ]);
    };

    Animated.parallel([
      createSpring(titleAnim, 400),
      createSpring(card1Anim, 700),
      createSpring(card2Anim, 1000),
      createSpring(card3Anim, 1300),
      Animated.sequence([
        Animated.delay(1600),
        Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  const handleContinue = () => {
    router.replace('/(home)');
  };

  return (
    <LinearGradient colors={['#FFF3D6', '#F6E6EE']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* INNOVATIVE: Floating Image with Parallax Scale */}
        <Animated.View style={[
          styles.imageContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: imageFloat }, { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
          }
        ]}>
          <Image 
            source={require('../../assets/teacher.png')} 
            style={styles.teacherPhoto}
            resizeMode="contain"
          />
        </Animated.View>

        {/* REVEAL CARDS with staggered spring transitions */}
        <Animated.View style={[styles.titleCard, { opacity: fadeAnim, transform: [{ translateY: titleAnim }] }]}>
          <Text style={styles.title}>We learn gently.</Text>
        </Animated.View>

        <Animated.View style={[styles.textCard, { opacity: fadeAnim, transform: [{ translateY: card1Anim }] }]}>
          <Text style={styles.text}>
            SafeSpot quietly understands how you usually move — whether you walk, run, or rest.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textCard, { opacity: fadeAnim, transform: [{ translateY: card2Anim }] }]}>
          <Text style={styles.text}>
            You don't need to change anything. We simply adapt to you, softly and respectfully.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textCard, { opacity: fadeAnim, transform: [{ translateY: card3Anim }] }]}>
          <Text style={styles.textMuted}>
            Your routine stays yours. We stay in the background.
          </Text>
        </Animated.View>

        {/* BUTTON with soft-reveal transition */}
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }], opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
            <LinearGradient 
                colors={['#7A294E', '#5A1E39']} 
                start={{x: 0, y:0}} 
                end={{x: 1, y:0}} 
                style={styles.gradientBtn}
            >
              <Text style={styles.buttonText}>Start Protection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  imageContainer: {
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  teacherPhoto: {
    width: 160,
    height: 160,
  },
  titleCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    width: '100%',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#7A294E',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  textCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#7A294E', textAlign: 'center' },
  text: { fontSize: 16, color: '#8A5A6A', textAlign: 'center', lineHeight: 24 },
  textMuted: { fontSize: 14, color: '#A07A88', textAlign: 'center', fontStyle: 'italic' },
  buttonContainer: { width: '100%', marginTop: 20 },
  continueButton: { borderRadius: 30, elevation: 8, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});