// app/(dock)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DockLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#7A294E",
        tabBarInactiveTintColor: "#A07A88",
        tabBarStyle: {
          backgroundColor: "#FFFBF0",
          borderTopColor: "#F3E5EC",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size ?? 22} />
          ),
        }}
      />

      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size ?? 22} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size ?? 22} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size ?? 22} />
          ),
        }}
      />

      {/* ✅ Movement = person running/walking icon */}
      <Tabs.Screen
        name="movement-analysis"
        options={{
          title: "Move", // ✅ short title so it won't cut like "movemen..."
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="walk-outline" color={color} size={size ?? 22} />
          ),
        }}
      />
    </Tabs>
  );
}