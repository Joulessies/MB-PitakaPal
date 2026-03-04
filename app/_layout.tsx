import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui/native";

// Suppress Zeego warning when not using native menus (requires dev client + zeego)
LogBox.ignoreLogs(["Must call import '@tamagui/native/setup-zeego'"]);

import { AccountProvider } from "../context/AccountContext";
import { AppThemeProvider, useAppTheme } from "../context/ThemeContext";
import { TransactionProvider } from "../context/TransactionContext";
import { tamaguiConfig } from "../tamagui.config";
import { tokenCache } from "../utils/tokenCache";

// Keep the native splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MainContent() {
  const { theme } = useAppTheme();
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    // Auth protection logic can be added here when needed
  }, [isLoaded]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <AccountProvider>
          <TransactionProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="index"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen
                name="login"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen
                name="register"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen
                name="setup"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </TransactionProvider>
        </AccountProvider>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AppThemeProvider>
        <MainContent />
      </AppThemeProvider>
    </ClerkProvider>
  );
}
