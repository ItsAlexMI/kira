import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { downloadAsync } from 'expo-file-system/legacy';
import { manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/reaccion';
const REMOVE_REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/quitarReaccion';

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
  const [deleteCardVisible, setDeleteCardVisible] = useState(false);
  const [deleteTargetPost, setDeleteTargetPost] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const DELETE_POST_API = 'https://kira-pink-theta.vercel.app/posts/eliminarPost';
  const handleDeletePost = async () => {
    if (!deleteTargetPost || !userId) return;
    setDeleteBusy(true);
    try {
      const payload = { idPost: String(deleteTargetPost.id), idUsuario: String(userId) };
      const res = await fetch(DELETE_POST_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok) {
        let msg = json?.message || raw || 'Error al borrar';
        throw new Error(msg);
      }
      setDeleteCardVisible(false);
      setConfirmDeleteVisible(false);
      setDeleteTargetPost(null);
      fetchPosts();
    } catch (e) {
      setError(e?.message || 'No se pudo borrar el post');
    } finally {
      setDeleteBusy(false);
    }
  };
  const [liked, setLiked] = useState({}); // id -> bool (API)
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
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const COMMENTS_API = 'https://kira-pink-theta.vercel.app/posts/comentario';
  const DELETE_COMMENT_API = 'https://kira-pink-theta.vercel.app/posts/quitarComentario';
  const GET_POST_API = 'https://kira-pink-theta.vercel.app/posts/obtenerPost';

  const fetchComments = async (postId) => {
  const handleDeleteComment = async (idComentario) => {
    if (!userId || !idComentario) return;
    try {
      const payload = { idComentario: String(idComentario), idUsuario: String(userId) };
      const res = await fetch(DELETE_COMMENT_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok || !json?.success) {
        setCommentsError(json?.message || raw || 'Error al borrar comentario');
        return;
      }
      fetchComments(commentsPostId);
    } catch (e) {
      setCommentsError('No se pudo borrar el comentario');
    }
  };
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const res = await fetch(`${GET_POST_API}/${postId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Error al obtener comentarios');
      setComments(Array.isArray(json.comentarios) ? json.comentarios : []);
    } catch (e) {
      setCommentsError(e?.message || 'Error de red');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const openComments = (postId) => {
    setCommentsPostId(postId);
    setCommentsVisible(true);
    setCommentText('');
    fetchComments(postId);
  };

  const closeComments = () => {
    setCommentsVisible(false);
    setCommentsPostId(null);
    setComments([]);
    setCommentText('');
    setCommentsError(null);
  };

  const submitComment = async () => {
    if (!userId) return setCommentsError('Debes iniciar sesión');
    if (!commentText.trim()) return;
    setCommentBusy(true);
    setCommentsError(null);
    try {
      const payload = {
        idPost: Number(commentsPostId),
        idUsuario: Number(userId),
        texto: commentText.trim(),
      };
      const res = await fetch(COMMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok) {
        let msg = json?.message || raw || 'Error al comentar';
        throw new Error(msg);
      }
      setCommentText('');
      fetchComments(commentsPostId);
    } catch (e) {
      setCommentsError(e?.message || 'No se pudo comentar');
    } finally {
      setCommentBusy(false);
    }
  };

  const CREATE_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/create';

  const inferMimeAndName = (asset) => {
    const uri = asset?.uri || '';
    const isVideo = asset?.type === 'video';
    const lastSeg = uri.split('?')[0].split('/').pop() || '';
    let ext = (lastSeg.includes('.') ? lastSeg.split('.').pop() : '').toLowerCase();
    if (!ext) {
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
    if (name && !/\.[a-zA-Z0-9]{2,4}$/.test(name) && ext) name += `.${ext}`;
    return { mime, name, ext, isVideo };
  };


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
        let serverMsg = json?.message || json?.error || raw || 'Error al crear post';
        let errorDetails = `\nCódigo: ${res.status}`;
        if (typeof serverMsg === 'object') {
          const firstVal = Object.values(serverMsg).find(v => typeof v === 'string');
          serverMsg = firstVal || JSON.stringify(serverMsg);
        }
        if (res.status === 413) {
          const sizeInfo = createMedia?.size ? ` (${(createMedia.size/(1024*1024)).toFixed(2)}MB)` : '';
          throw new Error(`El video es muy grande${sizeInfo}.\n${serverMsg}${errorDetails}`);
        }
        throw new Error(`${serverMsg}${errorDetails}`);
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
            setUserId(String(candidate));
            try {
              const stored = await AsyncStorage.getItem(LIKE_STORE_KEY(String(candidate)));
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
      let likedMap = {};
      let mapped = await Promise.all(normalized.map(async (p) => {
        let postData = p;
        try {
          const resPost = await fetch(`https://kira-pink-theta.vercel.app/posts/obtenerPost/${p.id}`);
          if (resPost.ok) {
            postData = await resPost.json();
          }
        } catch {}
        let isLiked = false;
        if (userId) {
          try {
            const resLike = await fetch(`https://kira-pink-theta.vercel.app/posts/verificarLike?idPost=${p.id}&idUsuario=${userId}`);
            if (resLike.ok) {
              const likeJson = await resLike.json();
              isLiked = !!likeJson.liked;
            }
          } catch {}
        }
        likedMap[p.id] = isLiked;
        const link = postData.link_archivo || null;
        const video = link && isVideoUrl(link);
        const rawDate = postData.fecha_creación || postData.fecha_creacion || postData.createdAt || postData.created_at || null;
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
          id: String(postData.id),
          idUsuario: postData.idUsuario ? String(postData.idUsuario) : '',
          authorName: postData.usuario || 'Usuario',
          authorEmail: null,
          mediaUrl: link,
          isVideo: !!video,
          likes: Number(postData.cantidad_reacciones) || 0,
          comments: Array.isArray(postData.comentarios) ? postData.comentarios.length : 0,
          description: postData.descripcion || '',
          tipo: (postData.tipo || '').toLowerCase(),
          createdAt,
          createdAtMs,
        };
      }));
      mapped.sort((a,b) => {
        if (a.createdAtMs && b.createdAtMs) return b.createdAtMs - a.createdAtMs;
        if (a.createdAtMs) return -1;
        if (b.createdAtMs) return 1;
        return 0;
      });
      setPosts(mapped);
      setLiked(likedMap);
    } catch (e) {
      setError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

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

  const REMOVE_REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/quitarReaccion';

  const sendLikeToApi = async ({ idPost }) => {
    if (userId == null) return { ok: false, reason: 'no-user' };
    try {
      const payload = { idUsuario: String(userId), idPost: String(idPost) };
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

  const sendDislikeToApi = async ({ idPost }) => {
    if (userId == null) return { ok: false, reason: 'no-user' };
    try {
      const payload = { idUsuario: String(userId), idPost: String(idPost) };
      const res = await fetch(REMOVE_REACTION_ENDPOINT, {
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
    setLikeBusy((prev) => ({ ...prev, [postId]: true }));
    const previous = !!liked[postId];
    setLiked((prev) => ({ ...prev, [postId]: !previous }));
    const anim = getLikeAnim(postId);
    anim.setValue(0.9);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    try {
      const endpoint = previous ? REMOVE_REACTION_ENDPOINT : REACTION_ENDPOINT;
      const payload = { idUsuario: String(userId), idPost: String(postId) };
      console.log('LIKE payload:', payload, 'endpoint:', endpoint);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      let raw = null; try { raw = await res.text(); } catch {}
      console.log('LIKE response:', res.status, raw);
      try {
        const resPost = await fetch(`https://kira-pink-theta.vercel.app/posts/obtenerPost/${postId}`);
        let postData = null;
        if (resPost.ok) postData = await resPost.json();
        setPosts((prev) => prev.map(p => p.id === String(postId) ? {
          ...p,
          likes: postData ? Number(postData.cantidad_reacciones) || 0 : p.likes,
        } : p));
        const resLike = await fetch(`https://kira-pink-theta.vercel.app/posts/verificarLike?idPost=${postId}&idUsuario=${String(userId)}`);
        let likeJson = null;
        if (resLike.ok) likeJson = await resLike.json();
        setLiked((prev) => ({ ...prev, [postId]: likeJson ? !!likeJson.liked : false }));
      } catch {}
    } catch (e) {
      console.log('LIKE error:', e);
      setError('No se pudo actualizar el like.');
    } finally {
      setLikeBusy((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const saveCurrentImage = async () => {
    if (!fullImageSource) {
      Alert.alert('Error', 'No hay imagen para guardar.');
      return;
    }
    console.log('saveCurrentImage: Starting save for', fullImageSource);
    const perm = await MediaLibrary.requestPermissionsAsync();
    console.log('saveCurrentImage: Permissions granted?', perm.granted);
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para guardar imágenes.');
      return;
    }
    try {
      let localUri = null;
      if (typeof fullImageSource === 'number') {
        console.log('saveCurrentImage: Handling local asset');
        const asset = Asset.fromModule(fullImageSource);
        await asset.downloadAsync();
        localUri = asset.localUri || asset.uri;
        console.log('saveCurrentImage: Local asset URI', localUri);
      } else if (fullImageSource?.uri) {
        console.log('saveCurrentImage: Downloading remote image from', fullImageSource.uri);
        const downloadRes = await downloadAsync(fullImageSource.uri, FileSystem.cacheDirectory + `temp-${Date.now()}`);
        console.log('saveCurrentImage: Download result', downloadRes);
        if (downloadRes.status !== 200) {
          throw new Error(`Download failed with status ${downloadRes.status}`);
        }
        let ext = 'jpg';
        if (downloadRes.mimeType === 'image/webp') ext = 'webp';
        else if (downloadRes.mimeType === 'image/png') ext = 'png';
        else if (downloadRes.mimeType === 'image/jpeg' || downloadRes.mimeType === 'image/jpg') ext = 'jpg';
        const fileName = `image-${Date.now()}.${ext}`;
        const finalUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.moveAsync({ from: downloadRes.uri, to: finalUri });
        localUri = finalUri;
        if (ext === 'webp') {
          console.log('saveCurrentImage: Converting webp to jpg');
          const manipulated = await manipulateAsync(localUri, [], { format: 'jpeg' });
          localUri = manipulated.uri;
          console.log('saveCurrentImage: Converted to', localUri);
        }
      }
      if (!localUri) {
        throw new Error('No se pudo obtener la URI local de la imagen');
      }
      console.log('saveCurrentImage: Saving to library', localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      console.log('saveCurrentImage: Saved successfully');
      Alert.alert('Guardado', 'La imagen se guardó en tu galería.');
    } catch (e) {
      console.error('saveCurrentImage: Error saving image', e);
      Alert.alert('Error', `No se pudo guardar la imagen: ${e.message || e.toString()}`);
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

  const renderItem = ({ item }) => {
    const isMine = userId === item.idUsuario;
    const likeAnim = getLikeAnim(item.id);
    return (
    <View className="rounded-2xl mb-4 overflow-hidden border-b border-[#EAEAEA]">
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center">
            {renderAvatar(40)}
            <View className="ml-3">
              <Text className="text-[#2469A0] font-semibold">{item.authorName}</Text>
            </View>
          </View>
          {isMine ? (
            <Pressable
              onPress={() => {
                setDeleteCardVisible(true);
                setDeleteTargetPost(item);
              }}
              hitSlop={10}
              accessibilityLabel="Borrar publicación"
            >
              <Feather name="trash-2" size={24} color="#E53935" />
            </Pressable>
          ) : null}
        </View>

        {renderMedia(item)}

        <View className="px-4 pb-4 pt-2">
          <Text className="text-[#999] text-xs mb-1">{formatDate(item.createdAt)}</Text>
          {item.tipo ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Text className="text-xs font-semibold text-[#10BCE2] bg-[#E1F5FE] rounded-full px-3 py-1 mb-2">
                {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
              </Text>
            </View>
          ) : null}
          <Text className="text-[#757575] text-sm mb-2">{item.description}</Text>
          <View className="flex-row items-center mt-2">
            <Pressable
              onPress={() => toggleLike(item.id)}
              disabled={likeBusy[item.id]}
              className="flex-row items-center"
              hitSlop={10}
              accessibilityLabel={liked[item.id] ? 'Quitar me gusta' : 'Dar me gusta'}
            >
              {liked[item.id] ? (
                <Ionicons name="heart" size={22} color="#E53935" />
              ) : (
                <Ionicons name="heart-outline" size={22} color="#8B8B8B" />
              )}
              <Text className="ml-2 text-sm font-semibold text-[#8B8B8B]">{item.likes}</Text>
            </Pressable>
            <Pressable
              onPress={() => openComments(item.id)}
              className="flex-row items-center ml-6"
              hitSlop={10}
              accessibilityLabel="Ver comentarios"
            >
              <Feather name="message-circle" size={22} color="#8B8B8B" />
              <Text className="ml-2 text-sm font-semibold text-[#8B8B8B]">{item.comments}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    return filteredPosts.slice(start, end);
  }, [filteredPosts, currentPage]);

  return (
    <View className="flex-1 bg-[#F1F1F1]">
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <Image
            source={require('../../assets/images/logokiracolor.png')}
            className="w-[100px] h-[100px]"
            resizeMode="contain"
          />
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ir a perfil"
            className="w-16 h-16 rounded-full overflow-hidden"
          >
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
          </Pressable>
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
            data={paginatedPosts}
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
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeComments}
      >
        <View className="flex-1 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-white rounded-t-3xl shadow-2xl p-5 pb-0" style={{ minHeight: 380, maxHeight: '80%' }}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-bold text-[#2469A0]">Comentarios</Text>
                <Pressable onPress={closeComments} hitSlop={10}>
                  <Feather name="x" size={28} color="#2469A0" />
                </Pressable>
              </View>
              {commentsLoading ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator color="#2469A0" />
                  <Text className="mt-2 text-[#2469A0] text-sm">Cargando comentarios...</Text>
                </View>
              ) : commentsError ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-red-600 text-sm mb-2 text-center">{commentsError}</Text>
                  <Pressable onPress={() => fetchComments(commentsPostId)} className="px-5 py-2 rounded-full" style={{ backgroundColor: '#2469A0' }}>
                    <Text className="text-white font-semibold text-sm">Reintentar</Text>
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(c, idx) => String(c.id || idx)}
                  renderItem={({ item }) => (
                    <View className="flex-row items-start mb-4">
                      <View className="w-9 h-9 rounded-full bg-[#EAEAEA] items-center justify-center mr-3 overflow-hidden">
                        <Image source={require('../../assets/images/fotoperfil.png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[#2469A0] font-semibold text-sm mb-1">
                            {item.autor ? item.autor : `Usuario ${item.idUsuario || ''}`}
                          </Text>
                          {String(item.idUsuario) === String(userId) ? (
                            <Pressable onPress={() => handleDeleteComment(item.id)} hitSlop={10} style={{ marginLeft: 8 }}>
                              <Feather name="trash-2" size={18} color="#E53935" />
                            </Pressable>
                          ) : null}
                        </View>
                        <Text className="text-[#2D2D2D] text-sm">{item.texto}</Text>
                        {item.fecha_creacion ? (
                          <Text className="text-[11px] text-[#999] mt-1">{formatDate(item.fecha_creacion)}</Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={<View className="py-8 items-center"><Text className="text-[#757575] text-sm">Sé el primero en comentar.</Text></View>}
                  style={{ maxHeight: 220 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                />
              )}
              <View className="border-t border-[#EAEAEA] pt-3 pb-6">
                <View className="flex-row items-center">
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder={userId ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
                    placeholderTextColor="#94A3B8"
                    className="flex-1 bg-[#F1F1F1] rounded-full px-4 py-3 text-[#2469A0] text-sm"
                    editable={!!userId && !commentBusy}
                  />
                  <Pressable
                    onPress={submitComment}
                    disabled={commentBusy || !userId || !commentText.trim()}
                    className="ml-2 px-4 py-3 rounded-full"
                    style={{ backgroundColor: commentBusy || !userId || !commentText.trim() ? '#EAEAEA' : '#10BCE2' }}
                  >
                    <Feather name="send" size={20} color={commentBusy || !userId || !commentText.trim() ? '#8B8B8B' : '#fff'} />
                  </Pressable>
                </View>
                {commentsError && <Text className="text-red-500 text-xs mt-2">{commentsError}</Text>}
              </View>
            </View>
          </KeyboardAvoidingView>
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

      <SafeAreaView pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, right: 0, left: 0 }}>
        <View style={{ position: 'absolute', right: 24, bottom: Math.max((insets?.bottom ?? 0) + 48, 48) }}>
          <Pressable
            onPress={() => setCreateVisible(true)}
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
        </View>
      </SafeAreaView>

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

      <Modal
        visible={deleteCardVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteCardVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="bg-white rounded-2xl p-8 w-80 shadow-2xl">
            <Text className="text-lg font-bold text-[#E53935] mb-4">¿Seguro que quieres borrar?</Text>
            <Text className="text-[#2D2D2D] mb-6">Esta acción no se puede deshacer.</Text>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setDeleteCardVisible(false)}
                className="px-5 py-2 rounded-full"
                style={{ backgroundColor: '#EAEAEA' }}
                disabled={deleteBusy}
              >
                <Text className="text-[#2469A0] font-semibold">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeletePost}
                className="px-5 py-2 rounded-full ml-3"
                style={{ backgroundColor: '#E53935' }}
                disabled={deleteBusy}
              >
                <Text className="text-white font-semibold">Borrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  } catch {
    return '';
  }
}
