import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Animated, Easing, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveUserId, submitQuizScore } from '../utils/api';

export default function GastronomiaQuizScreen() {
  const QUIZ_ID = 4;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [quiz, setQuiz] = React.useState(null);
  const [idx, setIdx] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [userId, setUserId] = React.useState(null);
  const [completed, setCompleted] = React.useState(false);
  const [submitInfo, setSubmitInfo] = React.useState(null);
  const [storedResult, setStoredResult] = React.useState(null);
  const [finalResult, setFinalResult] = React.useState(null);
  const progressWidth = React.useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = React.useState(0);
  const feedbackScale = React.useRef(new Animated.Value(0)).current;
  const resultOpacity = React.useRef(new Animated.Value(0)).current;
  const resultTranslate = React.useRef(new Animated.Value(30)).current;

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        let alreadyCompleted = false;
        let uid = null;
        try {
          const raw = await AsyncStorage.getItem('kira.session');
          if (raw) {
            const parsed = JSON.parse(raw);
            const rid = resolveUserId(parsed);
            if (rid != null) {
              const numeric = Number(rid);
              uid = Number.isFinite(numeric) ? numeric : rid;
              if (mounted) setUserId(uid);
              console.log('[GastronomiaQuiz] Resolved user id =>', uid);
            } else {
              console.log('[GastronomiaQuiz] No user id found in session');
            }
          }
        } catch {}
        try {
          const key = `kira.quiz.completed.${QUIZ_ID}.${uid ?? 'anon'}`;
          const done = await AsyncStorage.getItem(key);
          if (done === 'true') {
            if (mounted) setCompleted(true);
            alreadyCompleted = true;
            try {
              const statsRaw = await AsyncStorage.getItem(`kira.quiz.result.${QUIZ_ID}.${uid ?? 'anon'}`);
              if (statsRaw) {
                const stats = JSON.parse(statsRaw);
                if (mounted) setStoredResult(stats);
                if (mounted) setFinalResult(stats);
                if (typeof stats?.correct === 'number' && mounted) setCorrectCount(stats.correct);
              }
            } catch {}
          } else {
            if (mounted) setCompleted(false);
          }
        } catch {}
        try {
          if (mounted) setLoading(true);
          const res = await fetch(`https://kira-pink-theta.vercel.app/actividades/obtenerCuestionario/${QUIZ_ID}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json?.message || 'No se pudo obtener el cuestionario');
          const normalizeQuiz = (payload) => {
            let root = payload;
            if (root?.data) root = root.data;
            if (Array.isArray(root)) {
              const item = root.find((x) => x && (x.cuestionario || x.preguntas)) || root[0];
              root = item?.cuestionario ?? item;
            }
            if (root?.cuestionario) root = root.cuestionario;
            const preguntas = Array.isArray(root?.preguntas) ? root.preguntas : [];
            return {
              titulo: root?.titulo ?? 'Cuestionario',
              descripcion: root?.descripcion ?? '',
              tipo: root?.tipo ?? '',
              puntaje: root?.puntaje ?? 0,
              preguntas,
            };
          };
          const normalized = normalizeQuiz(json);
          if (mounted) setQuiz(normalized);
          if (mounted) setIdx(0);
          if (mounted) setError(null);
          if (alreadyCompleted) {
            const totalQs = Array.isArray(normalized?.preguntas) ? normalized.preguntas.length : 0;
            if (mounted) setIdx(totalQs);
            resultOpacity.setValue(0);
            resultTranslate.setValue(30);
            Animated.parallel([
              Animated.timing(resultOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(resultTranslate, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
          }
        } catch (e) {
          if (mounted) setError(e?.message || 'Error de red');
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  const preguntas = quiz?.preguntas || [];
  const total = preguntas.length || 0;
  const current = preguntas[idx] || null;

  React.useEffect(() => {
    if (barWidth > 0 && total > 0) {
      const target = (idx / total) * barWidth;
      Animated.timing(progressWidth, {
        toValue: target,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [idx, total, barWidth]);

  const handleSelect = async (resp) => {
    if (busy || !current || total === 0) return;
    setBusy(true);
    setSelectedId(resp.id);
    const isCorrect = !!resp.es_correcta;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    feedbackScale.setValue(0.8);
    Animated.sequence([
      Animated.spring(feedbackScale, { toValue: 1.1, useNativeDriver: true, friction: 4 }),
      Animated.spring(feedbackScale, { toValue: 1.0, useNativeDriver: true, friction: 5 }),
    ]).start();
    if (isCorrect) setCorrectCount((c) => c + 1);

    setTimeout(async () => {
      const next = idx + 1;
      if (next < total) {
        setIdx(next);
        setSelectedId(null);
        setFeedback(null);
        setBusy(false);
      } else {
        try {
          const finalCorrect = correctCount + (isCorrect ? 1 : 0);
          const totalQs = total;
          const points = quiz?.puntaje ? Math.round((finalCorrect / (totalQs || 1)) * quiz.puntaje) : finalCorrect;
          const stats = { correct: finalCorrect, total: totalQs, points, at: Date.now() };
          setFinalResult(stats);
          setStoredResult(stats);
          const keyUser = userId ?? 'anon';
          try {
            await AsyncStorage.setItem(`kira.quiz.completed.${QUIZ_ID}.${keyUser}`, 'true');
            await AsyncStorage.setItem(`kira.quiz.result.${QUIZ_ID}.${keyUser}`, JSON.stringify(stats));
          } catch {}
          if (userId !== null && userId !== undefined) {
            console.log('[GastronomiaQuiz] Submitting score', { QUIZ_ID, userId, finalCorrect });
            const result = await submitQuizScore(QUIZ_ID, userId, finalCorrect);
            console.log('[GastronomiaQuiz] Submit result =>', result);
            setSubmitInfo(result.ok ? { ok: true, ...(result.data || {}) } : { ok: false, ...(result.data || {}), error: result.error || result.data?.error });
          } else {
            console.log('[GastronomiaQuiz] Skip submit: userId missing');
          }
        } catch {}
        resultOpacity.setValue(0);
        resultTranslate.setValue(30);
        Animated.parallel([
          Animated.timing(resultOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(resultTranslate, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
        setCompleted(true);
        setIdx(total);
        setBusy(false);
      }
    }, 1200);
  };

  const answerColors = ['#10BCE2', '#3ED6AF', '#8CE27F', '#FEBA69'];

  return (
    <LinearGradient colors={["#2469A0", "#0D263A"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
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
            source={require('../../assets/images/logokira2.png')}
            className="w-[90px] h-[90px]"
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>

      <View className="mt-2 items-center">
        <View className="bg-white rounded-full px-5 py-4 shadow items-center" style={{ elevation: 3 }}>
          <Text className="text-[#2469A0] font-extrabold text-md">Gastronomía Nicaraguense</Text>
        </View>
      </View>

      <View className="flex-1 px-4 pt-4 pb-6">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white/90">Cargando cuestionario...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-center">{String(error)}</Text>
          </View>
        ) : total === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-center">No hay preguntas disponibles para este cuestionario.</Text>
          </View>
        ) : current && !completed ? (
          <>
            <View className="bg-white rounded-2xl p-4" style={{ minHeight: 120 }}>
              <Text className="text-[#0D263A] text-xl font-extrabold">Pregunta {idx + 1}{total ? ` / ${total}` : ''}</Text>
              <Text className="text-[#2D2D2D] mt-3 text-lg">{current.pregunta}</Text>
            </View>

            <View className="mt-5">
              {(current.respuestas || []).slice(0, 4).map((r, i) => {
                const bg = answerColors[i % answerColors.length];
                const selected = selectedId === r.id;
                const showState = selected && feedback;
                const borderColor = showState ? (feedback === 'correct' ? '#22C55E' : '#EF4444') : 'transparent';
                return (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.9}
                    disabled={busy}
                    onPress={() => handleSelect(r)}
                    className="rounded-2xl mb-4"
                    style={{
                      backgroundColor: bg,
                      paddingVertical: 18,
                      paddingHorizontal: 16,
                      borderWidth: 2,
                      borderColor,
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 3 },
                    }}
                  >
                    <Text className="text-white text-lg font-semibold">{r.respuesta}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-1">
              <View style={{ height: 10 }} className="bg-white/30 rounded-full overflow-hidden" onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
                <Animated.View className="bg-[#10BCE2]" style={{ width: progressWidth, height: '100%' }} />
              </View>
              <Text className="text-white/90 text-center mt-2 text-sm">Progreso: {total ? idx + 1 : 0}/{total || 0}</Text>
            </View>
          </>
        ) : null}
      </View>

      {feedback && (
        <View className="absolute inset-0 items-center justify-center">
          <Animated.View style={{ transform: [{ scale: feedbackScale }] }}>
            <View className="items-center justify-center rounded-2xl overflow-hidden" style={{ elevation: 4 }}>
              <LinearGradient colors={feedback === 'correct' ? ['#16A34A', '#22C55E'] : ['#DC2626', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 22, paddingHorizontal: 28 }}>
                <View className="items-center">
                  <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={64} color="#FFFFFF" />
                  <Text className="text-white text-2xl font-extrabold mt-2">{feedback === 'correct' ? '¡Correcto!' : 'Incorrecto'}</Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      )}

      {(completed || (!current && total > 0)) && (
        <View className="absolute inset-0 items-center justify-center px-6">
          <Animated.View className="bg-white rounded-2xl p-6 items-center w-full" style={{ opacity: resultOpacity, transform: [{ translateY: resultTranslate }] }}>
            <Text className="text-[#2469A0] text-3xl font-extrabold mb-2">¡Resultados!</Text>
            <Text className="text-[#2D2D2D] text-lg mb-2">Correctas: {(finalResult?.correct ?? storedResult?.correct ?? correctCount)} / {(finalResult?.total ?? storedResult?.total ?? total)}</Text>
            <Text className="text-[#2D2D2D] text-base mb-4">Puntaje: {finalResult?.points ?? storedResult?.points ?? (quiz?.puntaje ? Math.round((correctCount / total) * quiz.puntaje) : correctCount)}</Text>
            {!!submitInfo?.error && (<Text className="text-red-600 text-sm mb-2 text-center">{String(submitInfo.error)}</Text>)}
            {!!submitInfo?.message && !submitInfo?.error && (<Text className="text-emerald-600 text-sm mb-2 text-center">{String(submitInfo.message)}</Text>)}
            <TouchableOpacity className="bg-[#2469A0] rounded-full px-6 py-3" onPress={() => router.back()}>
              <Text className="text-white font-semibold">Volver</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}
