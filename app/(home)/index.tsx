// app/(home)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { startMotionTracking } from "../../tasks/motionTracker";

const { width } = Dimensions.get("window");
const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

type Protector = {
  _id: string;
  name: string;
  photo: string;
  phone: string;
};

export default function SafeSpotIndex() {
  const nav = useRouter();
  const [protectors, setProtectors] = useState<Protector[]>([]);

  // ✅ FIX: hooks must be inside the component
  useEffect(() => {
    startMotionTracking();
  }, []);

  const fetchProtectors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/protectors/${USER_ID}`);
      if (!res.ok) return;
      const data = await res.json();

      const formattedData = data.map((p: any) => ({
        _id: String(p._id),
        name: p.name,
        photo: p.photo || "https://via.placeholder.com/150",
        phone: p.phone,
      }));

      setProtectors(formattedData);
    } catch (e) {
      console.log("Fetch protectors failed:", e);
    }
  };
const deleteProtector = async (protectorId: string) => {
  try {
    const res = await fetch(`${API_URL}/api/protectors/${protectorId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      Alert.alert("Delete failed", data?.message || "Server error");
      return;
    }

    // ✅ update UI immediately
    setProtectors((prev) => prev.filter((p) => p._id !== protectorId));
    Alert.alert("Removed", "Protector removed successfully");
  } catch (e: any) {
    Alert.alert("Delete failed", e?.message || "Network error");
  }
};
  const handleAddProtector = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow contact access.");
      return;
    }

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const payload = {
        userId: USER_ID,
        name: contact.firstName || "Protector",
        photo: contact.image?.uri || "https://via.placeholder.com/150",
        phone: contact.phoneNumbers?.[0]?.number || "0000000000",
      };

      const res = await fetch(`${API_URL}/api/protectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert("Success", "Protector added to your circle!");
        fetchProtectors();
      } else {
        Alert.alert("Error", "Server failed to save contact.");
      }
    } catch (e) {
      console.log("Add protector failed:", e);
      Alert.alert("Error", "Could not add contact.");
    }
  };

  useEffect(() => {
    fetchProtectors();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.greetingText}>SafeSpot</Text>
              <Text style={styles.subGreeting}>
                You&apos;re always safe in SafeSpot
              </Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => nav.push("/(dock)/journey")}
                style={styles.headerIconBtn}
              >
                <Ionicons name="map-outline" size={22} color="#7A294E" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => nav.push("/(dock)/profile")}
                style={styles.headerIconBtn}
              >
                <Ionicons name="person-outline" size={22} color="#7A294E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Movement Analysis */}
          <TouchableOpacity
            style={styles.monitoringCard}
            onPress={() => {
              console.log("✅ Pressed Movement Analysis card");
              nav.push("/(home)/movement-analysis");
            }}
          >
            <View style={styles.statusIconContainer}>
              <Ionicons name="stats-chart" size={24} color="#7A294E" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
              <Text style={styles.statusValue}>Movement Analysis</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#7A294E" />
          </TouchableOpacity>

         {/* My Circle */}
              <View style={[styles.gridCard, { width: width - 50 }]}>
                <Text style={styles.cardTitle}>My Circle</Text>

                <View style={styles.circleRow}>
                  <TouchableOpacity style={styles.plusBtn} onPress={handleAddProtector}>
                    <Ionicons name="add" size={22} color="#7A294E" />
                  </TouchableOpacity>

                  {protectors.length > 0 ? (
                    protectors.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        style={{ marginLeft: -12 }}
                        onLongPress={() => {
                          Alert.alert("Remove protector?", `${p.name}\n${p.phone}`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Remove", style: "destructive", onPress: () => deleteProtector(p._id) },
                          ]);
                        }}
                      >
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
          {/* Map */}
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuButton} onPress={() => nav.push("/(home)/map")}>
              <View style={styles.iconCircle}>
                <Ionicons name="map" size={32} color="#7A294E" />
              </View>
              <Text style={styles.menuText}>SafeZones & Live Map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBF0" },
  background: { flex: 1, paddingHorizontal: 25 },
  topSpacer: { height: 60 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTextWrapper: { alignItems: "flex-start" },
  greetingText: { fontSize: 32, fontWeight: "700", color: "#7A294E" },
  subGreeting: { fontSize: 14, color: "#A07A88", marginTop: 4 },

  headerIcons: { flexDirection: "row", gap: 12 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  monitoringCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FDF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  statusLabel: { fontSize: 9, fontWeight: "900", color: "#A07A88", letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: "700", color: "#7A294E" },

  gridCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    elevation: 3,
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#7A294E", marginBottom: 15 },

  circleRow: { flexDirection: "row", alignItems: "center" },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F6E6EE",
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#7A294E",
  },
  circlePhoto: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "white" },
  emptyState: { alignItems: "center", paddingVertical: 20 },

  menuGrid: { width: "100%", marginTop: 5 },
  menuButton: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuText: { fontSize: 16, fontWeight: "700", color: "#7A294E" },
});