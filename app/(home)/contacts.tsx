import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.75;

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const PROTECTORS_BASE = "https://safespot-backend-vx2w.onrender.com/api/protectors";
const USER_ID = "Swetha_01";

type Guardian = {
  _id?: string;
  userId: string;
  name: string;
  phone: string;
  angle?: number;
};

export default function ContactsScreen() {
  const router = useRouter();

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const assignAngles = useCallback((list: Guardian[]) => {
    // Spread guardians around the circle nicely.
    const n = list.length || 1;
    const step = 360 / n;
    return list.map((g, index) => ({
      ...g,
      angle: index * step - 90,
    }));
  }, []);

  // 1) FETCH FROM BACKEND
  const fetchGuardians = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${PROTECTORS_BASE}/${USER_ID}`);
      const data = await response.json();

      const arr: Guardian[] = Array.isArray(data) ? data : [];
      setGuardians(assignAngles(arr));
    } catch (e) {
      console.error("Fetch guardians error:", e);
      Alert.alert("Error", "Could not load guardians from server.");
      setGuardians([]);
    } finally {
      setLoading(false);
    }
  }, [assignAngles]);

  useEffect(() => {
    fetchGuardians();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [fetchGuardians, pulseAnim]);

  // 2) ADD TO BACKEND
  const addGuardian = useCallback(async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow contacts permission.");
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const phone =
        contact.phoneNumbers?.[0]?.number?.trim() || "";

      if (!phone) {
        Alert.alert("No number", "Selected contact has no phone number.");
        return;
      }

      const newG: Guardian = {
        userId: USER_ID,
        name: contact.name || "Unknown",
        phone,
      };

      const response = await fetch(PROTECTORS_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newG),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        Alert.alert("Error", `Could not save contact.\n${text}`);
        return;
      }

      await fetchGuardians(); // refresh from DB
    } catch (e) {
      console.error("Add guardian error:", e);
      Alert.alert("Error", "Could not save to server.");
    }
  }, [fetchGuardians]);

  // 3) REMOVE FROM BACKEND
  const removeGuardian = useCallback(
    (guardian: Guardian) => {
      if (!guardian._id) {
        Alert.alert("Error", "This contact cannot be removed (missing id).");
        return;
      }

      Alert.alert(
        "Remove Guardian",
        `Remove ${guardian.name} from your Safety Circle?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await fetch(
                  `${PROTECTORS_BASE}/${guardian._id}`,
                  { method: "DELETE" }
                );

                if (!response.ok) {
                  const text = await response.text().catch(() => "");
                  Alert.alert("Error", `Delete failed.\n${text}`);
                  return;
                }

                await fetchGuardians(); // refresh list
              } catch (e) {
                console.error("Delete guardian error:", e);
                Alert.alert("Error", "Delete failed.");
              }
            },
          },
        ]
      );
    },
    [fetchGuardians]
  );

  const renderGuardian = useCallback(
    (g: Guardian) => {
      const radius = CIRCLE_SIZE / 2.2;
      const angle = g.angle ?? 0;
      const x = radius * Math.cos((angle * Math.PI) / 180);
      const y = radius * Math.sin((angle * Math.PI) / 180);

      return (
        <View
          key={g._id ?? `${g.name}_${g.phone}`}
          style={[styles.guardianPos, { transform: [{ translateX: x }, { translateY: y }] }]}
        >
          <View style={styles.guardianNodeWrap}>
            {/* Main tap area: show details */}
            <TouchableOpacity
              style={styles.guardianNode}
              onPress={() => Alert.alert(g.name, g.phone)}
              activeOpacity={0.85}
            >
              <Ionicons name="person" size={20} color="#7A294E" />
              <Animated.View style={[styles.heartbeat, { opacity: pulseAnim }]} />
            </TouchableOpacity>

            {/* Remove button (separate touch area, avoids nested touch bugs) */}
            <TouchableOpacity
              style={styles.removeIcon}
              onPress={() => removeGuardian(g)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#FF5252" />
            </TouchableOpacity>
          </View>

          <Text style={styles.guardianName} numberOfLines={1}>
            {g.name}
          </Text>
        </View>
      );
    },
    [pulseAnim, removeGuardian]
  );

  return (
    <LinearGradient colors={["#FFF3D6", "#F6E6EE"]} style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#7A294E" />
      </TouchableOpacity>

      <Text style={styles.title}>Safety Circle</Text>
      <Text style={styles.subtitle}>Trusted Guardians synced with MongoDB</Text>

      <View style={styles.radarContainer}>
        <View style={styles.ring} />
        <View style={styles.userCore}>
          <LinearGradient colors={["#7A294E", "#5A1E39"]} style={styles.coreGradient}>
            <Ionicons name="pulse" size={32} color="white" />
          </LinearGradient>
        </View>

        {loading ? (
          <ActivityIndicator color="#7A294E" style={{ position: "absolute" }} />
        ) : guardians.length === 0 ? (
          <Text style={styles.emptyText}>No guardians yet. Add one below.</Text>
        ) : (
          guardians.map(renderGuardian)
        )}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addGuardian}>
        <LinearGradient colors={["#7A294E", "#5A1E39"]} style={styles.addGradient}>
          <Ionicons name="person-add" size={24} color="white" />
          <Text style={styles.addBtnText}>Add Guardian</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 60 },
  backButton: { position: "absolute", top: 50, left: 20 },

  title: { fontSize: 28, fontWeight: "800", color: "#7A294E" },
  subtitle: { fontSize: 14, color: "#8A5A6A", marginTop: 5 },

  radarContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },

  ring: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE,
    borderWidth: 1,
    borderColor: "rgba(122, 41, 78, 0.1)",
  },

  userCore: { width: 70, height: 70, borderRadius: 35, zIndex: 10 },
  coreGradient: { flex: 1, borderRadius: 35, justifyContent: "center", alignItems: "center" },

  guardianPos: { position: "absolute", alignItems: "center" },

  guardianNodeWrap: { width: 50, height: 50 },

  guardianNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  heartbeat: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },

  removeIcon: {
    position: "absolute",
    top: -8,
    left: -8,
    backgroundColor: "white",
    borderRadius: 10,
  },

  guardianName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7A294E",
    marginTop: 4,
    width: 70,
    textAlign: "center",
  },

  emptyText: {
    position: "absolute",
    bottom: 40,
    fontSize: 13,
    color: "#8A5A6A",
  },

  addBtn: { marginTop: "auto", marginBottom: 60, width: "60%" },
  addGradient: {
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "white", fontWeight: "bold", marginLeft: 8 },
});