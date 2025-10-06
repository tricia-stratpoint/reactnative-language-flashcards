import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpen, BarChart3, Trophy, Settings } from "lucide-react-native";
import IndexScreen from "../screens/index";
import DecksScreen from "../screens/decks";
import AchievementsScreen from "../screens/achievements";
import SettingsScreen from "../screens/settings";
import NotFoundScreen from "../+not-found";
import { Colors } from "../constants/colors";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.blue,
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
      <Tab.Screen
        name="Index"
        component={IndexScreen}
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Decks"
        component={DecksScreen}
        options={{
          title: "Decks",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
