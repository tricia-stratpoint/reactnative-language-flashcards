import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { FlashcardProvider } from "./hooks/flashcard-store";
import AppNavigator from "./app/navigation/AppNavigator";
import { NavigationContainer } from "@react-navigation/native";

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FlashcardProvider>
        <GestureHandlerRootView style={styles.container}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </GestureHandlerRootView>
      </FlashcardProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
