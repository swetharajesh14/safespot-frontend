import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Platform 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SOCKET_URL = 'http://192.168.1.19:3000'; 

export default function RealTimeMap() {
  const [myLocation, setMyLocation] = useState<any>(null);
  const [kinLocation, setKinLocation] = useState<any>(null);
  const socket = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    socket.current = io(SOCKET_URL);

    socket.current.on('location_update', (data: any) => {
      // Logic: Only show the other person (Protector) if ID is different
      if (data.userId !== 'Swetha_01') {
        setKinLocation(data);
      }
    });

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (location) => {
          setMyLocation(location.coords);
          if (socket.current) {
            socket.current.emit('update_location', {
              userId: 'Swetha_01',
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              name: 'Swetha'
            });
          }
        }
      );
    })();

    return () => { if (socket.current) socket.current.disconnect(); };
  }, []);

  // ONLY ONE SIMULATE FUNCTION HERE (Fixes your redeclare error)
  const simulateKinMove = () => {
    if (!myLocation) return;
    
    // We create a location that is far enough to see, but close enough to be on the map
    const newKinLoc = {
      userId: 'Kin_Demo',
      latitude: myLocation.latitude + 0.005, // Offset to show difference
      longitude: myLocation.longitude + 0.005,
      name: 'Protector'
    };
    
    setKinLocation(newKinLoc);

    // AUTO-ZOOM: This moves the camera to show both dots
    mapRef.current?.fitToCoordinates([
      { latitude: myLocation.latitude, longitude: myLocation.longitude },
      { latitude: newKinLoc.latitude, longitude: newKinLoc.longitude }
    ], {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  if (!myLocation) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7A294E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#7A294E" />
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={myLocation} title="You">
          <View style={styles.myMarker} />
        </Marker>

        {kinLocation && (
          <Marker coordinate={{ latitude: kinLocation.latitude, longitude: kinLocation.longitude }}>
            <View style={styles.dotContainer}>
              <View style={styles.pingCircle} />
              <View style={styles.mainDot} />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusTitle}>Shield Active</Text>
            <Text style={styles.statusText}>
              {kinLocation ? "Protector Online" : "Waiting for signal..."}
            </Text>
          </View>
          <TouchableOpacity style={styles.testBtn} onPress={simulateKinMove}>
             <Text style={styles.testBtnText}>TEST SIGNAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF0' },
  backBtn: { 
    position: 'absolute', top: 50, left: 20, zIndex: 10, 
    backgroundColor: 'white', padding: 12, borderRadius: 50, elevation: 5 
  },
  myMarker: { 
    width: 18, height: 18, borderRadius: 9, 
    backgroundColor: '#007AFF', borderWidth: 3, borderColor: 'white' 
  },
  dotContainer: { justifyContent: 'center', alignItems: 'center', width: 40, height: 40 },
  mainDot: { 
    width: 18, height: 18, borderRadius: 9, 
    backgroundColor: '#FF3B30', borderWidth: 3, borderColor: 'white' 
  },
  pingCircle: { 
    position: 'absolute', width: 30, height: 30, borderRadius: 15, 
    backgroundColor: 'rgba(255, 59, 48, 0.2)' 
  },
  statusCard: { 
    position: 'absolute', bottom: 30, left: 20, right: 20, 
    backgroundColor: 'white', padding: 20, borderRadius: 25, elevation: 10 
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTitle: { fontWeight: 'bold', fontSize: 18, color: '#7A294E' },
  statusText: { color: '#8A5A6A', marginTop: 2, fontSize: 13 },
  testBtn: { backgroundColor: '#7A294E', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  testBtnText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});