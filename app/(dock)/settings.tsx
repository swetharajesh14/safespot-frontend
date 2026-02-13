import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { startMotionTracking, stopMotionTracking } from "../../tasks/motionTracker";




export default function Settings() {
  const [on, setOn] = useState(false);


const start = async () => {
  try {
    await startMotionTracking();
    setOn(true);
    Alert.alert("Started ✅", "Movement tracking started");
  } catch (e: any) {
    Alert.alert("Error", e.message || "Could not start tracking");
  }
};

const stop = async () => {
  await stopMotionTracking();
  setOn(false);
  Alert.alert("Stopped", "Tracking OFF");
};

  return (
    <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
      <View style={styles.card}>
        <Text style={styles.title}>Journey Tracking</Text>
        <Text style={styles.sub}>Store raw points 30 days · Summary forever</Text>

        <View style={styles.row}>
          <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color="#7A294E" />
          <Text style={styles.status}>{on ? "Tracking ON" : "Tracking OFF"}</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={on ? stop : start}>
          <Text style={styles.btnText}>{on ? "Stop Tracking" : "Start Tracking"}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, padding: 18, paddingTop: 70 },
  card: { backgroundColor: "white", borderRadius: 22, padding: 18 },
  title: { fontSize: 18, fontWeight: "900", color: "#7A294E" },
  sub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#A07A88" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  status: { fontSize: 13, fontWeight: "800", color: "#7A294E" },
  btn: {
    marginTop: 18,
    backgroundColor: "#F6E6EE",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7A294E",
  },
  btnText: { fontSize: 13, fontWeight: "900", color: "#7A294E" },
});
