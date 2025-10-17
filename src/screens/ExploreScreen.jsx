import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { places } from '../utils/places';


export default function ExploreScreen() {
  const region = {
    latitude: 12.8654,
    longitude: -85.2072,
    latitudeDelta: 5.5,
    longitudeDelta: 5.5,
  };

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
            onPress={() => openSheetFor(p.id)}
          >
            {/* Marker icon: simple View for cross-platform compatibility */}
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#2469A0', borderWidth: 2, borderColor: '#fff', elevation: 4 }} />
              <View style={{ width: 8, height: 8, marginTop: -4, backgroundColor: '#2469A0', transform: [{ rotate: '45deg' }] }} />
            </View>
            <Callout>
              <View style={{ width: 224, padding: 12 }}>
                <Text style={{ color: '#2469A0', fontSize: 16, fontWeight: '600' }}>{p.title}</Text>
                <Text style={{ color: '#555', marginTop: 8 }}>{p.description}</Text>
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
                  source={{uri: selected.image}}
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

              {selected?.images?.length ? (
                <View className="mt-6">
                  <Text className="text-lg font-extrabold text-[#2469A0]">Imágenes relacionadas</Text>
                  <View className="mt-3 flex-row flex-wrap -mx-1">
                    {selected.images.map((v, idx) => (
                      <View key={idx} className="w-1/2 px-1 mb-2">
                        <Image
                          source={{uri: v}}
                          resizeMode="contain"
                          style={{ width: '100%', height: 200 }}
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
