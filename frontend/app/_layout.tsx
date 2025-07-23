import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import "react-native-reanimated";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/context/AuthContext";
import { PreferencesProvider, usePreferences } from "@/context/PreferencesContext";
import { UserProvider } from "@/context/UserContext";

function RootLayoutContent() {
  const { getTheme } = usePreferences();
  const effectiveTheme = getTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={effectiveTheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="assign" options={{ headerShown: false }} />
          <Stack.Screen name="goals" options={{ headerShown: false }} />
          <Stack.Screen name="start" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <PreferencesProvider>
          <RootLayoutContent />
        </PreferencesProvider>
      </UserProvider>
    </AuthProvider>
  );
}
