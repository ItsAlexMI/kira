import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function Avatar({ imgError, setImgError }) {
  const profileSrc = useMemo(
    () => (imgError ? require('../../assets/images/logokiracolor.png') : require('../../assets/images/fotoperfil.png')),
    [imgError]
  );
  return (
    <View style={{ width: 40, height: 40 }} className="rounded-full overflow-hidden">
      <Image
        source={profileSrc}
        className="w-full h-full rounded-full"
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    </View>
  );
}

export default function PostDetailScreen() {
  const [deleteCardVisible, setDeleteCardVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const DELETE_POST_API = 'https://kira-pink-theta.vercel.app/posts/eliminarPost';
  const handleDeletePost = async () => {
    if (!postId || !userId) return;
    setDeleteBusy(true);
    try {
      const payload = { idPost: String(postId), idUsuario: String(userId) };
      console.log('BORRAR POST payload:', payload);
      const res = await fetch(DELETE_POST_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      let raw = null; try { raw = await res.text(); } catch {}
      let json = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
      console.log('BORRAR POST response:', res.status, raw);
      if (!res.ok) {
        let msg = json?.message || raw || 'Error al borrar';
        throw new Error(msg);
      }
      setDeleteCardVisible(false);
      setConfirmDeleteVisible(false);
      router.back();
    } catch (e) {
      console.log('BORRAR POST error:', e);
      setError(e?.message || 'No se pudo borrar el post');
    } finally {
      setDeleteBusy(false);
    }
  };
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: postId } = useLocalSearchParams();

  const [post, setPost] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  const [userId, setUserId] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const likeAnim = useRef(new Animated.Value(1)).current;
  const [likeCount, setLikeCount] = useState(0);

  const API_URL = 'https://kira-pink-theta.vercel.app/posts/todos';
  const REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/reaccion';
  const REMOVE_REACTION_ENDPOINT = 'https://kira-pink-theta.vercel.app/posts/quitarReaccion';

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('kira.session');
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed?.idUsuario ?? parsed?.userId ?? parsed?.id;
        if (id) setUserId(String(id));
      }
    })();
  }, []);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setError('No se especificó un ID de post.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let postData = null;
      const resPost = await fetch(`https://kira-pink-theta.vercel.app/posts/obtenerPost/${postId}`);
      if (resPost.ok) postData = await resPost.json();
      if (!postData) throw new Error('Post no encontrado.');
      const isVideo = /\.(mp4|mov|m4v|webm|ogg)$/i.test(postData.link_archivo || '');
      const mapped = {
        id: String(postData.id),
        idUsuario: postData.idUsuario, 
        authorName: postData.usuario || 'Usuario',
        mediaUrl: postData.link_archivo || null,
        isVideo,
        likes: Number(postData.cantidad_reacciones) || 0,
        comments: Array.isArray(postData.comentarios) ? postData.comentarios.length : 0,
        description: postData.descripcion || '',
        createdAt: postData.fecha_creación || postData.fecha_creacion || null,
        comentarios: Array.isArray(postData.comentarios) ? postData.comentarios : [],
      };
      setPost(mapped);
      setLikeCount(Number(postData.cantidad_reacciones) || 0);
      let isLiked = false;
      if (userId) {
        try {
          const resLike = await fetch(`https://kira-pink-theta.vercel.app/posts/verificarLike?idPost=${postId}&idUsuario=${userId}`);
          if (resLike.ok) {
            const likeJson = await resLike.json();
            isLiked = !!likeJson.liked;
          }
        } catch {}
      }
      setLiked(isLiked);
    } catch (e) {
      setError(e.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => {
    setCommentsLoading(true);
    setCommentsError(null);
    if (post && Array.isArray(post.comentarios)) {
      setComments(post.comentarios);
      setCommentsLoading(false);
    } else {
      setComments([]);
      setCommentsLoading(false);
    }
  }, [post]);

  const COMMENTS_API = 'https://kira-pink-theta.vercel.app/posts/comentario';
  const DELETE_COMMENT_API = 'https://kira-pink-theta.vercel.app/posts/quitarComentario';
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
      await fetchPost();
    } catch (e) {
      setCommentsError('No se pudo borrar el comentario');
    }
  };
  const submitComment = async () => {
    if (!userId) return setCommentsError('Debes iniciar sesión');
    if (!commentText.trim()) return;
    setCommentBusy(true);
    setCommentsError(null);
    try {
      const payload = {
        idPost: Number(postId),
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
      await fetchPost();
    } catch (e) {
      setCommentsError(e?.message || 'No se pudo comentar');
    } finally {
      setCommentBusy(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const toggleLike = async () => {
    if (likeBusy || !userId || !post) return;
    setLikeBusy(true);
    setLiked((prev) => !prev);
    likeAnim.setValue(0.9);
    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
      Animated.spring(likeAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    try {
      const endpoint = liked ? REMOVE_REACTION_ENDPOINT : REACTION_ENDPOINT;
      const payload = { idUsuario: String(userId), idPost: String(postId) };
      console.log('LIKE payload:', payload, 'endpoint:', endpoint);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let raw = null; try { raw = await res.text(); } catch {}
      console.log('LIKE response:', res.status, raw);
  const resPost = await fetch(`https://kira-pink-theta.vercel.app/posts/obtenerPost/${postId}`);
  let postData = null;
  if (resPost.ok) postData = await resPost.json();
  setLikeCount(postData ? Number(postData.cantidad_reacciones) || 0 : likeCount);
  await fetchPost();
    } catch (e) {
      console.log('LIKE error:', e);
      setError('No se pudo actualizar el like.');
      await fetchPost();
    } finally {
      setLikeBusy(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return null; }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F1F1F1]">
        <ActivityIndicator color="#2469A0" size="large" />
        <Text className="mt-3 text-[#2469A0] text-sm">Cargando post...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F1F1' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <Pressable onPress={() => router.back()} className="px-5 py-2 rounded-full bg-[#2469A0]">
            <Text className="text-white font-semibold">Regresar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) return null;

  return (
    <View className="flex-1 bg-[#F1F1F1]">
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={28} color="#2469A0" />
          </Pressable>
          <Text className="text-lg font-bold text-[#2469A0]">Publicación</Text>
          {post && userId && String(post.idUsuario) === String(userId) ? (
            <Pressable onPress={() => setDeleteCardVisible(true)} hitSlop={10}>
              <Feather name="more-vertical" size={26} color="#2469A0" />
            </Pressable>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>
      <Modal
        visible={deleteCardVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDeleteCardVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl shadow-2xl p-6 pb-8" style={{ minHeight: 140 }}>
            <Text className="text-lg font-bold text-[#E53935] mb-4">Opciones</Text>
            <Pressable
              onPress={() => { setDeleteCardVisible(false); setConfirmDeleteVisible(true); }}
              className="flex-row items-center mb-2"
              style={{ paddingVertical: 12 }}
            >
              <Feather name="trash-2" size={22} color="#E53935" />
              <Text className="ml-3 text-base text-[#E53935] font-semibold">Borrar publicación</Text>
            </Pressable>
            <Pressable onPress={() => setDeleteCardVisible(false)} className="mt-2">
              <Text className="text-[#2469A0] text-base font-semibold">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmDeleteVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="bg-white rounded-2xl p-8 w-80 shadow-2xl">
            <Text className="text-lg font-bold text-[#E53935] mb-4">¿Seguro que quieres borrar?</Text>
            <Text className="text-[#2D2D2D] mb-6">Esta acción no se puede deshacer.</Text>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setConfirmDeleteVisible(false)}
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

        <View className="py-4 border-b border-t border-[#EAEAEA] bg-white">
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Avatar imgError={imgError} setImgError={setImgError} />
                <Text className="ml-3 text-sm font-semibold text-[#2D2D2D]">{post.authorName}</Text>
              </View>
            </View>
          </View>

          {post.mediaUrl && (
            post.isVideo ? (
              <View style={{ width: '100%', height: 288, backgroundColor: '#000' }}>
                <Video
                  source={{ uri: post.mediaUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  useNativeControls
                  shouldPlay={false}
                />
              </View>
            ) : (
              <Image
                source={{ uri: post.mediaUrl }}
                style={{ width: '100%', height: 288 }}
                resizeMode="cover"
              />
            )
          )}

          <View className="px-4 flex-row items-center mt-3">
            <Pressable onPress={toggleLike} hitSlop={10} disabled={likeBusy} className="flex-row items-center mr-6">
              <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#E53935" : "#8B8B8B"} />
              </Animated.View>
              <Text className="ml-2 text-sm font-semibold text-[#8B8B8B]">{likeCount}</Text>
            </Pressable>
            <View className="flex-row items-center">
              <Feather name="message-circle" size={22} color="#2469A0" />
              <Text className="ml-2 text-sm font-semibold text-[#2469A0]">{post.comments}</Text>
            </View>
          </View>

          <View className="px-4 mt-2">
            {post.createdAt && (
              <Text className="mt-3 text-[11px] uppercase tracking-wide text-[#999]">{formatDate(post.createdAt)}</Text>
            )}
            <Text className="mt-1 text-sm text-[#757575]">{post.description}</Text>
          </View>
        </View>

        <View className="flex-1 bg-white px-4 pt-4" style={{ borderTopWidth: 1, borderColor: '#EAEAEA' }}>
          <Text className="text-lg font-bold text-[#2469A0] mb-2">Comentarios</Text>
          {commentsLoading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator color="#2469A0" />
              <Text className="mt-2 text-[#2469A0] text-sm">Cargando comentarios...</Text>
            </View>
          ) : commentsError ? (
            <View className="py-8 items-center justify-center">
              <Text className="text-red-600 text-sm mb-2 text-center">{commentsError}</Text>
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
      </SafeAreaView>
    </View>
  );
}
