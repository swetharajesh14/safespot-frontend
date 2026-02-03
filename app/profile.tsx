import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01"; // later from login

type User = {
  userId: string;
  name: string;
  phone: string;
  email: string;
  avatar: string; // cloud URL
  bloodGroup: string;
  medicalNotes: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState<User>({
    userId: USER_ID,
    name: "",
    phone: "",
    email: "",
    avatar: "",
    bloodGroup: "",
    medicalNotes: "",
  });

  // --- GET user from MongoDB ---
  const fetchUser = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/user/${USER_ID}`);
      const data = await res.json();

      // If not found, keep blank defaults
      if (!res.ok) {
        setUser((p) => ({ ...p, userId: USER_ID }));
        return;
      }

      setUser({
        userId: data.userId ?? USER_ID,
        name: data.name ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        avatar: data.avatar ?? "",
        bloodGroup: data.bloodGroup ?? "",
        medicalNotes: data.medicalNotes ?? "",
      });
    } catch (e) {
      Alert.alert("Error", "Failed to load profile. Check backend/API URL.");
    } finally {
      setLoading(false);
    }
  };

  // Load profile every time screen opens
  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  // --- Upload image to backend -> returns cloud URL ---
  const uploadAvatarToBackend = async (localUri: string) => {
    try {
      setUploading(true);

      const form = new FormData();
      form.append("image", {
        uri: localUri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_URL}/api/upload/avatar`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Upload failed", data.message || "Could not upload image");
        return null;
      }

      return data.url as string;
    } catch (err) {
      console.log("Upload error:", err);
      Alert.alert("Upload failed", "Network error while uploading image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // --- Pick image from gallery ---
  const chooseAvatar = async () => {
    if (!isEditing) {
      Alert.alert("Edit Mode", "Tap Edit icon to change your photo.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;

    const uploadedUrl = await uploadAvatarToBackend(localUri);
    if (uploadedUrl) {
      setUser((p) => ({ ...p, avatar: uploadedUrl }));
      Alert.alert("Uploaded ✅", "Photo updated. Now press Save.");
    }
  };

  // --- SAVE user to MongoDB ---
  const saveUser = async () => {
    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/api/user/${USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          bloodGroup: user.bloodGroup,
          medicalNotes: user.medicalNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Save failed");
        return;
      }

      setUser({
        userId: data.userId ?? USER_ID,
        name: data.name ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        avatar: data.avatar ?? "",
        bloodGroup: data.bloodGroup ?? "",
        medicalNotes: data.medicalNotes ?? "",
      });

      setIsEditing(false);
      Alert.alert("Saved ✅", "Profile updated in MongoDB");
    } catch (e) {
      Alert.alert("Error", "Could not save profile. Check backend.");
    } finally {
      setSaving(false);
    }
  };

  const avatarFallback =
    user.avatar && user.avatar.startsWith("http")
      ? user.avatar
      : "https://i.pravatar.cc/150?img=12";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FFFBF0", "#FDF2F7", "#F6E6EE"]} style={styles.bg}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#7A294E" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          {/* Right side: Edit toggle */}
          <TouchableOpacity onPress={() => setIsEditing((p) => !p)} style={styles.iconBtn}>
            <Ionicons
              name={isEditing ? "close-outline" : "create-outline"}
              size={22}
              color="#7A294E"
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            {/* Avatar + Name */}
            <View style={styles.avatarRow}>
              <View style={{ position: "relative" }}>
                <Image source={{ uri: avatarFallback }} style={styles.avatar} />

                <TouchableOpacity style={styles.editAvatarBtn} onPress={chooseAvatar}>
                  {uploading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Ionicons name="camera-outline" size={16} color="#7A294E" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.bigName}>
                  {loading ? "Loading..." : user.name || "Your Name"}
                </Text>
                <Text style={styles.smallText}>User ID: {USER_ID}</Text>
                <Text style={styles.smallText}>
                  Mode: {isEditing ? "Editing" : "View"}
                </Text>
              </View>
            </View>

            {/* Inputs */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={user.name}
              editable={isEditing}
              onChangeText={(t) => setUser((p) => ({ ...p, name: t }))}
              placeholder="Enter your name"
              placeholderTextColor="#A07A88"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={user.phone}
              editable={isEditing}
              onChangeText={(t) => setUser((p) => ({ ...p, phone: t }))}
              placeholder="Enter phone number"
              placeholderTextColor="#A07A88"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={user.email}
              editable={isEditing}
              onChangeText={(t) => setUser((p) => ({ ...p, email: t }))}
              placeholder="Enter email"
              placeholderTextColor="#A07A88"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Blood Group</Text>
            <TextInput
              style={styles.input}
              value={user.bloodGroup}
              editable={isEditing}
              onChangeText={(t) => setUser((p) => ({ ...p, bloodGroup: t }))}
              placeholder="Example: O+"
              placeholderTextColor="#A07A88"
            />

            <Text style={styles.label}>Medical Notes</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              value={user.medicalNotes}
              editable={isEditing}
              onChangeText={(t) => setUser((p) => ({ ...p, medicalNotes: t }))}
              placeholder="Allergies, conditions (optional)"
              placeholderTextColor="#A07A88"
              multiline
            />

            {/* Buttons */}
            {isEditing && (
              <TouchableOpacity style={styles.saveBtn} onPress={saveUser} disabled={saving}>
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#7A294E" />
                    <Text style={styles.saveText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={fetchUser}>
              <Ionicons name="refresh-outline" size={18} color="#7A294E" />
              <Text style={styles.saveText}>Reload from MongoDB</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBF0" },
  bg: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#7A294E" },

  card: {
    marginTop: 14,
    backgroundColor: "white",
    borderRadius: 28,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#FDF2F7" },

  editAvatarBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F3E5EC",
    alignItems: "center",
    justifyContent: "center",
  },

  bigName: { fontSize: 18, fontWeight: "900", color: "#7A294E" },
  smallText: { fontSize: 12, fontWeight: "700", color: "#A07A88", marginTop: 4 },

  label: { fontSize: 12, fontWeight: "900", color: "#7A294E", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#FFF7FB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3E5EC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#7A294E",
  },

  saveBtn: {
    marginTop: 18,
    backgroundColor: "#F6E6EE",
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#7A294E",
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F3E5EC",
  },
  saveText: { fontSize: 13, fontWeight: "900", color: "#7A294E" },
});
