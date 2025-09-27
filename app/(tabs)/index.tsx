import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import IndexScreen from "../../src/screens/IndexScreen";

export default function RootIndex() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('kira.session');
          const session = raw ? JSON.parse(raw) : null;
          if (!cancelled && (!session || !session.userId)) {
            router.replace('/login');
          }
        } catch {
          if (!cancelled) {
            router.replace('/login');
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [router])
  );

  return <IndexScreen />;
}
