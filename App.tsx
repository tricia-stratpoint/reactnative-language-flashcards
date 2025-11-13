import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import AppNavigator from "./app/navigation/AppNavigator";
import { Colors } from "./app/constants/colors";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { getSecureItem } from "@/app/utils/secureStore";
import {
  registerDeviceForFCM,
  getFcmToken,
  setupForegroundListener,
  initializeNotificationChannel,
} from "./app/utils/notifications";
import messaging from "@react-native-firebase/messaging";
import notifee from "@notifee/react-native";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || "New Message",
    body: remoteMessage.notification?.body || "You have a new notification.",
    android: { channelId: "default" },
  });
});

export default function App() {
  const [initialRoute, setInitialRoute] = useState<"Login" | "MainTabs">(
    "Login"
  );

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await getSecureItem("userToken");

        const currentUser = auth().currentUser;

        if (token && currentUser) {
          setInitialRoute("MainTabs");
        } else {
          setInitialRoute("Login");
        }

        if (currentUser) {
          const { fetchUserRole } = useFlashcardStore.getState();
          await fetchUserRole();
        }
      } catch (err) {
        console.log("Auto-login check error:", err);
        setInitialRoute("Login");
      } finally {
        SplashScreen.hideAsync();
      }
    };

    checkLogin();
  }, []);

  useEffect(() => {
    const { fetchAchievements } = useFlashcardStore.getState();

    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      if (currentUser) await fetchAchievements();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initializeNotificationChannel(); // notifee channel
        await registerDeviceForFCM(); // register device
        await getFcmToken(); // get token
        setupForegroundListener(); // foreground listener
      } catch (err) {
        console.log("Notification init error:", err);
      }
    };
    initNotifications();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.tealDark} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer>
          <AppNavigator initialRouteName={initialRoute} />
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
});
