import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveUserId } from '../utils/api';

export default function AdivinaQuienSoyScreen() {
  const [cards, setCards] = useState([
    { colors: ["#2469A0", "#0D263A"], percent: "42%" },
    { colors: ["#10BCE2", "#09677C"], percent: "25%" },
    { colors: ["#3ABD9C", "#1B5748"], percent: "33%" },
    { colors: ["#FEBA69", "#986F3F"], percent: "37%" },
  ]);
  const [personajes, setPersonajes] = useState([]);
  const [adivinados, setAdivinados] = useState({});
  const [fallidos, setFallidos] = useState({});
  const [userId, setUserId] = useState(null);
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const load = async () => {
        try {
          const raw = await AsyncStorage.getItem('kira.session');
          const session = raw ? JSON.parse(raw) : null;
          const uid = resolveUserId(session);
          if (mounted) setUserId(uid);
          const adivKey = `kira.adivinados.${uid}`;
          const fallKey = `kira.fallidos.${uid}`;
          const res = await fetch('https://kira-pink-theta.vercel.app/actividades/personajes');
          const data = await res.json();
          if (mounted) setPersonajes(Array.isArray(data) ? data : []);
          try {
            const adivRaw = await AsyncStorage.getItem(adivKey);
            if (mounted && adivRaw) setAdivinados(JSON.parse(adivRaw));
            else if (mounted) setAdivinados({});
          } catch { if (mounted) setAdivinados({}); }
          try {
            const fallRaw = await AsyncStorage.getItem(fallKey);
            if (mounted && fallRaw) setFallidos(JSON.parse(fallRaw));
            else if (mounted) setFallidos({});
          } catch { if (mounted) setFallidos({}); }
        } catch {}
      };
      load();
      return () => { mounted = false; };
    }, [])
  );
  const [username, setUsername] = useState('usuario');
  const [points, setPoints] = useState(0);
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('kira.session');
          const session = raw ? JSON.parse(raw) : null;
          const userId = resolveUserId(session);
          if (userId) {
            try {
              const res = await fetch(`https://kira-pink-theta.vercel.app/users/nombreUsuario/${userId}`);
              const json = await res.json();
              if (mounted && res.ok && json?.nombre) setUsername(json.nombre);
              else if (mounted) setUsername('usuario');
            } catch { if (mounted) setUsername('usuario'); }
            try {
              const resScore = await fetch(`https://kira-pink-theta.vercel.app/users/puntajeUsuario/${userId}`);
              const jsonScore = await resScore.json();
              if (mounted && resScore.ok && jsonScore?.puntaje != null) {
                const scoreNum = Number(jsonScore.puntaje);
                setPoints(Number.isFinite(scoreNum) ? scoreNum : 0);
              } else if (mounted) setPoints(0);
            } catch { if (mounted) setPoints(0); }
          } else {
            if (mounted) setUsername('usuario');
            if (mounted) setPoints(0);
          }
        } catch {
          if (mounted) setUsername('usuario');
          if (mounted) setPoints(0);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );
  return (
    <View className="flex-1 bg-[#F1F1F1]">
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
            source={require('../../assets/images/logokiracolor.png')}
            className="w-[90px] h-[90px]"
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
      <ScrollView className="mt-3" contentContainerStyle={{ paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
        <View className="px-4">
          <View className="bg-white rounded-2xl p-3 shadow" style={{ elevation: 2 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center shrink">
                <Image
                  source={require('../../assets/images/fotoperfil.png')}
                  className="w-16 h-16 rounded-full mr-3"
                  resizeMode="cover"
                />
                <View className="shrink">
                  <Text className="text-[#8B8B8B] text-sm font-semibold" numberOfLines={1}>
                    {username}, vamos a por más...
                  </Text>
                  <Text className="text-[#8B8B8B] text-sm" numberOfLines={1}>
                    <Text className="font-semibold" style={{ color: '#FEBA69' }}>Puntaje: </Text>
                    {points}
                  </Text>
                </View>
              </View>
              <Image
                source={require('../../assets/images/scout.png')}
                className="w-12 h-12 ml-3"
                resizeMode="contain"
              />
            </View>
          </View>
          <View className="mt-5 flex-row flex-wrap justify-between gap-4 px-2">
            {cards.map((card, idx) => {
              const personaje = personajes[idx];
              const adivinado = personaje && adivinados[personaje?.id];
              const fallido = personaje && fallidos[personaje?.id];
              const intentado = adivinado || fallido;
              return (
                <View
                  key={idx}
                  className="rounded-xl mb-6"
                  style={{
                    width: '48%',
                    backgroundColor: card.colors[0],
                    elevation: 4,
                    shadowColor: card.colors[0],
                    shadowOpacity: 0.18,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    alignItems: 'center',
                    minHeight: 260,
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 16,
                    justifyContent: 'flex-end',
                  }}
                >
                  <View style={{ width: '100%', alignItems: 'center', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                    <Image
                      source={adivinado && personaje?.imagen ? { uri: personaje.imagen } : require('../../assets/images/personajemisterioso.png')}
                      style={{ width: 110, height: 110, borderRadius: 18, marginTop: 8, maxWidth: '90%' }}
                      resizeMode="contain"
                    />
                  </View>
                  <View
                    className="rounded-xl"
                    style={{
                      backgroundColor: '#fff',
                      width: '100%',
                      minHeight: 170,
                      marginTop: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                      borderRadius: 16,
                      overflow: 'visible',
                      zIndex: 2,
                    }}
                  >
                    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', height: 110 }}>
                      <Text
                        style={{ color: '#2469A0', fontWeight: 'bold', fontSize: 14, textAlign: 'center', marginTop: 0, marginBottom: 0, lineHeight: 22 }}
                      >
                        {adivinado && personaje ? personaje.nombre : fallido ? 'Fallaste el intento' : personaje ? 'adivina el personaje' : 'Más personajes pronto'}
                      </Text>
                      {adivinado && personaje && (
                        <Text
                          style={{ color: '#797979', fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 0, lineHeight: 18 }}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {personaje.descripcion}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 18,
                        color: '#A49E9E',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}
                    >
                      {personaje ? `+${personaje.puntaje || 100} pts` : ''}
                    </Text>
                    {idx < 4 && !intentado && personaje && (
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          bottom: 14,
                          right: 14,
                          backgroundColor: card.colors[0],
                          borderRadius: 999,
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          elevation: 2,
                        }}
                        activeOpacity={0.85}
                        onPress={async () => {
                          await AsyncStorage.setItem('kira.adivina.idx', String(idx));
                          router.push('/adivina-quien-soy-juego');
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>VAMOS</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-[#D9D9D9]">
        <Text className="text-center text-[#797979] font-semibold py-2">Más personajes pronto...</Text>
      </SafeAreaView>
    </View>
  );
}
