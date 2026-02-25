import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Settings() {
  const router = useRouter();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(50));

  React.useEffect(() => {
    // Simple fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Simple slide-up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFBF0', '#FDF2F7', '#F6E6EE']} style={styles.background}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(dock)/home')}>
          <Ionicons name="arrow-back" size={28} color="#7A294E" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.headerTitle}>About SafeSpot</Text>
            <Text style={styles.headerSub}>Your Safety Companion</Text>
          </Animated.View>

          {/* WELCOME CARD */}
          <Animated.View 
            style={[
              styles.welcomeCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#2F8F6B" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to SafeSpot</Text>
            <Text style={styles.welcomeText}>
              We're here to keep you safe and connected with your loved ones, every step of the way.
            </Text>
          </Animated.View>

          {/* HOW IT WORKS */}
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>How SafeSpot Works</Text>
            
            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="phone-portrait" size={24} color="#7A294E" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>1. Your Phone Helps</Text>
                <Text style={styles.stepText}>
                  Your phone's sensors notice how you're moving - like walking, sitting, or if something unusual happens.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="people" size={24} color="#7A294E" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>2. Your Circle Cares</Text>
                <Text style={styles.stepText}>
                  Choose trusted friends and family who will be there for you when you need help.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="heart" size={24} color="#7A294E" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>3. We Watch Over You</Text>
                <Text style={styles.stepText}>
                  If something seems wrong, we'll check on you and let your circle know if you need help.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* DATA PRIVACY */}
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
            
            <View style={styles.privacyCard}>
              <View style={styles.privacyItem}>
                <Ionicons name="lock-closed" size={20} color="#2F8F6B" />
                <Text style={styles.privacyText}>
                  Your data stays private and secure. We never share it with anyone without your permission.
                </Text>
              </View>

              <View style={styles.privacyItem}>
                <Ionicons name="eye-off" size={20} color="#2F8F6B" />
                <Text style={styles.privacyText}>
                  We only collect movement information to keep you safe - no personal photos, messages, or private details.
                </Text>
              </View>

              <View style={styles.privacyItem}>
                <Ionicons name="hand-left" size={20} color="#2F8F6B" />
                <Text style={styles.privacyText}>
                  You're always in control. You can stop sharing data anytime, right from your settings.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* OUR PROMISE */}
          <Animated.View 
            style={[
              styles.promiseCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.promiseTitle}>Our Promise to You</Text>
            <Text style={styles.promiseText}>
              SafeSpot was created with care to help you feel safer every day. We believe everyone deserves to feel protected and connected to people who care about them.
            </Text>
            <View style={styles.promiseFooter}>
              <Text style={styles.signature}>With warmth and care,</Text>
              <Text style={styles.teamName}>The SafeSpot Team</Text>
            </View>
          </Animated.View>

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, paddingHorizontal: 20 },
  backBtn: { marginTop: 50, marginBottom: 20 },
  
  header: { marginBottom: 30, alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#7A294E', textAlign: 'center' },
  headerSub: { fontSize: 16, color: '#A07A88', fontWeight: '600', textAlign: 'center', marginTop: 5 },

  welcomeCard: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 25, 
    marginBottom: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#7A294E', marginBottom: 10, textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#A07A88', textAlign: 'center', lineHeight: 24 },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#7A294E', marginBottom: 20 },

  stepCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#7A294E', marginBottom: 8 },
  stepText: { fontSize: 15, color: '#A07A88', lineHeight: 22 },

  privacyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 15,
    color: '#A07A88',
    lineHeight: 22,
    marginLeft: 15,
    flex: 1,
  },

  promiseCard: {
    backgroundColor: '#F8F4F7',
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EFE3EA',
  },
  promiseTitle: { fontSize: 22, fontWeight: '800', color: '#7A294E', marginBottom: 15, textAlign: 'center' },
  promiseText: { fontSize: 16, color: '#A07A88', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  promiseFooter: { alignItems: 'center' },
  signature: { fontSize: 14, color: '#A07A88', fontStyle: 'italic' },
  teamName: { fontSize: 16, fontWeight: '700', color: '#7A294E', marginTop: 5 },
});
