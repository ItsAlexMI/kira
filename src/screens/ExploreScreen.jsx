import { Video } from 'expo-av';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ExploreScreen() {
  const region = {
    latitude: 12.8654,
    longitude: -85.2072,
    latitudeDelta: 5.5,
    longitudeDelta: 5.5,
  };
  const places = [
    {
      id: 'managua-center',
      coordinate: { latitude: 12.136389, longitude: -86.251389 },
      title: 'Managua, Nicaragua',
      description: 'Descubre nuestras memorias y lugares destacados de la capital.',
      image: require('../../assets/images/react-logo.png'),
      highlight: { primary: 'Managua, ', secondary: 'Nicaragua' },
      videos: [
        require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
      ],
    },
    {
      id: 'teatro-ruben-dario',
      coordinate: { latitude: 12.158491128974578, longitude: -86.27246175872068 },
      title: 'Teatro Nacional Rubén Darío',
      description: 'El Teatro Nacional Rubén Darío, inaugurado en 1969 en honor al poeta nicaragüense, es uno de los más prestigiosos de Centroamérica. Sobrevivió al terremoto de 1972 y hoy es un símbolo cultural de Nicaragua, reconocido por su arquitectura moderna, gran acústica y escenario de importantes eventos artísticos.',
      image: require('../../assets/images/teatrord.png'),
      highlight: { primary: 'Teatro Nacional Rubén Darío', secondary: ' - Managua' },
      videos: [
        require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
         require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
        require('../../assets/images/video.mp4'),
      ],
    },
  ];

  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(() => places.find(p => p.id === selectedId) || null, [selectedId]);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheetFor = (id) => {
    setSelectedId(id);
    setSheetVisible(true);
  };
  const closeSheet = () => setSheetVisible(false);

  return (
    <View className="flex-1 bg-[#F1F1F1]">
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        toolbarEnabled={false}
      >
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={p.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={() => openSheetFor(p.id)}
          >
            <View className="items-center">
              <View
                className="w-4 h-4 rounded-full bg-[#2469A0] border-2 border-white"
                style={{ elevation: 4 }}
              />
              <View
                className="bg-[#2469A0]"
                style={{ width: 8, height: 8, marginTop: -4, transform: [{ rotate: '45deg' }] }}
              />
            </View>
            <Callout>
              <View className="w-56 p-3">
                <Text className="text-[#2469A0] text-base font-semibold">{p.title}</Text>
                <Text className="text-gray-700 mt-2">{p.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
            <Pressable
              onPress={closeSheet}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="absolute top-2 right-4 z-10 w-10 h-10 rounded-full items-center justify-center bg-gray-200"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
            >
              <Text className="text-gray-800 text-base">✕</Text>
            </Pressable>
            <View className="items-center">
              {selected?.image ? (
                <Image
                  source={selected.image}
                  className="w-full h-48"
                  resizeMode="contain"
                />
              ) : null}
            </View>
            {selected?.highlight ? (
              <Text className="text-base font-normal text-left mt-3">
                <Text className="text-[#2469A0] font-extrabold">{selected.highlight.primary}</Text>
                <Text className="text-gray-500 font-semibold">{selected.highlight.secondary}</Text>
              </Text>
            ) : (
              <Text className="text-base font-normal text-left mt-3 text-gray-900">
                {selected?.title}
              </Text>
            )}

            <ScrollView
              className="mt-3"
              contentContainerStyle={{ paddingBottom: 20 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {selected?.description ? (
                <Text className="text-gray-500 text-base">{selected.description}</Text>
              ) : null}

              {selected?.videos?.length ? (
                <View className="mt-6">
                  <Text className="text-lg font-extrabold text-[#2469A0]">Videos relacionados</Text>
                  <View className="mt-3 flex-row flex-wrap -mx-1">
                    {selected.videos.map((v, idx) => (
                      <View key={idx} className="w-1/2 px-1 mb-2">
                        <Video
                          source={v}
                          useNativeControls
                          resizeMode="contain"
                          style={{ width: '100%', height: 200 }}
                          isLooping={false}
                          shouldPlay={false}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>

          </View>
        </View>
      </Modal>


      <SafeAreaView pointerEvents="box-none" className="absolute inset-0">
        <View pointerEvents="box-none" className="px-4 pt-2">
          <View
            accessibilityRole="header"
            className="w-full bg-white rounded-2xl py-3 px-4 shadow-lg"
          >
            <Text className="text-[#2469A0] text-base font-extrabold text-center">
              Descubre nuestras memorias
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
