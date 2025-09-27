import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from "react";
import { Alert, Image, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const correo = username?.trim();
    const contrasena = password;
    if (!correo || !contrasena) {
      Alert.alert('Campos requeridos', 'Ingresa tu usuario y contraseña.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('https://kira-pink-theta.vercel.app/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Error al iniciar sesión');
      }
      if (json?.success && json?.userId) {
        await AsyncStorage.setItem('kira.session', JSON.stringify({ userId: String(json.userId), correo }));
        router.replace('/(tabs)');
      } else {
        Alert.alert('Credenciales inválidas', 'Revisa tu usuario y contraseña.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider className="flex-1">
      <LinearGradient
        colors={["#10BCE2", "#2469A0"]}
        locations={[0, 0.65]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1">

          <View className="items-center mb-4 mt-20">
            <View>
              <Image
                source={require('../../assets/images/logokira.png')}
                style={{ width: 160, height: 160 }}
                resizeMode="contain"
                accessibilityLabel="Logo Kira"
              />
            </View>
            <Text className="text-white text-4xl" style={{ fontFamily: 'ProtestStrike_400Regular' }}>Bienvenido a Kira</Text>
            <Text className="text-white text-lg opacity-90 mt-1">Innovación con identidad Nica!</Text>
          </View>

          <View className="bg-white w-full rounded-t-3xl px-6 pt-5 pb-6 shadow-lg flex-1 justify-between mt-4">
            <Text className="text-[#2469A0] text-2xl font-extrabold text-center mb-2">Inicio de Sesión</Text>

            <Text className="text-[#2B4C7E] font-semibold mb-0">Nombre de Usuario</Text>
            <View className="flex-row items-center border border-green-500 rounded-full px-4 py-3 mb-1 -mt-8 bg-white">
              <Ionicons name="person-outline" size={20} color="#2B4C7E" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="ingresa su nombre de usuario"
                placeholderTextColor="#9CA3AF"
                className="ml-2 flex-1 text-gray-800"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text className="text-[#2B4C7E] font-semibold mb-0">Contraseña</Text>
            <View className="flex-row items-center border border-blue-400 rounded-full px-4 py-3 mb-1 -mt-8 bg-white">
              <Ionicons name="lock-closed-outline" size={20} color="#2B4C7E" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa su contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                className="ml-2 flex-1 text-gray-800"
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="pl-2"
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#2B4C7E"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity className="self-end mb-2 -mt-7">
              <Text className="text-[#2469A0] font-semibold">¿Se te olvidó la contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-full py-4 items-center ${loading ? 'bg-[#5B8DBA]' : 'bg-[#2469A0]'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-white text-center text-lg font-bold">{loading ? 'Entrando…' : 'Entrar'}</Text>
            </TouchableOpacity>
            <View className="mt-8">
              <View className="border-t border-gray-200 mb-4" />
              <Text className="text-gray-500 text-center mb-1">¿Eres nuevo?, puedes registrarte en Kira</Text>
              <Text className="text-gray-500 text-center">
                Eres bienvenido{' '}
                <Text
                  className="text-[#2469A0] font-semibold"
                  onPress={() => router.push('/register')}
                >
                  → Registrarse
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </SafeAreaProvider>
  );
}
  