import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RANK_URL = 'https://kira-pink-theta.vercel.app/users/puntajeTodos';

export default function MedalScreen() {
  const [ranking, setRanking] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);

  const podiumAnim = useRef(new Animated.Value(0)).current;
  const listAnimRefs = useRef({});

  const getRowAnim = (pos) => {
    if (!listAnimRefs.current[pos]) listAnimRefs.current[pos] = new Animated.Value(0);
    return listAnimRefs.current[pos];
  };

  const runAnimations = (data) => {
    podiumAnim.setValue(0);
    Animated.timing(podiumAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const anims = data.slice(0, 30).map((r, idx) => {
      const v = getRowAnim(r.posicion);
      v.setValue(0);
      return Animated.timing(v, { toValue: 1, duration: 380, delay: 100 + idx * 45, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    });
    Animated.stagger(45, anims).start();
  };

  const fetchRanking = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(RANK_URL, { headers: { 'Accept': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Error al cargar ranking');
      const arr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
      const cleaned = arr.map(r => ({
        id: String(r.id),
        nombre: r.nombre || 'Usuario',
        puntaje: Number(r.puntaje) || 0,
        posicion: Number(r.posicion) || 0,
      }))
      .filter(r => r.posicion > 0)
      .sort((a,b) => a.posicion - b.posicion);
      setRanking(cleaned);
      if (!opts.silent) runAnimations(cleaned);
    } catch (e) {
      setError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        if (raw) {
          const parsed = JSON.parse(raw);
          const id = parsed?.idUsuario ?? parsed?.userId ?? parsed?.id ?? null;
          const correo = parsed?.correo;
          setCurrentUserId(id != null ? String(id) : null);
          if (correo) setCurrentUserName(correo.split('@')[0]);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanking({ silent: true });
  };

  const first = ranking.find(r => r.posicion === 1);
  const second = ranking.find(r => r.posicion === 2);
  const third = ranking.find(r => r.posicion === 3);
  const podiumArray = [second, first, third].filter(Boolean);

  const avatarPlaceholder = require('../../assets/images/fotoperfil.png');

  const computePodiumVisuals = (entry) => {
    if (!entry) return null;
    const place = entry.posicion;
    const visuals = {
      1: { colWidth: 116, colHeight: 140, avatarSize: 80 },
      2: { colWidth: 100, colHeight: 100, avatarSize: 72 },
      3: { colWidth: 100, colHeight: 80, avatarSize: 68 },
    }[place] || { colWidth: 100, colHeight: 80, avatarSize: 68 };
    return { place, name: entry.nombre, points: entry.puntaje, avatar: avatarPlaceholder, id: entry.id, ...visuals };
  };

  const podiumVisuals = podiumArray.map(computePodiumVisuals);

  const renderPodium = () => {
    const scale = podiumAnim.interpolate({ inputRange: [0,1], outputRange: [0.85,1] });
    const opacity = podiumAnim;
    return (
      <Animated.View style={{ transform: [{ scale }], opacity }} className="px-4 mt-0">
        {podiumVisuals.length === 0 && !loading && !error ? (
          <Text className="text-white/90 text-center mt-4">No hay datos de ranking.</Text>
        ) : null}
        <View className="flex-row items-end justify-between">
          {podiumVisuals.map(p => {
            const ringMargin = 4;
            const wrapperSize = p.avatarSize + ringMargin * 2;
            const lift = p.place === 1 ? 8 : p.place === 2 ? 4 : 2;
            const colW = Math.max(p.colWidth, wrapperSize);
            const ringColors = p.place === 1 ? ["#FEE869", "#986F3F"] : p.place === 2 ? ["#75FE69", "#3F983F"] : ["#3ABD9C", "#278E73"];
            const isCurrent = currentUserId && p.id === String(currentUserId);
            const highlightRing = isCurrent ? ["#FFFFFF", "#FFFFFF"] : ringColors;
            const nameColor = isCurrent ? '#FFFFFF' : '#FFFFFF';
            const extraShadow = isCurrent ? { shadowColor:'#FFF', shadowOpacity:0.6, shadowRadius:12, shadowOffset:{width:0,height:0}, elevation:6 } : null;
            return (
              <View key={p.place} className="items-center" style={{ width: colW }}>
                <View style={{ height: lift }} />
                <View className="items-center">
                  <View style={[{ width: wrapperSize, height: wrapperSize }, extraShadow]} className="rounded-full overflow-hidden">
                    <LinearGradient colors={highlightRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
                      <View className="flex-1 m-2 rounded-full overflow-hidden">
                        <LinearGradient
                          colors={["#2667A2", "#10BCE2", "#3ABD9C", "#3ED6AF"]}
                          locations={[0, 0.32, 0.7, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ flex: 1, borderRadius: 9999, padding: StyleSheet.hairlineWidth }}
                        >
                          <Image source={p.avatar} className="w-full h-full rounded-full" resizeMode="cover" />
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
                <Text className="font-semibold text-base" numberOfLines={1} style={{ color: nameColor }}>{p.name}</Text>
                <Text className="text-white/90 font-semibold text-base">{p.points} pts</Text>
                {(() => {
                  const pedestalHeight = p.colHeight;
                  const pedestalWidth = Math.max(64, wrapperSize);
                  let pedestalColors = [];
                  let pedestalLocations = [];
                  if (p.place === 1) { pedestalColors = ["#FEBA69", "#FEBA69", "#C18F52"]; pedestalLocations = [0,0.73,1]; }
                  else if (p.place === 2) { pedestalColors = ["#55D741", "#55D741", "#3B962D"]; pedestalLocations = [0,0.41,1]; }
                  else { pedestalColors = ["#3ED6AF", "#3ED6AF", "#20705C"]; pedestalLocations = [0,0.26,1]; }
                  return (
                    <LinearGradient colors={pedestalColors} locations={pedestalLocations} start={{ x:0,y:0 }} end={{ x:0,y:1 }} style={{ width: pedestalWidth, height: pedestalHeight, borderRadius: 10, marginTop: 6, alignItems:'center', justifyContent:'center', ...(isCurrent ? { borderWidth:2, borderColor:'#FFF' } : {}) }}>
                      <Text className="text-white text-2xl font-extrabold">{p.place}</Text>
                    </LinearGradient>
                  );
                })()}
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const tableData = ranking;

  const renderRow = ({ item }) => {
    const size = 36;
    const isCurrent = currentUserId && item.id === String(currentUserId);
    const anim = getRowAnim(item.posicion);
    const translateY = anim.interpolate({ inputRange:[0,1], outputRange:[20,0] });
    const opacity = anim;
    const scale = anim.interpolate({ inputRange:[0,1], outputRange:[0.95,1] });
    return (
      <Animated.View style={{ opacity, transform:[{ translateY }, { scale }] }} className={`flex-row items-center py-3 border-b border-gray-100 ${isCurrent ? 'bg-[#2469A00F]' : ''}` }>
        <Text className="text-[#2469A0] text-lg font-extrabold text-center" style={{ width: 56 }}>{item.posicion}</Text>
        <View className="flex-row items-center justify-center" style={{ flex: 1, paddingRight: 8 }}>
          <Image source={avatarPlaceholder} style={{ width: size, height: size, borderRadius: size / 2, marginRight: 12, borderWidth: isCurrent ? 2 : 0, borderColor: isCurrent ? '#2469A0' : 'transparent' }} resizeMode="cover" />
          <Text className="text-base font-semibold text-center" numberOfLines={1} style={{ color: isCurrent ? '#2469A0' : '#2D2D2D' }}>{item.nombre}</Text>
        </View>
        <Text className="text-base font-extrabold text-center" style={{ minWidth: 90, color: isCurrent ? '#2469A0' : '#2469A0' }}>{item.puntaje} pts</Text>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={["#10BCE2", "#2469A0"]} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={{ flex:1 }}>
      <SafeAreaView edges={['top']} style={{ flex:1 }}>
        <View className="px-4 pt-2">
          <Image source={require('../../assets/images/logokira2.png')} className="w-[100px] h-[100px]" resizeMode="contain" />
        </View>
        <View className="px-4 mt-2 items-center">
          <Text className="text-white text-5xl font-extrabold" style={{ fontFamily: 'ProtestStrike_400Regular' }}>Top</Text>
          <Text className="text-white text-3xl font-semibold"style={{ fontFamily: 'ProtestStrike_400Regular' }}>Nacional</Text>
        </View>

        {loading && !refreshing ? (
          <View className="mt-6 items-center"><ActivityIndicator color="#FFFFFF" /><Text className="text-white/90 mt-2">Cargando ranking...</Text></View>
        ) : error ? (
          <View className="mt-6 items-center px-4">
            <Text className="text-white/90 text-center mb-3">{error}</Text>
            <Pressable onPress={() => fetchRanking()} className="px-5 py-2 rounded-full" style={{ backgroundColor:'#ffffff22' }}>
              <Text className="text-white font-semibold">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          renderPodium()
        )}

        <View className="bg-white w-full rounded-t-3xl -mt-6 px-6 pt-4 pb-2 shadow-lg flex-1">
          <View className="flex-row items-center pb-2 border-b border-gray-200">
            <Text className="text-gray-500 font-semibold text-center" style={{ width: 57 }}>Posición</Text>
            <Text className="text-gray-500 font-semibold text-center" style={{ flex: 1 }}>Usuario</Text>
            <Text className="text-gray-500 font-semibold text-center" style={{ minWidth: 90 }}>Puntos</Text>
          </View>
          <FlatList
            data={tableData}
            keyExtractor={(it) => String(it.posicion)}
            renderItem={renderRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2469A0" />}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={!loading && !error ? (<View className="py-10 items-center"><Text className="text-gray-400">Sin datos disponibles.</Text></View>) : null}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
