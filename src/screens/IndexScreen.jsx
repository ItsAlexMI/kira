import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const eventos = {
  "2025-01": {
    "01": ["Año Nuevo"]
  },
  "2025-02": {
    "14": ["Día del Amor y la Amistad"],
  },
  "2025-03": {
    "08": ["Día Internacional de la Mujer"],
    "19": ["Día de San José (festividad católica)"]
  },
  "2025-04": {
    "17": ["Jueves Santo"],
    "18": ["Viernes Santo"],
    "22": ["Día de la Tierra (actividades ambientales)"],
    "30": ["Conmemoración del Repliegue de Masaya (FSLN)"]
  },
  "2025-05": {
    "01": ["Día Internacional de los Trabajadores"],
    "04": ["Día de las Banderas Nacionales (incluye la rojinegra del FSLN)"],
    "30": ["Día de las Madres"]
  },
  "2025-06": {
    "05": ["Día Mundial del Medio Ambiente"],
    "23": ["Natalicio de Carlos Fonseca Amador (FSLN)"],
    "29": ["San Pedro y San Pablo (festividad religiosa)"]
  },
  "2025-07": {
    "01": ["Día del Combatiente Sandinista (FSLN)"],
    "12": ["Natalicio del Comandante Julio Buitrago (FSLN)"],
    "13": ["Día de la Rebeldía Indígena, Negra y Popular"],
    "19": ["Aniversario del Triunfo de la Revolución Popular Sandinista (FSLN)"]
  },
  "2025-08": {
    "01": ["Fiestas Patronales de Santo Domingo de Guzmán (Managua)"],
    "10": ["Fiesta de San Lorenzo (Masaya y otros municipios)"],
    "12": ["Natalicio de Julio Buitrago (conmemoración FSLN)"],
    "13": ["Día Nacional de la Alfabetización (FSLN)"],
    "27": ["Día Nacional de la Persona con Discapacidad"]
  },
  "2025-09": {
    "14": ["Batalla de San Jacinto"],
    "15": ["Día de la Independencia de Centroamérica"]
  },
  "2025-10": {
    "12": ["Día de la Resistencia Indígena, Negra y Popular"],
    "30": ["Conmemoración de Ricardo Morales Avilés (FSLN)"],
    "31": ["Día de los Estudiantes Caídos (FSLN)"]
  },
  "2025-11": {
    "01": ["Día de Todos los Santos"],
    "02": ["Día de los Difuntos"],
    "04": ["Triunfo electoral del FSLN (conmemoración política)"]
  },
  "2025-12": {
    "07": ["La Gritería (Inmaculada Concepción de María)"],
    "08": ["Inmaculada Concepción de María (feriado nacional)"],
    "24": ["Nochebuena"],
    "25": ["Navidad"],
    "31": ["Fin de Año"]
  }
};

function Calendario() {
  const meses = Object.keys(eventos).sort();
  const now = new Date();
  const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const defaultIndex = meses.includes(currentYYYYMM)
    ? meses.indexOf(currentYYYYMM)
    : (meses.indexOf('2025-04') !== -1 ? meses.indexOf('2025-04') : 0);
  const initialMonthKey = meses[defaultIndex];
  const initialDay = Object.keys(eventos[initialMonthKey] || {})[0] || null;

  const [mesIndex, setMesIndex] = useState(defaultIndex);
  const [diaSeleccionado, setDiaSeleccionado] = useState(initialDay);

  const mesActual = meses[mesIndex];
  const diasConEventos = Object.keys(eventos[mesActual] || {});

  const formatMes = (yyyyMM) => {
    const [, m] = yyyyMM.split('-');
    const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
    return `${nombres[idx]}`;
  };

  const goPrev = () => {
    if (mesIndex > 0) {
      const newIndex = mesIndex - 1;
      setMesIndex(newIndex);
      const firstDay = Object.keys(eventos[meses[newIndex]] || {})[0] || null;
      setDiaSeleccionado(firstDay);
    }
  };

  const goNext = () => {
    if (mesIndex < meses.length - 1) {
      const newIndex = mesIndex + 1;
      setMesIndex(newIndex);
      const firstDay = Object.keys(eventos[meses[newIndex]] || {})[0] || null;
      setDiaSeleccionado(firstDay);
    }
  };

  return (
    <View className="mt-5" style={stylesCal.container}>
      <Text style={stylesCal.titulo}>Calendario Cultural</Text>

      <View style={stylesCal.mesContainer}>
        <TouchableOpacity onPress={goPrev} disabled={mesIndex === 0}>
          <Text style={[stylesCal.arrow, mesIndex === 0 && stylesCal.arrowDisabled]}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={stylesCal.mesTexto}>{formatMes(mesActual)}</Text>
        <TouchableOpacity onPress={goNext} disabled={mesIndex === meses.length - 1}>
          <Text style={[stylesCal.arrow, mesIndex === meses.length - 1 && stylesCal.arrowDisabled]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={diasConEventos}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[stylesCal.dia, diaSeleccionado === item && stylesCal.diaSeleccionado]}
            onPress={() => setDiaSeleccionado(item)}
          >
            <Text
              style={[stylesCal.diaTexto, diaSeleccionado === item && stylesCal.diaTextoSeleccionado]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View>
        {(eventos[mesActual][diaSeleccionado] || []).map((item, index) => (
          <View key={`evento-${mesActual}-${diaSeleccionado}-${index}`} style={stylesCal.eventoCard}>
            <Text style={stylesCal.eventoTexto}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const stylesCal = StyleSheet.create({
  container: {
    margin: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#004AAD',
  },
  mesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  mesTexto: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 20,
    paddingHorizontal: 10,
  },
  arrowDisabled: {
    color: '#BDBDBD',
  },
  dia: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    margin: 5,
    padding: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  diaSeleccionado: {
    backgroundColor: '#00AEEF',
  },
  diaTexto: {
    fontSize: 16,
    color: '#333',
  },
  diaTextoSeleccionado: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventoCard: {
    backgroundColor: '#1EBAA5',
    marginVertical: 5,
    padding: 12,
    borderRadius: 8,
  },
  eventoTexto: {
    color: '#fff',
    fontSize: 16,
  },
});

export default function IndexScren() {
  const discoverImages = [
    require('../../assets/images/lugares.png'),
    require('../../assets/images/musica.png'),
    require('../../assets/images/floklore.png'),
  ];
  const discoverItems = discoverImages.map((src, idx) => {
    const asset = Image.resolveAssetSource(src);
    const aspect = asset && asset.width && asset.height ? asset.width / asset.height : 16 / 9;
    return { key: `discover-${idx}`, src, aspect };
  });
  const discoverContents = [
    {
      title: 'Lugares',
      videos: [
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40.gonzz6_1760705320666.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40darwin.viajero_1760705299777.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40giuliogroebert_1760705309530.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40nicphotography505_1760705290773.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40oldtimeroad_1760705330527.mp4"
      ]
    },
    {
      title: 'Música',
      videos: [
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40hamlet_nica_1760705876993.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40juan_caldera.2020_1760705912871.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40luisgt502502_1760705901783.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40letrasysuspiros2097_1760705890125.mp4"

      ]
    },
    {
      title: 'Folklore',
      videos: [
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40roger.ess__1760706297546.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40yohanynica_1760706288205.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40orellana_.98_1760706274872.mp4",
        "https://pub-dc88437b1eb54374b54af12eb03423a9.r2.dev/ssstik.io_%40luisbayoni_1760706262177.mp4"
      ]
    }
  ];
  const [userHandle, setUserHandle] = useState('usuario');
  const [userPoints, setUserPoints] = useState(0);
  const [selectedDiscover, setSelectedDiscover] = useState(null);
  const [discoverModalVisible, setDiscoverModalVisible] = useState(false);
  const [fullVideoVisible, setFullVideoVisible] = useState(false);
  const [fullVideoSource, setFullVideoSource] = useState(null);
  const [discoverModalWasVisible, setDiscoverModalWasVisible] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('kira.session');
          const session = raw ? JSON.parse(raw) : null;
          const id = session?.userId ?? session?.idUsuario ?? session?.id;
          if (id) {
            try {
              const res = await fetch(`https://kira-pink-theta.vercel.app/users/nombreUsuario/${id}`);
              const json = await res.json();
              if (mounted && res.ok && json?.nombre) {
                setUserHandle(json.nombre);
              } else if (mounted) {
                setUserHandle('usuario');
              }
            } catch { if (mounted) setUserHandle('usuario'); }
            try {
              const resScore = await fetch(`https://kira-pink-theta.vercel.app/users/puntajeUsuario/${id}`);
              const jsonScore = await resScore.json();
              if (mounted && resScore.ok && jsonScore?.puntaje != null) {
                const scoreNum = Number(jsonScore.puntaje);
                setUserPoints(Number.isFinite(scoreNum) ? scoreNum : 0);
              } else if (mounted) {
                setUserPoints(0);
              }
            } catch { if (mounted) setUserPoints(0); }
          } else {
            if (mounted) setUserHandle('usuario');
            if (mounted) setUserPoints(0);
          }
        } catch {
          if (mounted) setUserHandle('usuario');
          if (mounted) setUserPoints(0);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );
  return (
    <View className="flex-1 bg-[#F1F1F1]">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
            <Image
              source={require('../../assets/images/logokiracolor.png')}
              className="w-[90px] h-[90px]"
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => router.replace('/logout')}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <LogOut size={22} color="#2469A0" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View className="mt-3 px-4">
          <View
            className="bg-white rounded-2xl p-3 shadow"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center shrink">
                <Image
                  source={require('../../assets/images/fotoperfil.png')}
                  className="w-20 h-20 rounded-full mr-3"
                />
                <View className="shrink">
                  <Text className="text-[#8B8B8B] text-sm ">Hola, {userHandle}</Text>
                  <Text className="text-[#2469A0] text-md font-extrabold mt-0.5">¡Buen día!</Text>
                </View>
              </View>

              <View className="items-end">
                <Image
                  source={require('../../assets/images/scout.png')}
                  className="w-12 h-12 rounded-xl mb-1.5 mr-4"
                  resizeMode="cover"
                />
                <Text className="text-xs text-gray-700">
                  <Text className="text-[#FEBA69] font-extrabold">Puntaje: </Text>
                  <Text className="text-[#8B8B8B] text-sm">{userPoints}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8">
          <View className="px-4">
            <Text className="text-lg font-extrabold text-[#2469A0]">Descubramos juntos</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 12 }}
          >
            <View className="flex-row">
              {discoverItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  className="h-64 m-5 rounded-2xl"
                  style={{ aspectRatio: item.aspect, overflow: 'hidden' }}
                  onPress={() => {
                    setSelectedDiscover(idx);
                    setDiscoverModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={item.src}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="mt-6 px-4">
          <Text className="text-lg font-extrabold text-[#2469A0]">Resuelve actividades para ganar puntos</Text>
          <View className="mt-3">
            <TouchableOpacity
              className="rounded-2xl overflow-hidden"
              activeOpacity={0.85}
              onPress={() => router.push('/adivina-quien-soy')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Adivina quién soy"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <LinearGradient
                colors={["#10BCE2", "#13A4C4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center">
                  <Image
                    source={require('../../assets/images/mano.png')}
                    className="w-14 h-14 mr-3 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="text-white font-extrabold text-base">Adivina quién soy</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-2xl overflow-hidden mt-2"
              activeOpacity={0.85}
              onPress={() => router.push('/NicaCuestionarios')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Nica Cuestionarios"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <LinearGradient
                colors={["#8CE27F", "#36CC20"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center">
                  <Image
                    source={require('../../assets/images/tableta.png')}
                    className="w-14 h-14 mr-3 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="text-white font-extrabold text-base">Nica Cuestionarios</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-2xl overflow-hidden mt-2"
              activeOpacity={0.85}
              onPress={() => router.push('/quiz-copla')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Completa la copla"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <LinearGradient
                colors={["#3ED6AF", "#3ABD9C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center">
                  <Image
                    source={require('../../assets/images/caja.png')}
                    className="w-14 h-14 mr-3 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="text-white font-extrabold text-base">Completa la copla</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Calendario className="mt-5" />
      </ScrollView>

      <Modal
        visible={discoverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiscoverModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
            <Pressable
              onPress={() => setDiscoverModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="absolute top-2 right-4 z-10 w-10 h-10 rounded-full items-center justify-center bg-gray-200"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
            >
              <Text className="text-gray-800 text-base">✕</Text>
            </Pressable>
            <Text className="text-lg font-extrabold text-[#2469A0] text-center mt-2">
              {selectedDiscover !== null ? discoverContents[selectedDiscover].title : ''}
            </Text>
            <ScrollView
              className="mt-3"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="flex-row flex-wrap -mx-1">
                {selectedDiscover !== null && discoverContents[selectedDiscover].videos.map((video, idx) => (
                  <View key={idx} className="w-1/2 px-1 mb-2">
                    <Pressable
                      onPress={() => {
                        setDiscoverModalWasVisible(discoverModalVisible);
                        setDiscoverModalVisible(false);
                        setFullVideoSource({ uri: video });
                        setFullVideoVisible(true);
                      }}
                    >
                      <Video
                        source={{ uri: video }}
                        style={{ width: '100%', height: 250 }}
                        resizeMode="cover"
                        shouldPlay={false}
                        isMuted={true}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={fullVideoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setFullVideoVisible(false);
          if (discoverModalWasVisible) {
            setDiscoverModalVisible(true);
            setDiscoverModalWasVisible(false);
          }
        }}
      >
        <View className="flex-1 bg-black">
          <Pressable style={{ flex: 1 }} onPress={() => {
            setFullVideoVisible(false);
            if (discoverModalWasVisible) {
              setDiscoverModalVisible(true);
              setDiscoverModalWasVisible(false);
            }
          }}>
            <View className="flex-1 items-center justify-center">
              {fullVideoSource ? (
                <Video
                  source={fullVideoSource}
                  style={{ width: '90%', height: '80%' }}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay={true}
                />
              ) : null}
              <Pressable
                onPress={() => {
                  setFullVideoVisible(false);
                  if (discoverModalWasVisible) {
                    setDiscoverModalVisible(true);
                    setDiscoverModalWasVisible(false);
                  }
                }}
                style={{ position: 'absolute', top: 40, right: 20, padding: 10 }}
              >
                <Text className="text-white text-2xl">✕</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
