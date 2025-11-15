import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initDB } from "../services/db";

export default function RootLayout() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initDB();
        console.log("Database initialized successfully!");
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initializeDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}