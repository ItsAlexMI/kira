import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NicaCuestionariosScreen() {
  return (
  <View className="relative flex-1 bg-[#F1F1F1]">
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

      <View className="mt-2 items-center">
        <View className="bg-white rounded-full px-5 py-4 shadow items-center" style={{ elevation: 3 }}>
          
          <Text className="text-[#2469A0] font-extrabold text-md">Elige un tema</Text>
        </View>
      </View>

  <ScrollView className="px-4 mt-4" contentContainerStyle={{ paddingBottom: 96 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/quiz-geografia')}
          className="rounded-2xl overflow-hidden h-44 mb-3 items-center justify-center"
          style={{ elevation: 3 }}
          accessibilityRole="button"
          accessibilityLabel="Abrir cuestionario de Geografía"
        >
          <LinearGradient
            colors={["#3ABD9C", "#2D977C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute -right-5 top-0 bottom-0 w-[100%] mt-11 items-end justify-end">
            <Image
              source={require('../../assets/images/siluetageo.png')}
              className="w-full h-full opacity-80"
              resizeMode="contain"
            />
          </View>
          <Text className="text-white font-extrabold text-lg text-center">Geografía de Nicaragua</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/quiz-cultura')}
          className="rounded-2xl overflow-hidden h-44 mb-3 items-center justify-center"
          style={{ elevation: 3 }}
          accessibilityRole="button"
          accessibilityLabel="Abrir cuestionario de Cultura"
        >
          <LinearGradient
            colors={["#10BCE2", "#0D92B0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute -right-2 top-0 bottom-0 w-[115%] mt-1 items-end justify-end">
            <Image
              source={require('../../assets/images/siluetaflok.png')}
              className="w-full h-full opacity-80"
              resizeMode="contain"
            />
          </View>
          <Text className="text-white font-extrabold text-lg text-center">Cultura Nicaraguense</Text>
        </TouchableOpacity>

        <View className="rounded-2xl overflow-hidden h-44 items-center justify-center" style={{ elevation: 3 }}>
          <LinearGradient
            colors={["#FEBA69", "#D29C5D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute right-0 top-0 bottom-0 w-[105%] mt-10 items-end justify-end">
            <Image
              source={require('../../assets/images/siluetagastro.png')}
              className="w-full h-full opacity-80"
              resizeMode="contain"
            />
          </View>
          <Text className="text-white font-extrabold text-lg text-center">Gastronomía Nicaraguense</Text>
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-[#D9D9D9]">
        <Text className="text-center text-[#797979] font-semibold py-2">Más cuestionarios pronto...</Text>
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Android shadow
    elevation: 3,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
