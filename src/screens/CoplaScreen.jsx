import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { router } from 'expo-router';
import { ChevronLeft, FilePenLine, PencilLine } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveUserId, submitCoplaScore } from '../utils/api';

export default function CoplaScreen() {
  const [username, setUsername] = React.useState('usuario');
  const [points, setPoints] = React.useState(0);
  const [attemptedFallback, setAttemptedFallback] = React.useState(false);
  const [videoSource, setVideoSource] = React.useState(
    require('../../assets/images/videocopla.mp4')
  );
  const [loadingCoplas, setLoadingCoplas] = React.useState(true);
  const [coplaQuestions, setCoplaQuestions] = React.useState([]); 
  const [fetchError, setFetchError] = React.useState(null);
  const COPLA_ID = 1; 
  const [questionStatus, setQuestionStatus] = React.useState({}); 
  const [scored, setScored] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [activeQuestion, setActiveQuestion] = React.useState(null); 
  const [answerText, setAnswerText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [userIdRef, setUserIdRef] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null); 

  React.useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 1800);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const statusKey = (user) => `kira.copla.${COPLA_ID}.status.${user || 'anon'}`;
  const scoreKey = (user) => `kira.copla.${COPLA_ID}.scored.${user || 'anon'}`;

  const loadPersistence = async (user) => {
    try {
      const rawStatus = await AsyncStorage.getItem(statusKey(user));
      const rawScore = await AsyncStorage.getItem(scoreKey(user));
      if (rawStatus) setQuestionStatus(JSON.parse(rawStatus));
      if (rawScore === '1') setScored(true);
    } catch {}
  };

  const persistStatus = async (user, next) => {
    try { await AsyncStorage.setItem(statusKey(user), JSON.stringify(next)); } catch {}
  };
  const persistScored = async (user) => {
    try { await AsyncStorage.setItem(scoreKey(user), '1'); } catch {}
  };
  const screenWidth = Dimensions.get('screen').width;
  const videoHeight = Math.max(240, Math.round((screenWidth * 9) / 16));

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('kira.session');
        if (raw) {
          const parsed = JSON.parse(raw);
          const rid = resolveUserId(parsed);
          const uid = (() => {
            if (rid != null) {
              const num = Number(rid);
              return Number.isFinite(num) ? num : rid;
            }
            return 'usuario';
          })();
          setUserIdRef(uid);
          loadPersistence(uid);
          try {
            const res = await fetch(`https://kira-pink-theta.vercel.app/users/nombreUsuario/${uid}`);
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
            const resScore = await fetch(`https://kira-pink-theta.vercel.app/users/puntajeUsuario/${uid}`);
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
      } catch {
        setUsername('usuario');
      }
      setPoints(0);
    })();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingCoplas(true);
      setFetchError(null);
      try {
        const res = await fetch('https://kira-pink-theta.vercel.app/actividades/coplas');
        if (!res.ok) throw new Error('Status ' + res.status);
        const data = await res.json();
        let preguntas = [];
        if (Array.isArray(data)) {
          const firstLayer = data[0];
          const coplasArr = firstLayer?.coplas || [];
            const target = coplasArr.find(c => c.id === COPLA_ID) || coplasArr[0];
            if (target?.preguntas) {
              preguntas = target.preguntas.map(q => ({
                id: q.id,
                pregunta: q.pregunta || '',
                respuesta: (q.respuestas && q.respuestas[0]?.texto_respuesta) ? q.respuestas[0].texto_respuesta : ''
              }));
            }
        }
        if (!cancelled) {
          setCoplaQuestions(preguntas);
        }
      } catch (e) {
        if (!cancelled) setFetchError(e.message || 'Error');
      } finally {
        if (!cancelled) setLoadingCoplas(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);



  return (
    <View className="flex-1 bg-[#F1F1F1]">
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

      <ScrollView className="mt-3" contentContainerStyle={{ paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
      <View className="px-4">
        <View className="bg-white rounded-2xl p-3 shadow" style={{ elevation: 2 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center shrink">
              <Image
                source={require('../../assets/images/fotoperfil.png')}
                className="w-16 h-16 rounded-full mr-3"
                resizeMode="cover"
              />
              <View className="shrink">
                <Text className="text-[#8B8B8B] text-sm font-semibold" numberOfLines={1}>
                  {username}, vamos a por mas...
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

      <View className="mt-5 items-center px-4">
        <View className="bg-white rounded-full px-5 py-3 shadow items-center" style={{ elevation: 3 }}>
          <Text className="text-[#2469A0] font-extrabold text-base">Escucha y completa la copla</Text>
        </View>
      </View>

      <View className="mt-5 px-4" style={{ width: '100%' }}>
        <Video
          source={videoSource}
          style={{ width: '100%', height: videoHeight, backgroundColor: '#000' }}
          resizeMode="contain"
          useNativeControls
          shouldPlay
        />
        {attemptedFallback ? (
          <Text className="text-center text-gray-500 mt-2">
            El video original no pudo reproducirse. Mostrando uno de prueba.
          </Text>
        ) : null}
      </View>

      <View className="mt-6 px-4">
            {loadingCoplas ? (
              <Text className="text-center text-gray-500">Cargando coplas...</Text>
            ) : fetchError ? (
              <Text className="text-center text-red-500">Error: {fetchError}</Text>
            ) : coplaQuestions.length === 0 ? (
              <Text className="text-center text-gray-500">No hay preguntas.</Text>
            ) : (
              coplaQuestions.map((q, idx) => {
                const colors = ['#FEBA69', '#6EB464', '#3ABD9C', '#2469A0'];
                const color = colors[idx % colors.length];
                const status = questionStatus[q.id];
                const disabled = status === 'correct' || status === 'failed';
                return (
                  <TouchableOpacity
                    key={q.id}
                    activeOpacity={0.8}
                    disabled={disabled}
                    onPress={() => {
                      setActiveQuestion({ ...q, color });
                      setAnswerText('');
                      setModalVisible(true);
                    }}
                    className="w-full rounded-3xl mb-5 relative"
                    style={{ backgroundColor: '#FFFFFF', opacity: disabled ? 0.6 : 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
                  >
                    <Text className="absolute top-3 right-4 font-bold text-[14px]" style={{ color: '#A49E9E' }}>+50pts</Text>
                    <View className="flex-row px-5 py-5 items-center">
                      <View
                        className="w-16 h-16 rounded-2xl items-center justify-center mr-5"
                        style={{ backgroundColor: color }}
                      >
                        <FilePenLine color="#FFFFFF" size={36} strokeWidth={2.5} />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text numberOfLines={2} className="text-lg font-extrabold" style={{ color }}>
                          Bomba bomba, cuete cuete...
                        </Text>
                        {status === 'correct' && (
                          <Text className="mt-2 text-green-600 text-sm font-semibold">Correcto</Text>
                        )}
                        {status === 'failed' && (
                          <Text className="mt-2 text-red-500 text-sm font-semibold">Incorrecto</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
      </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View
            className="bg-white rounded-3xl"
            style={{
              paddingHorizontal: 28,
              paddingTop: 58,
              paddingBottom: 34,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
              minHeight: 360,
              width: '100%'
            }}
          >
            {activeQuestion && (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: -46, left: 0, right: 0, alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 9999,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 4,
                    borderColor: activeQuestion.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 5
                  }}
                >
                  <Image
                    source={require('../../assets/images/tambor.png')}
                    style={{ width: 70, height: 70, resizeMode: 'contain' }}
                  />
                </View>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              accessibilityLabel="Cerrar"
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-gray-700 text-2xl font-bold">×</Text>
            </TouchableOpacity>
            {activeQuestion && (
              <>
                <Text
                  className="text-2xl font-extrabold mb-7 text-center"
                  style={{ color: activeQuestion.color, lineHeight: 32, marginTop: 4 }}
                >
                  {activeQuestion.pregunta}
                </Text>
                <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-6">
                  <PencilLine size={22} color={activeQuestion.color} strokeWidth={2.5} className="mr-3" />
                  <TextInput
                    value={answerText}
                    onChangeText={setAnswerText}
                    placeholder="Tu respuesta..."
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-base"
                    style={{ paddingVertical: 2 }}
                  />
                </View>
                <TouchableOpacity
                  disabled={submitting || !answerText.trim()}
                  onPress={async () => {
                    if (!activeQuestion) return;
                    const normalize = (s) => s
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/\p{Diacritic}/gu, '')
                      .replace(/\s+/g, ' ') 
                      .trim();
                    const userAns = normalize(answerText);
                    const correctAns = normalize(activeQuestion.respuesta || '');
                    const userKey = userIdRef || 'anon';
                    setSubmitting(true);
                    try {
                      if (userAns === correctAns) {
                        const next = { ...questionStatus, [activeQuestion.id]: 'correct' };
                        setQuestionStatus(next);
                        persistStatus(userKey, next);
                        if (!scored) {
                          try {
                            console.log('[Copla] Submitting copla score', { COPLA_ID, userKey });
                            const result = await submitCoplaScore(COPLA_ID, userKey);
                            console.log('[Copla] Submit result =>', result);
                            if (result.ok && result.data?.message && !result.data?.error) {
                              setScored(true);
                              persistScored(userKey);
                              setPoints(p => p + 50);
                            }
                          } catch (e) {
                            console.log('[Copla] Submit error', e);
                          }
                        }
                        setFeedback({ type: 'success', message: '¡Correcto!', color: activeQuestion.color });
                      } else {
                        const next = { ...questionStatus, [activeQuestion.id]: 'failed' };
                        setQuestionStatus(next);
                        persistStatus(userKey, next);
                        setFeedback({ type: 'error', message: 'Incorrecto', color: '#DC2626' });
                      }
                      setModalVisible(false);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="rounded-2xl py-3 items-center"
                  style={{ backgroundColor: activeQuestion.color, opacity: submitting || !answerText.trim() ? 0.6 : 1 }}
                >
                  <Text className="text-white font-bold text-base">
                    {submitting ? 'Enviando...' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {feedback && (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View
            className="px-10 py-6 rounded-3xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.97)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Text
              className="text-3xl font-extrabold text-center"
              style={{ color: feedback.type === 'success' ? feedback.color : feedback.color }}
            >
              {feedback.message}
            </Text>
          </View>
        </View>
      )}
        <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-[#D9D9D9]">
              <Text className="text-center text-[#797979] font-semibold py-2">Más coplas pronto...</Text>
            </SafeAreaView>
    </View>
    
  );
}
