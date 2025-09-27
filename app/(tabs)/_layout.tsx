import { Tabs } from 'expo-router';
import { Award, Compass, Home, Share2 } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = 12; // distancia para subir la barra
  const extensionHeight = bottomOffset + (insets?.bottom ?? 0); // relleno dinámico bajo la barra

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: bottomOffset,
          overflow: 'visible',
          paddingTop: 8,
          paddingBottom: 14,
          height: 64,
        },
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarActiveTintColor: '#FFFFFF',
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: '#2469A0',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {/* Extensión para rellenar el espacio inferior */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -extensionHeight,
                height: extensionHeight,
                backgroundColor: '#2469A0',
              }}
            />
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#FFFFFF' : 'transparent',
                borderRadius: 9999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              <Home size={26} color={focused ? '#2469A0' : '#FFFFFF'} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#FFFFFF' : 'transparent',
                borderRadius: 9999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              <Compass size={26} color={focused ? '#2469A0' : '#FFFFFF'} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Share',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#FFFFFF' : 'transparent',
                borderRadius: 9999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              <Share2 size={26} color={focused ? '#2469A0' : '#FFFFFF'} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="medal"
        options={{
          title: 'Medal',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#FFFFFF' : 'transparent',
                borderRadius: 9999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              <Award size={26} color={focused ? '#2469A0' : '#FFFFFF'} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
