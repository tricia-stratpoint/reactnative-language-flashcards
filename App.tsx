import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import AppNavigator from "./app/navigation/AppNavigator";
import { Colors } from "./app/constants/colors";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { initializeNotificationChannel } from "./app/utils/notifications";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const { fetchAchievements } = useFlashcardStore.getState();
    const authInstance = auth();

    const unsubscribe = authInstance.onAuthStateChanged(
      async (currentUser: FirebaseAuthTypes.User | null) => {
        console.log("Auth state changed:", currentUser?.email || "No user");

        if (currentUser) {
          await fetchAchievements();
        }

        SplashScreen.hideAsync();
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    initializeNotificationChannel();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer>
          <AppNavigator />
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
