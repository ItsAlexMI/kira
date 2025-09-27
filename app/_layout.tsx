import { useColorScheme } from '@/hooks/use-color-scheme';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { ProtestStrike_400Regular } from '@expo-google-fonts/protest-strike';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
  // Load Poppins fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    ProtestStrike_400Regular,
  });

  // Patch global Text default font family for non-bold weights
  if (fontsLoaded) {
    const T: any = Text as any;
    if (!T.defaultProps) T.defaultProps = {};
    const style = T.defaultProps.style;
    if (!style) {
      T.defaultProps.style = { fontFamily: 'Poppins_400Regular' };
    } else if (Array.isArray(style)) {
      style.push({ fontFamily: 'Poppins_400Regular' });
    } else if (typeof style === 'object') {
      T.defaultProps.style = { fontFamily: 'Poppins_400Regular', ...style };
    }
  }
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        const session = raw ? JSON.parse(raw) : null;
        const isLoggedIn = !!(session && session.userId);
        const isOnAuth = pathname === '/login' || pathname === '/register';
        if (!cancelled) {
          if (!isLoggedIn && !isOnAuth) {
            router.replace('/login');
          } else if (isLoggedIn && isOnAuth) {
            router.replace('/(tabs)');
          }
        }
      } catch {
        if (!cancelled && pathname !== '/login') {
          router.replace('/login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D263A' }}>
        <ActivityIndicator color="#10BCE2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="NicaCuestionarios" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
