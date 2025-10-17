import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveUserId, submitPersonajeScore } from '../utils/api';

export default function AdivinaQuienSoyJuegoScreen() {
  const [personajes, setPersonajes] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [adivinado, setAdivinado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [userId, setUserId] = useState(null);
  const [intento, setIntento] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const raw = await AsyncStorage.getItem('kira.session');
        const session = raw ? JSON.parse(raw) : null;
        const uid = resolveUserId(session);
        if (mounted) setUserId(uid);
        const idxRaw = await AsyncStorage.getItem('kira.adivina.idx');
        const idx = idxRaw ? parseInt(idxRaw, 10) : 0;
        if (mounted) setCurrentIdx(idx);
        try {
          const res = await fetch('https://kira-pink-theta.vercel.app/actividades/personajes');
          const data = await res.json();
          if (mounted) setPersonajes(Array.isArray(data) ? data : []);
          const adivKey = `kira.adivinados.${uid}`;
          const adivRaw = await AsyncStorage.getItem(adivKey);
          const adivObj = adivRaw ? JSON.parse(adivRaw) : {};
          if (data[idx] && adivObj[data[idx].id]) {
            if (mounted) setAdivinado(true);
            if (mounted) setIntento(true);
          } else {
            if (mounted) setAdivinado(false);
            if (mounted) setIntento(false);
          }
        } catch {}
      })();
      return () => { mounted = false; };
    }, [])
  );

  const personaje = personajes[currentIdx] || {};

  const handleAdivinar = async () => {
    if (!input.trim() || intento) return;
    setLoading(true);
    setIntento(true);
    const normaliza = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
    const adivKey = `kira.adivinados.${userId}`;
    const fallKey = `kira.fallidos.${userId}`;
    if (normaliza(input) === normaliza(personaje.nombre)) {
      setAdivinado(true);
      setFeedback({ type: 'success', message: '¡Correcto!' });
      try {
        const result = await submitPersonajeScore(personaje.id, userId);
        const adivRaw = await AsyncStorage.getItem(adivKey);
        const adivObj = adivRaw ? JSON.parse(adivRaw) : {};
        adivObj[personaje.id] = true;
        await AsyncStorage.setItem(adivKey, JSON.stringify(adivObj));
      } catch {}
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: 'Incorrecto' });
      try {
        const fallidoRaw = await AsyncStorage.getItem(fallKey);
        const fallidoObj = fallidoRaw ? JSON.parse(fallidoRaw) : {};
        fallidoObj[personaje.id] = true;
        await AsyncStorage.setItem(fallKey, JSON.stringify(fallidoObj));
      } catch {}
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#2469A0", "#0D263A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <ChevronLeft size={25} color="#2469A0" strokeWidth={2.5} />
          </TouchableOpacity>
          <Image
            source={require('../../assets/images/logokira.png')}
            className="w-[90px] h-[90px]"
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try { require('react-native').Keyboard.dismiss(); } catch {}
              }
            }}
          >
          <View className="flex-1 items-center px-4 pt-2">
            <View className="bg-white rounded-2xl p-5 shadow items-center mb-4" style={{ elevation: 3, width: '100%' }}>
              <Text className="text-[#2469A0] font-extrabold text-lg">Adivina quién soy</Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 100, padding: 10, marginBottom: 18, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={adivinado ? { uri: personaje.imagen } : require('../../assets/images/pregunta.png')}
                style={{ width: 140, height: 140, borderRadius: 70 }}
                resizeMode="cover"
              />
            </View>
            <View className="bg-white rounded-2xl p-5 shadow items-center mb-4" style={{ elevation: 2, width: '100%' }}>
              <Text className="text-[#2469A0] font-extrabold text-md mb-2">
                {adivinado ? personaje.nombre : '¿Quién es este personaje?'}
              </Text>
              <Text className="text-gray-700 text-center text-sm" style={{ marginTop: 2, marginBottom: 0, lineHeight: 18 }}>
                {personaje.descripcion}
              </Text>
            </View>
            {!adivinado && !intento && (
              <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow" style={{ elevation: 2, width: '100%' }}>
                <Search size={22} color="#2469A0" style={{ marginRight: 8 }} />
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Escribe el nombre del personaje..."
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={{ flex: 1, fontSize: 16, color: '#2469A0', paddingVertical: 4 }}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleAdivinar}
                />
                <TouchableOpacity
                  onPress={handleAdivinar}
                  disabled={loading || !input.trim()}
                  style={{ backgroundColor: '#2469A0', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8, opacity: loading || !input.trim() ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Adivinar</Text>
                </TouchableOpacity>
              </View>
            )}
            {feedback && (
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <View
                  className="px-10 py-6 rounded-3xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.97)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
                >
                  <Text
                    className="text-3xl font-extrabold text-center"
                    style={{ color: feedback.type === 'success' ? '#3ABD9C' : '#DC2626' }}
                  >
                    {feedback.message}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
