// Centralized API helpers for scoring and user id resolution
import AsyncStorage from '@react-native-async-storage/async-storage';

export const resolveUserId = (session: any): number | string | null => {
  if (!session) return null;
  const candidate = session.idUsuario ?? session.userId ?? session.id ?? null;
  if (candidate != null) return candidate;
  // fallback: generate a stable hash from correo if exists
  if (session.correo) {
    let hash = 0; const s = String(session.correo);
    for (let i = 0; i < s.length; i++) { hash = (hash * 31 + s.charCodeAt(i)) >>> 0; }
    return hash; // numeric pseudo id
  }
  return null;
};

export const getSessionObject = async () => {
  try {
    const raw = await AsyncStorage.getItem('kira.session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const basePrimary = 'https://kira-pink-theta.vercel.app/actividades';

const withQuery = (url: string, params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  });
  // Add cache-buster timestamp to avoid CDN/stale caching
  sp.append('_ts', Date.now().toString());
  sp.append('_r', Math.random().toString(36).slice(2));
  return `${url}?${sp.toString()}`;
};

// Debug state (can be inspected in dev tools)
export const __apiDebug: any = {
  lastQuizUrl: null,
  lastQuizResponse: null,
  lastCoplaUrl: null,
  lastCoplaResponse: null,
  lastQuizRaw: null,
  lastCoplaRaw: null,
  attempts: [] as any[],
};

interface AttemptLog {
  kind: string; // POST | GET | GET_SLASH | RETRY
  url: string;
  status: number | null;
  ok: boolean;
  raw?: string | null;
  json?: any;
  error?: string;
}

const recordAttempt = (a: AttemptLog) => {
  try { __apiDebug.attempts.push(a); } catch {}
};

export const submitQuizScore = async (idCuestionario: number | string, idUsuario: number | string, cant_correcta: number) => {
  const url = `${basePrimary}/sumarPuntajeCuestionario`;
  const payload = {
    idCuestionario: Number(idCuestionario),
    idUsuario: Number(idUsuario),
    cant_correcta: Number(cant_correcta),
  };
  console.log('[submitQuizScore] POST ->', url, payload);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    let raw: string | null = null; try { raw = await res.text(); } catch {}
    let json: any = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
    console.log('[submitQuizScore] status:', res.status, 'raw:', raw);
    recordAttempt({ kind: 'POST_QUIZ', url, status: res.status, ok: res.ok, raw, json });
    __apiDebug.lastQuizUrl = url;
    __apiDebug.lastQuizRaw = raw;
    __apiDebug.lastQuizResponse = json;
    if (res.ok && json && json.message && !json.error) return { ok: true, status: res.status, message: json.message };
    const errorMsg = json?.error || json?.message || 'error-desconocido';
    return { ok: false, status: res.status, error: errorMsg, raw };
  } catch (e: any) {
    console.log('[submitQuizScore] exception:', e);
    return { ok: false, error: e?.message || 'network-error' };
  }
};

export const submitCoplaScore = async (idCopla: number | string, idUsuario: number | string) => {
  const url = `${basePrimary}/sumarPuntajeCopla`;
  const payload = { idCopla: Number(idCopla), idUsuario: Number(idUsuario) };
  console.log('[submitCoplaScore] POST ->', url, payload);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    let raw: string | null = null; try { raw = await res.text(); } catch {}
    let json: any = null; try { json = raw ? JSON.parse(raw) : null; } catch {}
    console.log('[submitCoplaScore] status:', res.status, 'raw:', raw);
    recordAttempt({ kind: 'POST_COPLA', url, status: res.status, ok: res.ok, raw, json });
    __apiDebug.lastCoplaUrl = url;
    __apiDebug.lastCoplaRaw = raw;
    __apiDebug.lastCoplaResponse = json;
    if (res.ok && json && json.message && !json.error) return { ok: true, status: res.status, message: json.message };
    const errorMsg = json?.error || json?.message || 'error-desconocido';
    return { ok: false, status: res.status, error: errorMsg, raw };
  } catch (e: any) {
    console.log('[submitCoplaScore] exception:', e);
    return { ok: false, error: e?.message || 'network-error' };
  }
};
