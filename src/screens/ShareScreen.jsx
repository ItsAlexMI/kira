import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const [imgError, setImgError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);
  const [fullVideoVisible, setFullVideoVisible] = useState(false);
  const [fullVideoSource, setFullVideoSource] = useState(null);
  const screenWidth = React.useMemo(() => Dimensions.get('screen').width, []);
  const categories = ['Folklore', 'Gastronomia', 'Naturaleza', 'Turismo', 'Todas'];
  const profileSrc = useMemo(
    () =>
      imgError
        ? require('../../assets/images/logokiracolor.png')
        : require('../../assets/images/fotoperfil.png'),
    [imgError]
  );

  const [currentEmail, setCurrentEmail] = useState(null);
  const [userId, setUserId] = useState(null); // for likes API
  const [liked, setLiked] = useState({});
  const [likeBusy, setLikeBusy] = useState({}); // id -> true mientras se manda
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createDescription, setCreateDescription] = useState('');
  const [createCategory, setCreateCategory] = useState('folklore');
  const [createMedia, setCreateMedia] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [posts, setPosts] = useState([]); // listado de posts obtenidos del backend

  const CREATE_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/create';

  const inferMimeAndName = (asset) => {
    const uri = asset?.uri || '';
    const isVideo = asset?.type === 'video';
    const lastSeg = uri.split('?')[0].split('/').pop() || '';
    let ext = (lastSeg.includes('.') ? lastSeg.split('.').pop() : '').toLowerCase();
    if (!ext) {
      // Try to guess from uri mime-like hints
      if (/mp4/i.test(uri)) ext = 'mp4';
      else if (/mov/i.test(uri)) ext = 'mov';
      else if (/m4v/i.test(uri)) ext = 'm4v';
      else if (/png/i.test(uri)) ext = 'png';
      else if (/jpe?g/i.test(uri)) ext = 'jpg';
    }
    let mime = 'application/octet-stream';
    if (!isVideo) {
      if (ext === 'png') mime = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else mime = 'image/jpeg';
    } else {
      if (ext === 'mp4') mime = 'video/mp4';
      else if (ext === 'mov') mime = 'video/quicktime';
      else if (ext === 'm4v') mime = 'video/x-m4v';
      else mime = 'video/mp4';
    }
    let name = asset?.fileName || lastSeg;
    if (!name) name = isVideo ? `video.${ext || 'mp4'}` : `image.${ext || 'jpg'}`;
    // Ensure extension present
    if (name && !/\.[a-zA-Z0-9]{2,4}$/.test(name) && ext) name += `.${ext}`;
    return { mime, name, ext, isVideo };
  };

  // Sin límite local: cualquier tamaño se intentará subir; si el backend rechaza (413) se avisará.

  const pickMedia = async () => {
    setCreateError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus archivos para seleccionar media.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.9,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      const { mime, name, isVideo } = inferMimeAndName(asset);
      let size = null;
      try {
        const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
        if (info?.size != null) size = info.size;
      } catch {}
      // Ya no bloqueamos por tamaño localmente; sólo informativo.
      setCreateMedia({ uri: asset.uri, type: mime, name, isVideo, size });
    } catch (e) {
      setCreateError('No se pudo seleccionar media');
    }
  };

  const captureMedia = async () => {
    setCreateError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para capturar media.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.9,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      const { mime, name, isVideo } = inferMimeAndName(asset);
      let size = null;
      try {
        const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
        if (info?.size != null) size = info.size;
      } catch {}
      // Sin límite local.
      setCreateMedia({ uri: asset.uri, type: mime, name, isVideo, size });
    } catch (e) {
      setCreateError('No se pudo capturar media');
    }
  };

  const resetCreateForm = () => {
    setCreateDescription('');
    setCreateCategory('folklore');
    setCreateMedia(null);
    setCreateError(null);
  };

  const submitCreatePost = async () => {
    if (!userId) {
      setCreateError('Debes iniciar sesión');
      return;
    }
    if (!createDescription.trim()) {
      setCreateError('Agrega una descripción');
      return;
    }
    if (!createMedia) {
      setCreateError('Selecciona una imagen o video');
      return;
    }
    // No se aplica límite local; depender del servidor.
    setCreateBusy(true);
    setCreateError(null);
    try {
      const form = new FormData();
      form.append('descripcion', createDescription.trim());
      form.append('categoria', createCategory); 
      form.append('idUsuario', String(userId));
      form.append('archivo', { uri: createMedia.uri, name: createMedia.name, type: createMedia.type });
      const res = await fetch(CREATE_ENDPOINT, { method: 'POST', body: form, headers: { 'Accept': 'application/json' }});
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok) {
        if (res.status === 413) {
          const sizeInfo = createMedia?.size ? ` (${(createMedia.size/(1024*1024)).toFixed(2)}MB)` : '';
          throw new Error(`El video es muy grande${sizeInfo}. Intenta grabar uno más corto o con menor calidad y vuelve a intentarlo.`);
        }
        // Extract the most human readable message
        let msg = json?.message || json?.error || raw || 'Error al crear post';
        if (typeof msg === 'object') {
          const firstVal = Object.values(msg).find(v => typeof v === 'string');
          msg = firstVal || JSON.stringify(msg);
        }
        throw new Error(String(msg));
      }
      resetCreateForm();
      setCreateVisible(false);
      setShowToast(true);
      fetchPosts();
    } catch (e) {
      let friendly = e?.message || e?.toString() || 'No se pudo crear el post';
      if (friendly === '[object Object]') friendly = 'Error desconocido al crear el post';
      setCreateError(friendly);
    } finally {
      setCreateBusy(false);
    }
  };

  const API_URL = 'https://kira-pink-theta.vercel.app/posts/todos';

  const isVideoUrl = (url) => /\.(mp4|mov|m4v|webm|ogg)$/i.test(url || '');

  const LIKE_STORE_KEY = (uid) => `kira.likes.${uid || 'anon'}`;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        if (raw) {
          const parsed = JSON.parse(raw);
          setCurrentEmail(parsed?.correo ?? null);
          const candidate = parsed?.idUsuario ?? parsed?.userId ?? parsed?.id;
          if (candidate != null) {
            const num = Number(candidate);
            setUserId(num);
            try {
              const stored = await AsyncStorage.getItem(LIKE_STORE_KEY(num));
              if (stored) {
                const parsedLikes = JSON.parse(stored);
                if (parsedLikes && typeof parsedLikes === 'object') {
                  setLiked(parsedLikes);
                }
              }
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  const fetchPosts = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { method: 'GET', headers: { 'Accept': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Error al obtener posts');
      const normalized = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
      const mapped = normalized.map((p) => {
        const link = p.link_archivo || null;
        const video = link && isVideoUrl(link);
        const rawDate = p.fecha_creación || p.fecha_creacion || p.createdAt || p.created_at || null;
        let createdAt = rawDate;
        let createdAtMs = null;
        if (rawDate) {
          const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              createdAtMs = d.getTime();
              createdAt = d.toISOString();
            }
        }
        return {
          id: String(p.id),
          authorName: p.usuario || 'Usuario',
          authorEmail: null,
          mediaUrl: link,
          isVideo: !!video,
          likes: Number(p.reacciones) || 0,
          comments: p.comentarios ? Number(p.comentarios) : 0,
          description: p.descripcion || '',
          tipo: (p.tipo || '').toLowerCase(),
          createdAt,
          createdAtMs,
        };
      });
      // Sort descending by date (most recent first). Items without date go last.
      mapped.sort((a,b) => {
        if (a.createdAtMs && b.createdAtMs) return b.createdAtMs - a.createdAtMs;
        if (a.createdAtMs) return -1;
        if (b.createdAtMs) return 1;
        return 0;
      });
      setPosts(mapped);
    } catch (e) {
      setError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Auto ocultar toast sin renderizar valores no-React
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 1800);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts({ silent: true });
  }, [fetchPosts]);

  const likeScaleMap = useRef({}).current;
  const getLikeAnim = (id) => {
    if (!likeScaleMap[id]) likeScaleMap[id] = new Animated.Value(1);
    return likeScaleMap[id];
  };

  const REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/reaccion';

  const sendLikeToApi = async ({ idPost }) => {
    if (userId == null) return { ok: false, reason: 'no-user' };
    try {
      const payload = { idUsuario: Number(userId), idPost: Number(idPost) };
      const res = await fetch(REACTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      if (res.ok) return { ok: true, json, raw };
      return { ok: false, raw, json, status: res.status };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };

  const persistLikes = async (nextState) => {
    if (userId == null) return;
    try {
      await AsyncStorage.setItem(LIKE_STORE_KEY(userId), JSON.stringify(nextState));
    } catch {}
  };

  const toggleLike = async (postId) => {
    if (likeBusy[postId]) return;
    const previous = !!liked[postId];
    const optimistic = !previous;
    const nextLikedState = { ...liked, [postId]: optimistic };
    setLiked(nextLikedState);
    persistLikes(nextLikedState);
    setLikeBusy((prev) => ({ ...prev, [postId]: true }));

    const anim = getLikeAnim(postId);
    if (optimistic) {
      anim.setValue(0.9);
      Animated.sequence([
        Animated.spring(anim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();
    } else {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    }

    const result = await sendLikeToApi({ idPost: postId });
    if (!result.ok) {
      const reverted = { ...nextLikedState, [postId]: previous };
      setLiked(reverted);
      persistLikes(reverted);
      console.log('[Like] fallo reacción', result);
    } else {
      console.log('[Like] éxito reacción', result.json || result.raw || '');
    }
    setLikeBusy((prev) => ({ ...prev, [postId]: false }));
  };

  const saveCurrentImage = async () => {
    if (!fullImageSource) return;
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para guardar imágenes.');
      return;
    }
    try {
      let localUri = null;
      if (typeof fullImageSource === 'number') {
        const asset = Asset.fromModule(fullImageSource);
        await asset.downloadAsync();
        localUri = asset.localUri || asset.uri;
      } else if (fullImageSource?.uri) {
        const fileName = `image-${Date.now()}.jpg`;
        const download = await FileSystem.downloadAsync(fullImageSource.uri, FileSystem.cacheDirectory + fileName);
        localUri = download.uri;
      }
      if (!localUri) throw new Error('No se pudo obtener la imagen');
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Guardado', 'La imagen se guardó en tu galería.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    }
  };

  const renderAvatar = (size = 40) => (
    <View style={{ width: size, height: size }} className="rounded-full overflow-hidden">
      <LinearGradient
        colors={["#2667A2", "#10BCE2", "#3ABD9C", "#3ED6AF"]}
        locations={[0, 0.32, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 m-1 bg-white rounded-full overflow-hidden"
          style={{ padding: StyleSheet.hairlineWidth }}
        >
          <Image
            source={profileSrc}
            className="w-full h-full rounded-full"
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        </View>
      </LinearGradient>
    </View>
  );

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'Todas') return posts;
    const key = selectedCategory.toLowerCase();
    return posts.filter(p => p.tipo === key);
  }, [posts, selectedCategory]);

  const renderMedia = (item) => {
    if (item.isVideo && item.mediaUrl) {
      return (
        <Pressable
          style={{ width: screenWidth, alignSelf: 'center', backgroundColor: '#000' }}
          onPress={() => {
            setFullVideoSource({ uri: item.mediaUrl });
            setFullVideoVisible(true);
          }}
        >
          <View style={{ position: 'relative', width: '100%', height: 288, backgroundColor: '#000' }}>
            <Video
              source={{ uri: item.mediaUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              shouldPlay={false}
              isMuted
            />
            <View style={{ position: 'absolute', inset: 0 }} className="items-center justify-center">
              <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: 14, borderRadius: 50 }}>
                <Feather name="play" size={36} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Pressable>
      );
    }
    const imageSource = item.mediaUrl ? { uri: item.mediaUrl } : null;
    return (
      <Pressable
        style={{ width: screenWidth, alignSelf: 'center' }}
        onPress={() => {
          if (!imageSource) return;
          setFullImageSource(imageSource);
          setFullImageVisible(true);
        }}
      >
        {imageSource ? (
          <Image source={imageSource} style={{ width: '100%', height: 288 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 288, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-[#555]">Sin media</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      // Solo fecha: 26 Sep 2025
      return d.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    } catch { return null; }
  };

  const renderItem = ({ item }) => {
    const isLiked = !!liked[item.id];
    const likeCount = item.likes + (isLiked ? 1 : 0);
    const dateStr = formatDate(item.createdAt);
    return (
      <View className="py-4 border-b border-[#EAEAEA]">
        <View className="px-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              {renderAvatar(40)}
              <Text className="ml-3 text-sm font-semibold text-[#2D2D2D]">{item.authorName}</Text>
            </View>
            <View style={{ width: 20 }} />
          </View>
        </View>
        {renderMedia(item)}
        <View className="px-4 flex-row items-center mt-3">
          <Pressable onPress={() => toggleLike(item.id)} hitSlop={10} disabled={likeBusy[item.id]} className="flex-row items-center mr-6">
            <Animated.View style={{ transform: [{ scale: getLikeAnim(item.id) }] }}>
              {isLiked ? (
                <Ionicons name="heart" size={22} color="#E53935" />
              ) : (
                <Ionicons name="heart-outline" size={22} color="#8B8B8B" />
              )}
            </Animated.View>
            <Text className="ml-2 text-sm font-semibold text-[#8B8B8B]">{likeCount}</Text>
          </Pressable>
          <View className="flex-row items-center">
            <Feather name="message-circle" size={22} color="#8B8B8B" />
            <Text className="ml-2 text-sm font-semibold text-[#8B8B8B]">{item.comments}</Text>
          </View>
        </View>
        <View className="px-4">
          {dateStr ? (
            <Text className="mt-3 text-[11px] uppercase tracking-wide text-[#999]">{dateStr}</Text>
          ) : null}
          <Text className="mt-1 text-sm text-[#757575]">{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F1F1F1]">
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <Image
            source={require('../../assets/images/logokiracolor.png')}
            className="w-[100px] h-[100px]"
            resizeMode="contain"
          />
          <View className="w-16 h-16 rounded-full overflow-hidden">
            <LinearGradient
              colors={["#2667A2", "#10BCE2", "#3ABD9C", "#3ED6AF"]}
              locations={[0, 0.32, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            >
              <View
                className="flex-1 m-1 bg-white rounded-full overflow-hidden"
                style={{ padding: StyleSheet.hairlineWidth }}
              >
                {imgError ? (
                  <View className="w-full h-full items-center justify-center rounded-full bg-white">
                    <Text className="text-xs text-gray-500">Foto</Text>
                  </View>
                ) : null}
                <Image
                  source={profileSrc}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        <View className="px-4 py-3 mt-1 border-t border-b border-[#C2C2C2] bg-transparent">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center'}}
          >
            <Text className="text-sm font-extrabold text-[#8B8B8B] mr-4">Categorias:</Text>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className="mr-4"
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategory === cat }}
              >
                <Text
                  className={
                    selectedCategory === cat
                      ? 'text-sm font-semibold text-[#2469A0]'
                      : 'text-sm font-semibold text-[#8B8B8B]'
                  }
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading && !refreshing ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator color="#2469A0" />
            <Text className="mt-3 text-[#2469A0] text-sm">Cargando posts...</Text>
          </View>
        ) : error ? (
          <View className="py-10 items-center justify-center">
            <Text className="text-red-600 text-sm mb-4 text-center">{error}</Text>
            <Pressable
              onPress={() => fetchPosts()}
              className="px-5 py-2 rounded-full"
              style={{ backgroundColor: '#2469A0' }}
            >
              <Text className="text-white font-semibold text-sm">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2469A0" />}
            ListEmptyComponent={!loading ? (
              <View className="py-14 items-center"><Text className="text-sm text-[#757575]">No hay posts para esta categoría.</Text></View>
            ) : null}
            contentContainerStyle={{ paddingBottom: (insets?.bottom ?? 0) + 200 }}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={fullImageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View className="flex-1 bg-black/95">
          <SafeAreaView edges={['top','bottom','left','right']} className="flex-1">
            <Pressable style={{ flex: 1 }} onPress={() => setFullImageVisible(false)}>
              <View className="flex-1 items-center justify-center px-4">
                {fullImageSource ? (
                  <Image source={fullImageSource} style={{ width: '100%', height: '85%' }} resizeMode="contain" />
                ) : null}
                <View className="absolute right-3 flex-row items-center" style={{ top: 8 }}>
                  <Pressable
                    onPress={saveCurrentImage}
                    className="p-2 mr-2"
                    hitSlop={10}
                    accessibilityLabel="Guardar imagen"
                  >
                    <Feather name="download" size={24} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    onPress={() => setFullImageVisible(false)}
                    className="p-2"
                    hitSlop={10}
                    accessibilityLabel="Cerrar imagen"
                  >
                    <Feather name="x" size={26} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={fullVideoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullVideoVisible(false)}
      >
        <View className="flex-1 bg-black/95">
          <SafeAreaView edges={['top','bottom','left','right']} className="flex-1">
            <View className="flex-row justify-end p-3 pt-4">
              <Pressable onPress={() => setFullVideoVisible(false)} hitSlop={10} accessibilityLabel="Cerrar video">
                <Feather name="x" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="flex-1 items-center justify-center px-4 pb-4">
              {fullVideoSource ? (
                <Video
                  source={fullVideoSource}
                  style={{ width: '100%', height: '85%' }}
                  resizeMode="contain"
                  useNativeControls
                  shouldPlay
                />
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Pressable
        onPress={() => setCreateVisible(true)}
        style={{ position: 'absolute', bottom: 40 + (insets?.bottom ?? 0), right: 24 }}
        accessibilityLabel="Crear post"
      >
        <LinearGradient
          colors={["#2667A2", "#10BCE2"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ padding: 18, borderRadius: 32, elevation: 4 }}
        >
          <Feather name="plus" size={26} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      <Modal
        visible={createVisible}
        animationType="slide"
        onRequestClose={() => !createBusy && setCreateVisible(false)}
        presentationStyle="fullScreen"
      >
        <View className="flex-1 bg-[#0D263A]">
          <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1">
            <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-white/10" style={{ paddingTop: (insets?.top ?? 0) + 4 }}>
              <Text className="text-white text-lg font-semibold">Nuevo Post</Text>
              <Pressable disabled={createBusy} onPress={() => setCreateVisible(false)} hitSlop={10}>
                <Feather name="x" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: (insets?.bottom ?? 0) + 100 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-white text-sm font-semibold mb-2">Archivo (imagen o video)</Text>
              <View className="flex-row mb-2">
                <Pressable
                  onPress={pickMedia}
                  className="px-4 py-2 rounded-full mr-3"
                  style={{ backgroundColor: '#10BCE2' }}
                >
                  <Text className="text-[#0D263A] font-semibold text-xs">Galería</Text>
                </Pressable>
                <Pressable
                  onPress={captureMedia}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: '#2469A0' }}
                >
                  <Text className="text-white font-semibold text-xs">Cámara</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={!createMedia ? pickMedia : undefined}
                className="h-40 rounded-xl border-2 border-dashed border-white/30 items-center justify-center mb-5 overflow-hidden"
              >
                {createMedia ? (
                  createMedia.isVideo ? (
                    <View style={{ width: '100%', height: '100%' }}>
                      <Video
                        key={createMedia.uri}
                        source={{ uri: createMedia.uri }}
                        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                        resizeMode="cover"
                        shouldPlay
                        isMuted
                        onPlaybackStatusUpdate={(status) => {
                          if (status?.isLoaded && status.positionMillis > 1200) {
                            // Stop playback after short preview
                            // We can't mutate status, use ref to pause if needed via shouldPlay prop toggle
                          }
                        }}
                      />
                      <View style={{ position: 'absolute', top: 6, right: 6 }}>
                        <Pressable
                          onPress={() => setCreateMedia(null)}
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                          hitSlop={10}
                        >
                          <Text className="text-white text-[11px] font-semibold">Quitar</Text>
                        </Pressable>
                      </View>
                      <View style={{ position: 'absolute', left: 6, bottom: 6, right: 6 }}>
                        <Text className="text-white text-[11px] font-semibold" numberOfLines={1}>{createMedia.name}</Text>
                        {createMedia.size ? (
                          <Text className="text-white/70 text-[10px] mt-1">
                            {(createMedia.size / (1024*1024)).toFixed(2)} MB
                          </Text>
                        ) : null}
                      </View>
                      {createMedia.size ? (
                        <View style={{ position: 'absolute', left: 6, bottom: 6 }}>
                          <Text className="text-white/80 text-[10px] bg-black/40 px-2 py-1 rounded-full">
                            {(createMedia.size / (1024*1024)).toFixed(2)} MB
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: createMedia.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={{ position: 'absolute', top: 6, right: 6 }}>
                        <Pressable
                          onPress={() => setCreateMedia(null)}
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                          hitSlop={10}
                        >
                          <Text className="text-white text-[11px] font-semibold">Quitar</Text>
                        </Pressable>
                      </View>
                    </View>
                  )
                ) : (
                  <Text className="text-white/70 text-sm text-center px-6">Toca para seleccionar una imagen o video</Text>
                )}
              </Pressable>
      {showToast && (
        <View style={{ position: 'absolute', top: 18 + (insets?.top ?? 0), left: 0, right: 0, alignItems: 'center', zIndex: 99 }} pointerEvents="none">
          <View className="px-6 py-3 rounded-full bg-[#10BCE2] shadow-lg">
            <Text className="text-[#0D263A] font-bold text-base">Post creado ✅</Text>
          </View>
        </View>
      )}

              <Text className="text-white text-sm font-semibold mb-2">Descripción</Text>
              <TextInput
                value={createDescription}
                onChangeText={setCreateDescription}
                placeholder="Describe tu post"
                placeholderTextColor="#94A3B8"
                multiline
                className="text-white p-4 rounded-xl mb-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', minHeight: 100, textAlignVertical: 'top' }}
              />

              <Text className="text-white text-sm font-semibold mb-2">Categoría</Text>
              <View className="flex-row flex-wrap mb-6">
                {['folklore','gastronomia','naturaleza','turismo'].map(cat => {
                  const active = createCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCreateCategory(cat)}
                      className="px-4 py-2 rounded-full mr-3 mb-3"
                      style={{ backgroundColor: active ? '#10BCE2' : 'rgba(255,255,255,0.12)' }}
                    >
                      <Text style={{ color: active ? '#0D263A' : '#FFFFFF' }} className="text-xs font-semibold uppercase">{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ height: 0, width: 0, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text>{userId}</Text>
              </View>

              {createError ? <Text className="text-red-400 text-sm mb-4">{createError}</Text> : null}

              <Pressable
                disabled={createBusy || !userId || !createDescription.trim() || !createMedia}
                onPress={submitCreatePost}
                className="rounded-full items-center justify-center"
                style={{ backgroundColor: createBusy || !userId || !createDescription.trim() || !createMedia ? '#1E3A55' : '#10BCE2', height: 54 }}
              >
                <Text className="text-[#0D263A] font-bold text-base">{createBusy ? 'Creando...' : 'Publicar'}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
