import { Tabs } from "expo-router";
import { BookOpen, BarChart3, Trophy, Settings } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 4,
          borderTopColor: "#f3f4f6",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: "Decks",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}