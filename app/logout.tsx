import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.removeItem('kira.session');
      } catch {}
      router.replace('/login');
    })();
  }, [router]);

  // Render nothing while redirecting
  return <View />;
}
