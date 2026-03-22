import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import Feather from '@expo/vector-icons/Feather';
import { YStack } from 'tamagui';
import { useAppTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
          height: 60,
          paddingTop: 10,
        },
        tabBarButton: HapticTab,
        tabBarBackground: undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <YStack
              width={44} height={44} borderRadius={22}
              backgroundColor={focused ? colors.text : 'transparent'}
              justifyContent="center" alignItems="center"
            >
              <Feather name="home" size={20} color={focused ? colors.background : '#888888'} />
            </YStack>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => (
            <YStack
              width={44} height={44} borderRadius={22}
              backgroundColor={focused ? colors.text : 'transparent'}
              justifyContent="center" alignItems="center"
            >
              <Feather name="credit-card" size={20} color={focused ? colors.background : '#888888'} />
            </YStack>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => (
            <YStack
              width={44} height={44} borderRadius={22}
              backgroundColor={focused ? colors.text : 'transparent'}
              justifyContent="center" alignItems="center"
            >
              <Feather name="plus" size={20} color={focused ? colors.background : '#888888'} />
            </YStack>
          ),
        }}
      />
      <Tabs.Screen
        name="gps"
        options={{
          title: 'GPS',
          tabBarIcon: ({ focused }) => (
            <YStack
              width={44} height={44} borderRadius={22}
              backgroundColor={focused ? colors.text : 'transparent'}
              justifyContent="center" alignItems="center"
            >
              <Feather name="map-pin" size={20} color={focused ? colors.background : '#888888'} />
            </YStack>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <YStack
              width={44} height={44} borderRadius={22}
              backgroundColor={focused ? colors.text : 'transparent'}
              justifyContent="center" alignItems="center"
            >
              <Feather name="settings" size={20} color={focused ? colors.background : '#888888'} />
            </YStack>
          ),
        }}
      />
    </Tabs>
  );
}
