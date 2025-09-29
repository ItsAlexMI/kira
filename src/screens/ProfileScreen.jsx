import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ChevronLeft, KeyRound, User } from 'lucide-react-native';
import React from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [username, setUsername] = React.useState('usuario');
  const [points, setPoints] = React.useState(0);
  const [imgError, setImgError] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('grid'); 
  const [showNameModal, setShowNameModal] = React.useState(false);
  const [showPassModal, setShowPassModal] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [nameLoading, setNameLoading] = React.useState(false);
  const [nameError, setNameError] = React.useState('');
  const [passActual, setPassActual] = React.useState('');
  const [passNueva, setPassNueva] = React.useState('');
  const [passLoading, setPassLoading] = React.useState(false);
  const [passError, setPassError] = React.useState('');
  const [passSuccess, setPassSuccess] = React.useState('');
  const [nameSuccess, setNameSuccess] = React.useState('');
  const [userId, setUserId] = React.useState(null);
  const [posts, setPosts] = React.useState([]);
  const [loadingPosts, setLoadingPosts] = React.useState(false);
  const [postsError, setPostsError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        if (raw) {
          const parsed = JSON.parse(raw);
          let userIdValue = parsed?.userId ?? parsed?.idUsuario ?? parsed?.id;
          if (typeof userIdValue === 'string' && /^\d+$/.test(userIdValue)) userIdValue = Number(userIdValue);
          if (userIdValue != null && userIdValue !== '' && userIdValue !== 'usuario') {
            setUserId(userIdValue);
            try {
              const res = await fetch(`https://kira-pink-theta.vercel.app/users/nombreUsuario/${userIdValue}`);
              const json = await res.json();
              if (res.ok && json?.nombre) {
                setUsername(json.nombre);
              } else {
                setUsername('usuario');
              }
            } catch {
              setUsername('usuario');
            }
            try {
              const resScore = await fetch(`https://kira-pink-theta.vercel.app/users/puntajeUsuario/${userIdValue}`);
              const jsonScore = await resScore.json();
              if (resScore.ok && jsonScore?.puntaje != null) {
                const scoreNum = Number(jsonScore.puntaje);
                setPoints(Number.isFinite(scoreNum) ? scoreNum : 0);
              } else {
                setPoints(0);
              }
            } catch {
              setPoints(0);
            }
          }
          let id = parsed?.userId ?? parsed?.idUsuario ?? parsed?.id;
          if (typeof id === 'string' && /^\d+$/.test(id)) id = Number(id);
          if (id != null && id !== '' && id !== 'usuario') {
            setUserId(id);
            try {
              const res = await fetch(`https://kira-pink-theta.vercel.app/users/nombreUsuario/${id}`);
              const json = await res.json();
              if (res.ok && json?.nombre) {
                setUsername(json.nombre);
              } else {
                setUsername('usuario');
                console.log('[ProfileScreen] API username fallback', json);
              }
            } catch (e) {
              setUsername('usuario');
              console.log('[ProfileScreen] API username error', e);
            }
          } else {
            setUsername('usuario');
            console.log('[ProfileScreen] No valid userId found', id);
          }
        } else {
          setUsername('usuario');
          console.log('[ProfileScreen] No session found');
        }
      } catch (e) {
        setUsername('usuario');
        console.log('[ProfileScreen] Error parsing session', e);
      }
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      setLoadingPosts(true);
      setPostsError(null);
      fetch(`https://kira-pink-theta.vercel.app/posts/usuario/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar publicaciones');
          return res.json();
        })
        .then(data => {
          const mapped = Array.isArray(data) ? data.map(p => ({
            id: String(p.id),
            mediaUrl: p.link_archivo || p.url || '',
            isVideo: p.link_archivo ? /\.(mp4|mov|m4v|webm|ogg)$/i.test(p.link_archivo) : false,
            description: p.descripcion || '',
            createdAt: p.fecha_creación || p.fecha_creacion || p.createdAt || p.created_at || '',
            likes: Number(p.reacciones) || 0,
            comments: p.comentarios != null ? Number(p.comentarios) : 0,
          })) : [];
          if (!cancelled) setPosts(mapped);
        })
        .catch(e => {
          if (!cancelled) setPostsError(e.message || 'Error');
        })
        .finally(() => {
          if (!cancelled) setLoadingPosts(false);
        });
      return () => { cancelled = true; };
    }, [userId])
  );

  const renderGrid = () => (
    <View style={{ flex: 1 }}>
      {loadingPosts ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#8B8B8B] text-sm">Cargando publicaciones…</Text>
        </View>
      ) : postsError ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500 text-sm">{postsError}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#8B8B8B] text-sm">No hay publicaciones aún.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          numColumns={3}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl overflow-hidden"
              style={{ flex: 1, aspectRatio: 1 }}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/post-detail', params: { id: item.id } })}
            >
              {item.mediaUrl ? (
                item.isVideo ? (
                  <View className="flex-1 items-center justify-center bg-black">
                    <Feather name="play" size={32} color="#FEBA69" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                )
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-100">
                  <Feather name="image" size={32} color="#8B8B8B" />
                </View>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <>
      <View style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
        <View className="px-4 mt-1">
          <View className="bg-white rounded-2xl p-3 shadow" style={{ elevation: 2 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center shrink">
                <Image
                  source={imgError ? require('../../assets/images/logokiracolor.png') : require('../../assets/images/fotoperfil.png')}
                  className="w-16 h-16 rounded-full mr-3"
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
                <View className="shrink">
                  <Text className="text-[#8B8B8B] text-sm font-semibold" numberOfLines={1}>
                    {username}
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
        </View>

        <View className="mt-5 px-4 flex-row justify-around">
          {[
            { key: 'grid', iconName: 'grid' },
            { key: 'settings', iconName: 'settings' },
          ].map(({ key, iconName }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.7}
                className="items-center flex-1"
              >
                <View className="items-center">
                  <Feather name={iconName} size={28} color={active ? '#2469A0' : '#8B8B8B'} />
                  <View
                    className={active ? 'mt-2 h-1 w-10 rounded-full bg-[#2469A0]' : 'mt-2 h-1 w-10 rounded-full bg-transparent'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-10 px-4 flex-1">
          {activeTab === 'grid' ? renderGrid() : (
            <View className="flex-1">
              <Text className="text-[#2469A0] text-lg font-bold mb-4 mt-2">Configuración de usuario</Text>
              <View className="bg-white rounded-2xl p-4 mb-4 shadow" style={{ elevation: 2 }}>
                <TouchableOpacity
                  className="py-3 border-b border-gray-200 flex-row items-center"
                  onPress={() => { setShowNameModal(true); setNewName(''); setNameError(''); setNameSuccess(''); }}
                >
                  <User size={22} color="#222" style={{ marginRight: 10 }} />
                  <Text className="text-[#8B8B8B] text-base">Cambiar nombre de usuario</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-3 flex-row items-center"
                  onPress={() => { setShowPassModal(true); setPassActual(''); setPassNueva(''); setPassError(''); setPassSuccess(''); }}
                >
                  <KeyRound size={22} color="#222" style={{ marginRight: 10 }} />
                  <Text className="text-[#8B8B8B] text-base">Cambiar contraseña</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-[#2469A0] text-lg font-bold mb-4 mt-2">Sesión</Text>
              <View className="bg-white rounded-2xl p-4 mb-4 shadow" style={{ elevation: 2 }}>
                <TouchableOpacity
                  className="py-3 flex-row items-center"
                  onPress={async () => {
                    await AsyncStorage.removeItem('kira.session');
                    router.replace('/login');
                  }}
                >
                  <Feather name="log-out" size={22} color="#222" style={{ marginRight: 10 }} />
                  <Text className="text-red-500 text-base">Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
              {showNameModal && (
                <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }} />
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 36,
                    paddingVertical: 36,
                    paddingHorizontal: 32,
                    minWidth: 380,
                    minHeight: 320,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#FEBA69',
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 16,
                    zIndex: 101
                  }}>
                    <User size={32} color="#FEBA69" style={{ marginBottom: 10 }} />
                    <Text className="text-[#222] text-xl font-bold mb-2">Cambiar nombre de usuario</Text>
                    <Text className="text-[#8B8B8B] mb-2">Nombre actual: <Text className="font-bold">{username}</Text></Text>
                    <View className="mb-2 w-full">
                      <Text className="text-[#222] mb-1">Nuevo nombre</Text>
                      <View className="bg-gray-100 rounded-full px-4 py-2">
                        <TextInput
                          value={newName}
                          onChangeText={setNewName}
                          placeholder="Escribe el nuevo nombre"
                          style={{ color: '#222', fontSize: 16 }}
                        />
                      </View>
                    </View>
                    {nameError ? <Text className="text-red-500 text-xs mb-2">{nameError}</Text> : null}
                    {nameSuccess ? <Text className="text-green-600 text-xs mb-2">{nameSuccess}</Text> : null}
                    <View className="flex-row justify-end mt-4 w-full">
                      <TouchableOpacity className="px-4 py-2 mr-2" onPress={() => setShowNameModal(false)}>
                        <Text className="text-gray-600">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-4 py-2 bg-[#FEBA69] rounded-full"
                        disabled={nameLoading || !newName.trim()}
                        onPress={async () => {
                          setNameLoading(true);
                          setNameError('');
                          setNameSuccess('');
                          try {
                            const res = await fetch('https://kira-pink-theta.vercel.app/users/cambiarNombreUsuario', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: userId, nuevoNombre: newName.trim() }),
                            });
                            const json = await res.json();
                            if (res.ok && json.success) {
                              setNameSuccess('Nombre de usuario cambiado con éxito');
                              setUsername(newName.trim());
                            } else {
                              setNameError(json.Message || 'No se pudo cambiar el nombre');
                            }
                          } catch (e) {
                            setNameError('Error de red');
                          } finally {
                            setNameLoading(false);
                          }
                        }}
                      >
                        <Text className="text-white font-semibold">Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {showPassModal && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 999, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 36,
                    paddingVertical: 36,
                    paddingHorizontal: 32,
                    minWidth: 380,
                    minHeight: 320,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#FEBA69',
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 16,
                    zIndex: 101
                  }}>
                    <KeyRound size={32} color="#FEBA69" style={{ marginBottom: 10 }} />
                    <Text className="text-[#222] text-xl font-bold mb-2">Cambiar contraseña</Text>
                    <View className="mb-2 w-full">
                      <Text className="text-[#222] mb-1">Contraseña actual</Text>
                      <View className="bg-gray-100 rounded-full px-4 py-2">
                        <TextInput
                          value={passActual}
                          onChangeText={setPassActual}
                          placeholder="Escribe tu contraseña actual"
                          secureTextEntry
                          style={{ color: '#222', fontSize: 16 }}
                        />
                      </View>
                    </View>
                    <View className="mb-2 w-full">
                      <Text className="text-[#222] mb-1">Nueva contraseña</Text>
                      <View className="bg-gray-100 rounded-full px-4 py-2">
                        <TextInput
                          value={passNueva}
                          onChangeText={setPassNueva}
                          placeholder="Escribe la nueva contraseña"
                          secureTextEntry
                          style={{ color: '#222', fontSize: 16 }}
                        />
                      </View>
                    </View>
                    {passError ? <Text className="text-red-500 text-xs mb-2">{passError}</Text> : null}
                    {passSuccess ? <Text className="text-green-600 text-xs mb-2">{passSuccess}</Text> : null}
                    <View className="flex-row justify-end mt-4 w-full">
                      <TouchableOpacity className="px-4 py-2 mr-2" onPress={() => setShowPassModal(false)}>
                        <Text className="text-gray-600">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-4 py-2 bg-[#FEBA69] rounded-full"
                        disabled={passLoading || !passActual.trim() || !passNueva.trim()}
                        onPress={async () => {
                          setPassLoading(true);
                          setPassError('');
                          setPassSuccess('');
                          try {
                            const res = await fetch('https://kira-pink-theta.vercel.app/users/cambiarContrasena', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: userId, contrasenaActual: passActual, nuevaContrasena: passNueva }),
                            });
                            const json = await res.json();
                            if (res.ok && json.success) {
                              setPassSuccess('Contraseña cambiada con éxito');
                              setPassActual('');
                              setPassNueva('');
                            } else {
                              setPassError(json.Message || 'No se pudo cambiar la contraseña');
                            }
                          } catch (e) {
                            setPassError('Error de red');
                          } finally {
                            setPassLoading(false);
                          }
                        }}
                      >
                        <Text className="text-white font-semibold">Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

    </>
  );
};


export default ProfileScreen;
