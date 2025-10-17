import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const cities = [
  'Managua',
  'León',
  'Granada',
  'Masaya',
  'Chinandega',
  'Matagalpa',
  'Estelí',
  'Jinotega',
  'Bluefields',
  'Juigalpa',
  'Somoto',
  'Ocotal',
  'Rivas',
  'San Carlos',
  'Boaco',
  'Nueva Guinea',
  'Puerto Cabezas',
  'San Juan del Sur',
  'Nandaime',
  'Tipitapa',
  'Diriamba',
  'El Rama',
  'La Paz Centro',
  'Corinto',
  'Sébaco',
  'Camoapa',
  'San Rafael del Sur',
  'Ticuantepe',
  'El Viejo',
  'Nagarote',
  'San Marcos',
  'Rosita',
  'Mulukukú',
  'Waslala',
  'Siuna',
  'Telica',
  'San Miguelito',
  'La Trinidad',
  'San Jorge',
  'San Lorenzo',
  'San Juan de Limay',
  'San Juan de Oriente',
];

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(cities[0]);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    city: '',
  });

  const [cityModalVisible, setCityModalVisible] = useState(false); 
  const [tempCity, setTempCity] = useState(city);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{8}$/; 

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: '',
      city: '',
    };

    if (!username.trim()) newErrors.username = 'El nombre de usuario es obligatorio';
    if (!password || password.length < 6)
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (confirmPassword !== password) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!emailRegex.test(email)) newErrors.email = 'Correo inválido';
    if (!phoneRegex.test(phone)) newErrors.phone = 'Número de celular inválido (8 dígitos)';
    if (!city) newErrors.city = 'Selecciona una ciudad';

    setErrors(newErrors);
    return Object.values(newErrors).every((v) => !v);
  };

  const isFormValid =
    username.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword === password &&
    emailRegex.test(email) &&
    phoneRegex.test(phone) &&
    !!city;

  const handleRegister = async () => {
    const ok = validateForm();
    if (!ok) {
      Alert.alert('Revisa el formulario', 'Corrige los campos señalados en rojo.');
      return;
    }
    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      const payload = {
        nombre: username.trim(),
        contrasena: password,
        correo: normalizedEmail,
        celular: phone.trim(),
        ciudad: city,
      };
      const res = await fetch('https://kira-pink-theta.vercel.app/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log('Respuesta registro:', json); // Log para depuración
      if (res.ok && json?.id) {
        Alert.alert('Registro exitoso', 'Tu cuenta fue creada. Ahora inicia sesión.');
        router.replace('/login');
        return;
      } else {
        // Mensajes de error amigables para el usuario
        let errorMsg = 'No se pudo completar el registro. Inténtalo de nuevo.';
        if (json?.message) {
          const msg = json.message.toLowerCase();
          if (msg.includes('duplicate') || msg.includes('ya existe') || msg.includes('existe')) {
            errorMsg = 'El correo o nombre de usuario ya está registrado.';
          } else if (msg.includes('invalid') || msg.includes('válido') || msg.includes('formato')) {
            errorMsg = 'Los datos proporcionados no son válidos. Revisa tu información.';
          } else if (msg.includes('password') || msg.includes('contraseña')) {
            errorMsg = 'La contraseña no cumple con los requisitos.';
          } else if (msg.includes('email') || msg.includes('correo')) {
            errorMsg = 'El correo electrónico no es válido o ya está en uso.';
          } else {
            // Si el mensaje parece técnico, usar genérico
            errorMsg = msg.length < 100 ? json.message : 'Ocurrió un error inesperado. Contacta soporte si persiste.';
          }
        }
        Alert.alert('Error en registro', errorMsg);
      }
    } catch (e) {
      console.error('Error en registro:', e);
      Alert.alert('Error de conexión', 'No se pudo conectar al servidor. Revisa tu conexión a internet e inténtalo de nuevo.');
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
          <View className="flex-1">
            <View className="items-center mb-2 mt-16">
              <View>
                <Image
                  source={require('../../assets/images/logokira.png')}
                  style={{ width: 160, height: 160 }}
                  resizeMode="contain"
                  accessibilityLabel="Logo Kira"
                />
              </View>
              <Text className="text-white text-4xl" style={{ fontFamily: 'ProtestStrike_400Regular' }}>Bienvenido a Kira</Text>
              <Text className="text-white text-lg  opacity-90 mt-1">Innovación con identidad Nica!</Text>
            </View>

            <View className="bg-white w-full rounded-t-3xl px-6 pt-5 pb-6 shadow-lg flex-1 justify-between mt-2">
              <Text className="text-[#2469A0] text-2xl font-extrabold text-center mb-2">Registro</Text>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text className="text-[#2B4C7E] font-semibold mb-0">Nombre de Usuario</Text>
                <View
                  className={`flex-row items-center rounded-full px-4 py-3 mb-2 bg-white border ${
                    errors.username ? 'border-red-500' : 'border-green-500'
                  }`}
                >
                  <Ionicons name="person-outline" size={20} color="#2B4C7E" />
                  <TextInput
                    value={username}
                    onChangeText={(t) => {
                      setUsername(t);
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    placeholder="Ingresa tu nombre de usuario"
                    placeholderTextColor="#9CA3AF"
                    className="ml-2 flex-1 text-gray-800"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.username ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.username}</Text>
                ) : null}

                <Text className="text-[#2B4C7E] font-semibold mb-0">Contraseña</Text>
                <View
                  className={`flex-row items-center rounded-full px-4 py-3 mb-2 bg-white border ${
                    errors.password ? 'border-red-500' : 'border-blue-400'
                  }`}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#2B4C7E" />
                  <TextInput
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    className="ml-2 flex-1 text-gray-800"
                    autoCapitalize="none"
                  />
                </View>
                {errors.password ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
                ) : null}

                <Text className="text-[#2B4C7E] font-semibold mb-0">Confirmar Contraseña</Text>
                <View
                  className={`flex-row items-center rounded-full px-4 py-3 mb-2 bg-white border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-blue-400'
                  }`}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#2B4C7E" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Confirma tu contraseña"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    className="ml-2 flex-1 text-gray-800"
                    autoCapitalize="none"
                  />
                </View>
                {errors.confirmPassword ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
                ) : null}

                <Text className="text-[#2B4C7E] font-semibold mb-0">Correo</Text>
                <View
                  className={`flex-row items-center rounded-full px-4 py-3 mb-2 bg-white border ${
                    errors.email ? 'border-red-500' : 'border-blue-400'
                  }`}
                >
                  <Ionicons name="mail-outline" size={20} color="#2B4C7E" />
                  <TextInput
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="Ingresa tu correo"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    className="ml-2 flex-1 text-gray-800"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
                ) : null}

                <Text className="text-[#2B4C7E] font-semibold mb-0">Número de Celular</Text>
                <View
                  className={`flex-row items-center rounded-full px-4 py-3 mb-2 bg-white border ${
                    errors.phone ? 'border-red-500' : 'border-blue-400'
                  }`}
                >
                  <Ionicons name="call-outline" size={20} color="#2B4C7E" />
                  <TextInput
                    value={phone}
                    onChangeText={(t) => {
                      const v = t.replace(/\s+/g, '');
                      setPhone(v);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="Ingresa tu número de celular"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="ml-2 flex-1 text-gray-800"
                    autoCapitalize="none"
                  />
                </View>
                {errors.phone ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
                ) : null}

                <Text className="text-[#2B4C7E] font-semibold mb-0">Ciudad</Text>
                {Platform.OS === 'android' ? (
                  <View
                    className={`rounded-full px-4 py-2 mb-2 bg-white flex-row items-center border ${
                      errors.city ? 'border-red-500' : 'border-blue-400'
                    }`}
                  >
                    <Ionicons name="location-outline" size={20} color="#2B4C7E" />
                    <Picker
                      selectedValue={city}
                      onValueChange={(v) => {
                        setCity(v);
                        if (errors.city) setErrors({ ...errors, city: '' });
                      }}
                      mode="dropdown"
                      style={{ flex: 1, marginLeft: 8, color: '#111827', backgroundColor: 'transparent' }}
                      dropdownIconColor="#2B4C7E"
                    >
                      {cities.map((c) => (
                        <Picker.Item label={c} value={c} key={c} />
                      ))}
                    </Picker>
                  </View>
                ) : Platform.OS === 'ios' ? (
                  <>
                    <Pressable
                      onPress={() => {
                        setTempCity(city);
                        setIosPickerOpen(true);
                      }}
                      className={`rounded-full px-4 py-2 mb-2 bg-white flex-row items-center border ${
                        errors.city ? 'border-red-500' : 'border-blue-400'
                      }`}
                    >
                      <Ionicons name="location-outline" size={20} color="#2B4C7E" />
                      <Text
                        className={`ml-2 flex-1 ${city ? 'text-gray-800' : 'text-gray-400'}`}
                        style={{ color: city ? '#111827' : '#9CA3AF' }}
                      >
                        {city || 'Selecciona una ciudad'}
                      </Text>
                      <Ionicons name="chevron-down-outline" size={20} color="#2B4C7E" />
                    </Pressable>

                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => {
                        setTempCity(city);
                        setCityModalVisible(true);
                      }}
                      className={`rounded-full px-4 py-2 mb-2 bg-white flex-row items-center border ${
                        errors.city ? 'border-red-500' : 'border-blue-400'
                      }`}
                    >
                      <Ionicons name="location-outline" size={20} color="#2B4C7E" />
                      <Text
                        className={`ml-2 flex-1 ${city ? 'text-gray-800' : 'text-gray-400'}`}
                        style={{ color: city ? '#111827' : '#9CA3AF' }}
                      >
                        {city || 'Selecciona una ciudad'}
                      </Text>
                      <Ionicons name="chevron-down-outline" size={20} color="#2B4C7E" />
                    </Pressable>

                  </>
                )}

                {errors.city ? (
                  <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                className={`rounded-full py-4 items-center mt-4 ${loading ? 'bg-[#5B8DBA]' : 'bg-[#2469A0]'}`}
                disabled={loading}
                onPress={handleRegister}
              >
                <Text className="text-white text-center text-lg font-bold">{loading ? 'Registrando…' : 'Registrarse'}</Text>
              </TouchableOpacity>

              <View className="mt-6">
                <View className="border-t border-gray-200 mb-4" />
                <Text className="text-gray-500 text-center">
                  Si ya tienes una cuenta... simplemente{' '}
                  <Text className="text-[#2469A0] font-semibold" onPress={() => router.push('/login')}>
                    Iniciar sesión
                  </Text>
                </Text>
              </View>
            </View>
           
            {Platform.OS === 'ios' && (
              <Modal
                visible={iosPickerOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIosPickerOpen(false)}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
                    <Text className="text-lg font-bold text-[#2B4C7E] mb-2">Selecciona tu ciudad</Text>
                    <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: 'white' }}>
                      <Picker
                        selectedValue={tempCity}
                        onValueChange={(v) => setTempCity(v)}
                        itemStyle={{ color: '#111827', fontSize: 18 }}
                      >
                        {cities.map((c) => (
                          <Picker.Item label={c} value={c} key={c} />
                        ))}
                      </Picker>
                    </View>
                    <View className="flex-row justify-end mt-4">
                      <TouchableOpacity className="px-4 py-2 mr-2" onPress={() => setIosPickerOpen(false)}>
                        <Text className="text-gray-600">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-4 py-2 bg-[#2469A0] rounded-full"
                        onPress={() => {
                          setCity(tempCity);
                          if (errors.city) setErrors({ ...errors, city: '' });
                          setIosPickerOpen(false);
                        }}
                      >
                        <Text className="text-white font-semibold">Listo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {Platform.OS === 'web' && (
              <Modal
                visible={cityModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCityModalVisible(false)}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '60%' }}>
                    <Text className="text-lg font-bold text-[#2B4C7E] mb-2">Selecciona tu ciudad</Text>
                    <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                      <ScrollView style={{ maxHeight: 320 }}>
                        {cities.map((c) => (
                          <Pressable
                            key={c}
                            onPress={() => setTempCity(c)}
                            style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: tempCity === c ? '#F3F4F6' : 'white' }}
                          >
                            <Text style={{ color: '#111827' }}>{c}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    <View className="flex-row justify-end mt-4">
                      <TouchableOpacity className="px-4 py-2 mr-2" onPress={() => setCityModalVisible(false)}>
                        <Text className="text-gray-600">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-4 py-2 bg-[#2469A0] rounded-full"
                        onPress={() => {
                          setCity(tempCity);
                          if (errors.city) setErrors({ ...errors, city: '' });
                          setCityModalVisible(false);
                        }}
                      >
                        <Text className="text-white font-semibold">Listo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </SafeAreaProvider>
  );
}
