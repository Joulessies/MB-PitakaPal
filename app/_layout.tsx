import "@tamagui/native/setup-zeego";
import "react-native-reanimated";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
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
import { TamaguiProvider } from "tamagui";

import { AccountProvider } from "../context/AccountContext";
import { AppThemeProvider, useAppTheme } from "../context/ThemeContext";
import { TransactionProvider } from "../context/TransactionContext";
import { tamaguiConfig } from "../tamagui.config";
import { tokenCache } from "../utils/tokenCache";

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MainContent() {
  const { theme } = useAppTheme();
  const { isLoaded } = useAuth();

  useEffect(() => {
    console.log('[MainContent] isLoaded:', isLoaded);
    if (!isLoaded) return;
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
                options={{ headerShown: false, animation: "fade" }}
                name="onboarding"
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
    ...Feather.font,
  });

  useEffect(() => {
    console.log('[RootLayout] fonts loaded:', loaded);
    console.log('[RootLayout] Clerk key available:', !!CLERK_PUBLISHABLE_KEY);
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    console.log('[RootLayout] Waiting for fonts...');
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
