import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        const session = raw ? JSON.parse(raw) : null;
        setUserEmail(session?.correo || null);
      } catch {
        setUserEmail(null);
      }
    })();
  }, []);
  const userHandle = userEmail ? String(userEmail).split('@')[0] : 'usuario';
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
                  <Text className="text-[#8B8B8B] text-sm">1000</Text>
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
              {discoverItems.map((item) => (
                <View
                  key={item.key}
                  className="h-64 m-5 rounded-2xl"
                  style={{ aspectRatio: item.aspect, overflow: 'hidden' }}
                >
                  <Image
                    source={item.src}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="mt-6 px-4">
          <Text className="text-lg font-extrabold text-[#2469A0]">Resuelve actividades para ganar puntos</Text>
          <View className="mt-3">
            <View className="rounded-2xl overflow-hidden">
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
            </View>

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
    </View>
  );
}
