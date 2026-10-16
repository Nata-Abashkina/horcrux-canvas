// worker/index.ts
interface IWorkerEnv {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGIN: string;
  DEBUG?: string;
}

interface IIncomingBody {
  prompt: string;
  image: string | null;
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-flash';

// ============ RATE LIMITING ============

const RATE_LIMIT_PER_IP_PER_MIN = 10;
const RATE_LIMIT_GLOBAL_PER_DAY = 5000;
const BAN_DURATION_MS = 3 * 60 * 60 * 1000; // 3 часа

interface IRateBucket {
  count: number;
  resetAt: number;
  bannedUntil: number;
}

// In-memory хранилище. Живёт в изоляте Worker'а.
// Сбрасывается при redeploy и между изолятами, но даёт базовую защиту.
const ipBuckets = new Map<string, IRateBucket>();

let globalDayKey: string = '';
let globalDayCount: number = 0;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function checkAndConsumeIp(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  let bucket = ipBuckets.get(ip);

  if (bucket) {
    // Забанен?
    if (bucket.bannedUntil > now) {
      return { ok: false, retryAfter: Math.ceil((bucket.bannedUntil - now) / 1000) };
    }
    // Окно истекло — сбрасываем счётчик
    if (bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + 60_000, bannedUntil: 0 };
      ipBuckets.set(ip, bucket);
    }
  } else {
    bucket = { count: 0, resetAt: now + 60_000, bannedUntil: 0 };
    ipBuckets.set(ip, bucket);
  }

  bucket.count++;

  if (bucket.count > RATE_LIMIT_PER_IP_PER_MIN) {
    bucket.bannedUntil = now + BAN_DURATION_MS;
    return { ok: false, retryAfter: Math.ceil(BAN_DURATION_MS / 1000) };
  }

  return { ok: true };
}

function checkAndConsumeGlobal(): { ok: boolean; retryAfter?: number } {
  const today = todayKey();
  if (globalDayKey !== today) {
    globalDayKey = today;
    globalDayCount = 0;
  }
  globalDayCount++;
  if (globalDayCount > RATE_LIMIT_GLOBAL_PER_DAY) {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return { ok: false, retryAfter: Math.ceil((tomorrow.getTime() - Date.now()) / 1000) };
  }
  return { ok: true };
}

// ============ CORS ============

function getAllowedList(allowedList: string): string[] {
  return allowedList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsHeaders(origin: string, allowedList: string): Record<string, string> {
  const allowed = getAllowedList(allowedList);
  const matched = allowed.includes(origin) ? origin : allowed[0] ?? '';
  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  };
}

function isAllowedOrigin(origin: string, allowedList: string): boolean {
  if (!origin) return true; // curl / SSR / same-origin — пропускаем, но лимитируем
  return getAllowedList(allowedList).includes(origin);
}

// ============ MAIN ============

export default {
  async fetch(request: Request, env: IWorkerEnv): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedList = env.ALLOWED_ORIGIN ?? '';
    const debug = env.DEBUG === 'true';

    if (debug) {
      console.log('[worker] request', { method: request.method, origin });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    // Origin-проверка. Браузер с чужого домена отсекается здесь,
    // а не только CORS-заголовком (который — только для браузера).
    if (!isAllowedOrigin(origin, allowedList)) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        {
          status: 403,
          headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting по IP
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const ipCheck = checkAndConsumeIp(ip);
    if (!ipCheck.ok) {
      return new Response(
        JSON.stringify({ error: 'Too Many Requests', retryAfter: ipCheck.retryAfter }),
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin, allowedList),
            'Content-Type': 'application/json',
            'Retry-After': String(ipCheck.retryAfter ?? 60),
          },
        }
      );
    }

    // Глобальный дневной лимит (защита бюджета)
    const globalCheck = checkAndConsumeGlobal();
    if (!globalCheck.ok) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached', retryAfter: globalCheck.retryAfter }),
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin, allowedList),
            'Content-Type': 'application/json',
            'Retry-After': String(globalCheck.retryAfter ?? 3600),
          },
        }
      );
    }

    let body: IIncomingBody;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const { prompt, image, history } = body;

    if (!Array.isArray(history) || history.length === 0) {
      return new Response('Bad Request: empty history', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const currentContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    if (prompt && prompt.trim().length > 0) {
      currentContent.push({ type: 'text', text: prompt });
    }

    if (image && image.length > 0) {
      currentContent.push({ type: 'image_url', image_url: { url: image } });
    }

    if (currentContent.length === 0) {
      return new Response('Bad Request: empty input', {
        status: 400,
        headers: getCorsHeaders(origin, allowedList),
      });
    }

    const messages = [
      ...history,
      { role: 'user', content: currentContent },
    ];

    if (debug) {
      console.log('[worker] sending to DeepSeek', {
        model: MODEL,
        messagesCount: messages.length,
        hasImage: Boolean(image),
      });
    }

    let deepseekResponse: Response;
    try {
      deepseekResponse = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({ model: MODEL, messages }),
      });
    } catch (err) {
      if (debug) console.error('[worker] fetch to DeepSeek threw', err);
      return new Response(
        JSON.stringify({ error: 'DeepSeek fetch failed' }),
        {
          status: 502,
          headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
        }
      );
    }

    if (!deepseekResponse.ok) {
      const errText = await deepseekResponse.text().catch(() => '');
      if (debug) console.error('[worker] DeepSeek error', deepseekResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'DeepSeek error', status: deepseekResponse.status }),
        {
          status: 502,
          headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await deepseekResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...getCorsHeaders(origin, allowedList), 'Content-Type': 'application/json' },
    });
  },
};